import type { Metadata } from "next"
import { Geist_Mono, Inter, Momo_Trust_Display } from "next/font/google"

import "./globals.css"
import { SoundProvider } from "@/components/sound-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

/**
 * Absolute base for every og:image and canonical URL. Without it Next emits
 * relative ones, which no scraper resolves — so the blog and tutorial previews
 * have been quietly broken rather than merely plain.
 *
 * VERCEL_PROJECT_PRODUCTION_URL is the production domain on Vercel whichever
 * deployment is running, so a preview build still points its previews at the
 * real site instead of a throwaway deploy URL.
 */
function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return "http://localhost:3000"
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Flipghost | Flipbook animation in your browser",
  description:
    "Draw frame by frame, trace motion with onion skinning, and export looping GIFs or MP4s. No installs, no setup.",
  openGraph: {
    type: "website",
    siteName: "Flipghost",
    title: "Flipghost | Flipbook animation in your browser",
    description:
      "Draw frame by frame, trace motion with onion skinning, and export looping GIFs or MP4s. No installs, no setup.",
  },
  twitter: {
    card: "summary_large_image",
  },
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
