import path from "node:path"
import type { NextConfig } from "next"
import { createMDX } from "fumadocs-mdx/next"

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(import.meta.dirname),
  },
}

const withMDX = createMDX()

export default withMDX(nextConfig)
