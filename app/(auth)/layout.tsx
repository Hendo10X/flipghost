import Link from "next/link"

import { Wordmark } from "@/components/wordmark"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-xs pb-24">
          <Link href="/" className="mb-6 inline-flex" aria-label="Flipghost home">
            <Wordmark />
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}
