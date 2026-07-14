import type { Metadata } from "next"
import { Geist_Mono, Inter, Momo_Trust_Display } from "next/font/google"

import "./globals.css"
import { SoundProvider } from "@/components/sound-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Flipghost | Flipbook animation in your browser",
  description:
    "Draw frame by frame, trace motion with onion skinning, and export looping GIFs or MP4s. No installs, no setup.",
}

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// Landing-page display typeface for headings (single 400 weight).
const momoTrustDisplay = Momo_Trust_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
        momoTrustDisplay.variable
      )}
    >
      <body>
        <ThemeProvider>
          <SoundProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
