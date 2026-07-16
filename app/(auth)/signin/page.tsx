"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"

export default function SignInPage() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [googlePending, setGooglePending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onGoogle() {
    if (googlePending) return
    setGooglePending(true)
    setError(null)
    const { error } = await signIn.social({
      provider: "google",
      callbackURL: "/projects",
    })
    if (error) {
      setError(error.message ?? "Google sign-in failed. Please try again.")
      setGooglePending(false)
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(null)

    const { error } = await signIn.email({
      email: form.get("email") as string,
      password: form.get("password") as string,
    })

    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.")
      setPending(false)
      return
    }
    router.push("/projects")
  }

  return (
    /* Matches signup: tightens only below ~700px of viewport, where the
       alternative is the card overflowing and pinning to the top. */
    <div className="flex flex-col gap-4 [@media(min-height:700px)]:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight text-balance">
          Welcome back
        </h1>
        <p className="text-sm text-pretty text-muted-foreground">
          Sign in to keep your animations in sync.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            aria-invalid={error ? true : undefined}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            aria-invalid={error ? true : undefined}
          />
        </div>

        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="xl" disabled={pending} className="w-full">
          {pending && (
            <HugeiconsIcon
              icon={Loading03Icon}
              className="size-3.5 animate-spin"
            />
          )}
          Sign in
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground select-none">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="xl"
        disabled={googlePending}
        onClick={onGoogle}
        className="w-full"
      >
        {googlePending ? (
          <HugeiconsIcon
            icon={Loading03Icon}
            className="size-3.5 animate-spin"
          />
        ) : (
          <Image
            src="/images/google.svg"
            alt=""
            width={14}
            height={14}
            className="size-3.5"
          />
        )}
        Continue with Google
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
