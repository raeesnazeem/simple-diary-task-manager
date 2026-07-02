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
  Kalam
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
      <body className={`${inter.variable} ${caveat.variable} ${architectsDaughter.variable} ${instrumentSans.variable} ${figtree.variable} ${urbanist.variable} ${instrumentSerif.variable} ${newsreader.variable} ${plusJakarta.variable} ${kalam.variable} font-figtree antialiased`}>
        {children}
      </body>
    </html>
  );
}
