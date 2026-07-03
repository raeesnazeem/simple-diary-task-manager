const { google } = require("googleapis")
const http = require("http")
const url = require("url")
const fs = require("fs")
const path = require("path")
const { shell, app, nativeImage } = require("electron")
require("dotenv").config()

const SCOPES = ["https://www.googleapis.com/auth/drive.file"]
const TOKENS_PATH = path.join(app.getPath("userData"), "google-tokens.json")

let oauth2Client

function getOAuthClient() {
  if (!oauth2Client) {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = "http://localhost:3005"

    if (!clientId || !clientSecret) {
      throw new Error("Google Client ID or Secret is missing in .env file")
    }

    oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

    // Load existing tokens if they exist
    if (fs.existsSync(TOKENS_PATH)) {
      const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"))
      oauth2Client.setCredentials(tokens)
    }
  }
  return oauth2Client
}

async function authenticate() {
  const client = getOAuthClient()

  if (client.credentials && client.credentials.refresh_token) {
    return true // Already authenticated
  }

  return new Promise((resolve, reject) => {
    // Generate the Google Login URL
    const authUrl = client.generateAuthUrl({
      access_type: "offline", // Request a refresh token
      scope: SCOPES,
    })

    // Create a temporary local server to catch the redirect
    const server = http
      .createServer(async (req, res) => {
        try {
          // Safely parse the URL using a base origin
          const parsedUrl = new url.URL(req.url, "http://localhost:3005")
          const code = parsedUrl.searchParams.get("code")

          // 1. Check if the code parameter exists anywhere in the incoming query
          if (code) {
            // Show success message in the browser immediately
            res.writeHead(200, { "Content-Type": "text/html" })
            res.end(
              "<h1>Authentication successful!</h1><p>You can close this window and return to itsNoted.</p>",
            )

            // Shut down the server loopback listener
            server.close()

            // 2. Exchange the code for the actual tokens
            const { tokens } = await client.getToken(code)
            client.setCredentials(tokens)

            // 3. Save tokens locally
            fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens))
            resolve(true)
          } else if (parsedUrl.pathname === "/favicon.ico") {
            // Ignore favicon requests without sending the "waiting" screen text
            res.writeHead(204)
            res.end()
          } else {
            // Fallback UI if the user navigates here manually without a token
            res.writeHead(200, { "Content-Type": "text/html" })
            res.end(
              "<h1>itsNoted Auth</h1><p>Waiting for Google authorization callback...</p>",
            )
          }
        } catch (e) {
          server.close()
          reject(e)
        }
      })
      .listen(3005, () => {
        // Open the user's default browser to the Google Login URL
        shell.openExternal(authUrl)
      })
  })
}

// Helper to get or create folder in Google Drive
async function getOrCreateFolder(drive, folderName, parentId = null) {
  const q = parentId
    ? `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`

  const res = await drive.files.list({
    q,
    spaces: "drive",
    fields: "files(id, name)",
  })

  if (res.data.files.length > 0) {
    return res.data.files[0].id
  } else {
    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      ...(parentId && { parents: [parentId] }),
    }
    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: "id",
    })
    return folder.data.id
  }
}

async function syncToDrive() {
  try {
    await authenticate()
    const drive = google.drive({ version: "v3", auth: getOAuthClient() })

    // 1. Get/Create main folder "itsNoted Backups"
    const mainFolderId = await getOrCreateFolder(drive, "itsNoted Backups")

    // 2. Upload diary-data.json
    const dataPath = path.join(app.getPath("userData"), "diary-data.json")
    if (fs.existsSync(dataPath)) {
      const qData = `name='diary-data.json' and '${mainFolderId}' in parents and trashed=false`
      const resData = await drive.files.list({ q: qData, fields: "files(id)" })

      const media = {
        mimeType: "application/json",
        body: fs.createReadStream(dataPath),
      }

      if (resData.data.files.length > 0) {
        await drive.files.update({
          fileId: resData.data.files[0].id,
          media: media,
        })
      } else {
        await drive.files.create({
          resource: {
            name: "diary-data.json",
            parents: [mainFolderId],
          },
          media: media,
          fields: "id",
        })
      }
    }

    // 3. Upload images
    const imagesDir = path.join(app.getPath("userData"), "images")
    if (fs.existsSync(imagesDir)) {
      const imagesFolderId = await getOrCreateFolder(
        drive,
        "images",
        mainFolderId,
      )

      // Get all existing images in Drive so we don't upload duplicates
      const resImages = await drive.files.list({
        q: `'${imagesFolderId}' in parents and trashed=false`,
        fields: "files(id, name)",
      })
      const existingImages = new Set(resImages.data.files.map((f) => f.name))

      const localImages = fs.readdirSync(imagesDir)
      for (const img of localImages) {
        if (!existingImages.has(img) && !img.startsWith('.')) {
          const isImage = img.match(/\.(png|jpe?g|webp|gif)$/i);
          const isAudio = img.endsWith('.webm');
          
          if (!isImage && !isAudio) continue;

          let mediaBody;
          let mimeType;

          if (isImage && nativeImage) {
            const image = nativeImage.createFromPath(path.join(imagesDir, img));
            if (!image.isEmpty()) {
              const compressedBuffer = image.toJPEG(50); // compress to 50% quality JPEG
              const { PassThrough } = require('stream');
              const bufferStream = new PassThrough();
              bufferStream.end(compressedBuffer);
              mediaBody = bufferStream;
              mimeType = "image/jpeg";
            } else {
              mediaBody = fs.createReadStream(path.join(imagesDir, img));
              mimeType = "application/octet-stream";
            }
          } else {
            mediaBody = fs.createReadStream(path.join(imagesDir, img));
            mimeType = isAudio ? "audio/webm" : "application/octet-stream";
          }

          const media = {
            mimeType: mimeType,
            body: mediaBody,
          }
          await drive.files.create({
            resource: {
              name: img,
              parents: [imagesFolderId],
            },
            media: media,
            fields: "id",
          })
        }
      }
    }

    return { success: true }
  } catch (err) {
    console.error("Sync error:", err)
    return { success: false, error: err.message }
  }
}

module.exports = { syncToDrive }
