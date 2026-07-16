"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { signIn, signUp } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"

export default function SignUpPage() {
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

    const { error } = await signUp.email({
      name: form.get("name") as string,
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
    /* gap-6 is the design; it only tightens where the alternative is worse.
       Below ~700px of viewport the card cannot fit, so it stops being centred
       and pins to the top with the footer link pushed off screen. 16px of
       rhythm is a cheaper thing to lose than the centring and the scroll. */
    <div className="flex flex-col gap-4 [@media(min-height:700px)]:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight text-balance">
          Create your account
        </h1>
        <p className="text-sm text-pretty text-muted-foreground">
          Save your flipbooks and pick up where you left off.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Ray Harryhausen"
            required
          />
        </div>
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
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
          Create account
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
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
