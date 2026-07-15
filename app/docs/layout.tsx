import type { ReactNode } from "react"
import { DocsLayout } from "fumadocs-ui/layouts/docs"
import { RootProvider } from "fumadocs-ui/provider/next"

import { source } from "@/lib/source"
import { Wordmark } from "@/components/wordmark"

export default function DocsRootLayout({ children }: { children: ReactNode }) {
  return (
    // The root layout already wraps the app in next-themes. A second provider
    // would fight it over the class on <html>, so this one stays off.
    <RootProvider theme={{ enabled: false }}>
      <DocsLayout tree={source.pageTree} nav={{ title: <Wordmark />, url: "/" }}>
        {children}
      </DocsLayout>
    </RootProvider>
  )
}
