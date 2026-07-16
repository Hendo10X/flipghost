import Link from "next/link"

import { Wordmark } from "@/components/wordmark"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* py-12 rather than a bare items-center: if the card ever grows past a
          short viewport, centred flex content overflows equally in both
          directions and the top — the wordmark and the heading — becomes
          unreachable above the scroll origin. The padding gives it somewhere
          to land instead. */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-xs">
          <Link href="/" className="mb-6 inline-flex" aria-label="Flipghost home">
            <Wordmark />
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}
