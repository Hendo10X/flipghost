import path from "node:path"
import type { NextConfig } from "next"
import { createMDX } from "fumadocs-mdx/next"

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(import.meta.dirname),
  },
  images: {
    remotePatterns: [
      // Cover images for the blog, changelog, and tutorials are uploaded to
      // Marble and served from its CDN. The docs name cdn.marblecms.com; the
      // wildcard is here because next/image throws on an unlisted host, and a
      // post rendering a 500 is a worse outcome than allowing a sibling
      // subdomain of a domain we already trust.
      { protocol: "https", hostname: "**.marblecms.com" },
    ],
  },
}

const withMDX = createMDX()

export default withMDX(nextConfig)
