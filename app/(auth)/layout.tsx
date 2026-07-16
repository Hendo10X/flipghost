import Link from "next/link"

import { Wordmark } from "@/components/wordmark"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* The padding is a floor, not the spacing: once the card fits, centring
          decides where it sits and gives it ~95-150px either side on a phone.
          Padding only takes effect when the card *cannot* fit — and then a
          large value is actively harmful, because it is what pushes the card
          over the edge and pins it to the top. Small here means "fits, and
          therefore centres" on more screens; it grows once there is room to
          spare, where it costs nothing. */}
      <main className="flex flex-1 items-center justify-center px-6 py-4 [@media(min-height:700px)]:py-12">
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
