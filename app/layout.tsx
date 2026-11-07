import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif, Noto_Sans_Syriac } from "next/font/google";
import { Shell } from "@/components/Shell";
import { Motion } from "@/components/Motion";
import { MusicProvider } from "@/components/music/MusicProvider";
import { MusicBar } from "@/components/music/MusicBar";
import "./globals.css";

// Fonts are downloaded at build time and self-hosted (no runtime call to Google).
const sans = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const syriac = Noto_Sans_Syriac({ subsets: ["syriac"], weight: "400", variable: "--font-syriac", display: "swap" });

export const metadata: Metadata = {
  title: { default: "URHA — The Path to Mastery", template: "%s · URHA" },
  description: "Seek. Learn. Build. Become. A personal learning, mastery and reflection system.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${sans.variable} ${serif.variable} ${syriac.variable}`}>
      <body>
        <Motion>
          <MusicProvider>
            <Shell>{children}</Shell>
            <MusicBar />
          </MusicProvider>
        </Motion>
      </body>
    </html>
  );
}
