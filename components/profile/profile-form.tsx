"use client"

import { useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  CheckmarkCircle02Icon,
  Loading03Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  getSoundServerSnapshot,
  getSoundSnapshot,
  setSoundEnabled,
  subscribeSound,
} from "@/lib/sound"
import { signOut, updateUser } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { UserAvatar } from "@/components/user-avatar"

interface ProfileFormProps {
  userId: string
  name: string
  email: string
}

export function ProfileForm({ userId, name, email }: ProfileFormProps) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()

  const [displayName, setDisplayName] = useState(name)
  const [savingName, setSavingName] = useState(false)
  const [savedName, setSavedName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const sound = useSyncExternalStore(
    subscribeSound,
    getSoundSnapshot,
    getSoundServerSnapshot
  )
  // Server renders false; the client "true" flips on after hydration without
  // an effect, so theme-dependent controls stay hydration-safe.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  async function saveName() {
    const trimmed = displayName.trim()
    if (savingName || !trimmed || trimmed === name) return
    setSavingName(true)
    setSavedName(false)
    setNameError(null)
    const { error } = await updateUser({ name: trimmed })
    setSavingName(false)
    if (error) {
      setNameError(error.message ?? "Couldn't save. Please try again.")
      return
    }
    setSavedName(true)
    router.refresh()
  }

  const darkMode = mounted ? resolvedTheme === "dark" : false

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <UserAvatar seed={userId} size={56} className="rounded-full" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <div className="flex items-center gap-2">
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value)
              setSavedName(false)
            }}
            maxLength={60}
            className="flex-1"
          />
          <Button
            size="lg"
            disabled={
              savingName ||
              !displayName.trim() ||
              displayName.trim() === name
            }
            onClick={saveName}
          >
            {savingName ? (
              <HugeiconsIcon
                icon={Loading03Icon}
                className="size-3.5 animate-spin"
              />
            ) : savedName ? (
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />
            ) : null}
            {savedName ? "Saved" : "Save"}
          </Button>
        </div>
        {nameError && (
          <p role="alert" className="text-xs text-destructive">
            {nameError}
          </p>
        )}
      </section>

      <section className="flex flex-col divide-y divide-border rounded-lg border">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Dark mode</p>
            <p className="text-xs text-muted-foreground">
              Switch between light and dark themes.
            </p>
          </div>
          <Switch
            checked={darkMode}
            disabled={!mounted}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label="Dark mode"
          />
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Interaction sounds</p>
            <p className="text-xs text-muted-foreground">
              Play subtle sounds for clicks and actions.
            </p>
          </div>
          <Switch
            checked={sound}
            disabled={!mounted}
            onCheckedChange={(checked) => setSoundEnabled(checked)}
            aria-label="Interaction sounds"
          />
        </div>
      </section>

      <Button
        variant="outline"
        size="lg"
        className="self-start"
        onClick={() =>
          signOut({
            fetchOptions: {
              onSuccess: () => {
                window.location.href = "/"
              },
            },
          })
        }
      >
        <HugeiconsIcon icon={Logout01Icon} strokeWidth={1.8} />
        Sign out
      </Button>
    </div>
  )
}
