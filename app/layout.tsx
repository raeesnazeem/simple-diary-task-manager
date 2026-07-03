import type { Metadata } from "next";
import { 
  Inter, 
  Caveat, 
  Architects_Daughter,
  Instrument_Sans,
  Figtree,
  Urbanist,
  Instrument_Serif,
  Newsreader,
  Plus_Jakarta_Sans,
  Kalam,
  Patrick_Hand,
  Handlee,
  Shadows_Into_Light,
  Neucha,
  Permanent_Marker,
  Homemade_Apple,
  Nanum_Pen_Script,
  Indie_Flower,
  Gochi_Hand
} from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const caveat = Caveat({ subsets: ["latin"], variable: '--font-caveat' });
const architectsDaughter = Architects_Daughter({ weight: "400", subsets: ["latin"], variable: '--font-architects' });
const instrumentSans = Instrument_Sans({ subsets: ["latin"], variable: '--font-instrument-sans', adjustFontFallback: false });
const figtree = Figtree({ subsets: ["latin"], variable: '--font-figtree' });
const urbanist = Urbanist({ subsets: ["latin"], variable: '--font-urbanist' });
const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: '--font-instrument-serif', adjustFontFallback: false });
const newsreader = Newsreader({ subsets: ["latin"], variable: '--font-newsreader', adjustFontFallback: false });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: '--font-plus-jakarta' });
const kalam = Kalam({ weight: ["300", "400", "700"], subsets: ["latin"], variable: '--font-kalam' });
const patrickHand = Patrick_Hand({ weight: "400", subsets: ["latin"], variable: '--font-patrick-hand', adjustFontFallback: false });
const handlee = Handlee({ weight: "400", subsets: ["latin"], variable: '--font-handlee', adjustFontFallback: false });
const shadowsIntoLight = Shadows_Into_Light({ weight: "400", subsets: ["latin"], variable: '--font-shadows-into-light', adjustFontFallback: false });
const neucha = Neucha({ weight: "400", subsets: ["latin"], variable: '--font-neucha', adjustFontFallback: false });
const permanentMarker = Permanent_Marker({ weight: "400", subsets: ["latin"], variable: '--font-permanent-marker', adjustFontFallback: false });
const homemadeApple = Homemade_Apple({ weight: "400", subsets: ["latin"], variable: '--font-homemade-apple', adjustFontFallback: false });
const nanumPenScript = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], variable: '--font-nanum-pen-script', adjustFontFallback: false });
const indieFlower = Indie_Flower({ weight: "400", subsets: ["latin"], variable: '--font-indie-flower', adjustFontFallback: false });
const gochiHand = Gochi_Hand({ weight: "400", subsets: ["latin"], variable: '--font-gochi-hand', adjustFontFallback: false });

export const metadata: Metadata = {
  title: "Simple Diary",
  description: "Minimalistic Desktop Diary and Task Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${caveat.variable} ${architectsDaughter.variable} ${instrumentSans.variable} ${figtree.variable} ${urbanist.variable} ${instrumentSerif.variable} ${newsreader.variable} ${plusJakarta.variable} ${kalam.variable} ${patrickHand.variable} ${handlee.variable} ${shadowsIntoLight.variable} ${neucha.variable} ${permanentMarker.variable} ${homemadeApple.variable} ${nanumPenScript.variable} ${indieFlower.variable} ${gochiHand.variable} font-figtree antialiased`}>
        {children}
      </body>
    </html>
  );
}
