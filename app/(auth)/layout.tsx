import Link from "next/link"
import { GhostIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium select-none"
        >
          <HugeiconsIcon icon={GhostIcon} className="size-4" strokeWidth={2} />
          Flipghost
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-xs pb-24">{children}</div>
      </main>
    </div>
  )
}
