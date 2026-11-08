import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif, Marcellus, Noto_Sans_Syriac } from "next/font/google";
import { Shell } from "@/components/Shell";
import { Motion } from "@/components/Motion";
import { MusicProvider } from "@/components/music/MusicProvider";
import { MusicBar } from "@/components/music/MusicBar";
import { headers } from "next/headers";
import { studioAllowed } from "@/lib/studio-access";
import "./globals.css";

// Fonts are downloaded at build time and self-hosted (no runtime call to Google).
const sans = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const display = Marcellus({ subsets: ["latin"], weight: "400", variable: "--font-display", display: "swap" });
const syriac = Noto_Sans_Syriac({ subsets: ["syriac"], weight: "400", variable: "--font-syriac", display: "swap" });

export const metadata: Metadata = {
  title: { default: "URHA, the eternal realm of knowledge", template: "%s · URHA" },
  description: "Seek Knowledge. Discover Wisdom. Achieve Mastery.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const studio = studioAllowed((await headers()).get("host"));
  return (
    <html lang="en-GB" className={`${sans.variable} ${serif.variable} ${display.variable} ${syriac.variable}`}>
      <body>
        <Motion>
          <MusicProvider>
            <Shell studio={studio}>{children}</Shell>
            <MusicBar />
          </MusicProvider>
        </Motion>
      </body>
    </html>
  );
}
