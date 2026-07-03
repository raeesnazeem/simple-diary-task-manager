# Google Drive API Setup Guide

Hello! This is a simple, step-by-step guide to get your Google Drive `Client ID` and `Client Secret`. You need these two secret keys so your app can safely talk to your Google Drive. 

Please follow these steps carefully.

### Part 1: Create a Project
1. Open your web browser and go to [Google Cloud Console](https://console.cloud.google.com/).
2. Log in with your normal Google Gmail account.
3. At the top left, right next to the "Google Cloud" logo, click on the **Select a project** dropdown.
4. In the popup window, click the **NEW PROJECT** button at the top right.
5. Give your project a name (for example, `itsNoted Backup App`) and click **CREATE**. 
6. Wait a few seconds, then click **Select Project** in the notification that appears at the top right.

### Part 2: Enable Google Drive API
1. On the left side menu, click on **APIs & Services** -> **Library**.
2. In the search bar, type `Google Drive API` and press Enter.
3. Click on **Google Drive API** from the results.
4. Click the blue **ENABLE** button.

### Part 3: Configure the Consent Screen
1. On the left menu, click **APIs & Services** -> **OAuth consent screen**.
2. Under "User Type", select **External** and click **CREATE**. (Don't worry, this doesn't mean anyone can use it. We will keep it in "Testing" mode).
3. **App Information**: 
   - App name: `itsNoted`
   - User support email: Select your email from the dropdown.
4. Scroll down to **Developer contact information** and put your email there too. 
5. Click **SAVE AND CONTINUE**.
6. On the "Scopes" page, just scroll down and click **SAVE AND CONTINUE**.
7. On the "Test users" page, click **+ ADD USERS**.
8. Type your own Gmail address here. This is very important! Only the emails added here will be allowed to sync.
9. Click **ADD**, then **SAVE AND CONTINUE**.
10. Scroll down and click **BACK TO DASHBOARD**.

### Part 4: Get Your Secret Keys (Credentials)
1. On the left menu, click **Credentials**.
2. Click the **+ CREATE CREDENTIALS** button at the top, and select **OAuth client ID**.
3. Under "Application type", click the dropdown and select **Desktop app**.
4. Give it a name (like `itsNoted Desktop Client`).
5. Click **CREATE**.
6. A popup will appear showing your **Client ID** and **Client Secret**.

### Part 5: Save Keys to Your App
1. Go to your code editor where the `itsNoted` app code is.
2. Create a new file in the main root folder and name it exactly: `.env`
3. Copy the format below, paste it into the new file, and replace the values with your keys:

```env
GOOGLE_CLIENT_ID="YOUR_CLIENT_ID_HERE"
GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET_HERE"
```

That's it! Your app is now ready to safely sync data to your Google Drive.
