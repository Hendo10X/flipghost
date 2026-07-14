import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { auth } from "@/lib/auth"
import { Wordmark } from "@/components/wordmark"
import { ProfileForm } from "@/components/profile/profile-form"

export const metadata: Metadata = {
  title: "Profile | Flipghost",
}

export default async function ProfilePage() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null)
  if (!session) redirect("/signin")

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/projects" className="inline-flex">
          <Wordmark />
        </Link>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
          Back to animations
        </Link>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-6 pb-16">
        <h1 className="mb-6 text-lg font-semibold tracking-tight">Profile</h1>
        <ProfileForm
          userId={session.user.id}
          name={session.user.name}
          email={session.user.email}
        />
      </main>
    </div>
  )
}
