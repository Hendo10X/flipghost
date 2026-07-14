"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { KeyboardIcon, Refresh01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  FIXED_HOTKEYS,
  formatHotkey,
  getHotkeysServerSnapshot,
  getHotkeysSnapshot,
  HOTKEY_ACTIONS,
  isBindableKey,
  resetHotkeys,
  setHotkey,
  subscribeHotkeys,
  type HotkeyAction,
} from "@/lib/hotkeys"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function Kbd({ children, className }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-foreground select-none",
        className
      )}
    >
      {children}
    </kbd>
  )
}

export function HotkeysMenu() {
  const keys = useSyncExternalStore(
    subscribeHotkeys,
    getHotkeysSnapshot,
    getHotkeysServerSnapshot
  )
  const [recording, setRecording] = useState<HotkeyAction | null>(null)

  // While recording, swallow the keypress before the editor's global handler
  // can act on it, then bind it.
  useEffect(() => {
    if (!recording) return

    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault()
      e.stopPropagation()

      const key = e.key.toLowerCase()
      if (key === "escape") {
        setRecording(null)
        return
      }
      if (!isBindableKey(e)) return

      setHotkey(recording!, key)
      setRecording(null)
    }

    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [recording])

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) setRecording(null)
      }}
    >
      <PopoverTrigger
        render={
          <Button size="lg" aria-label="Keyboard shortcuts">
            <HugeiconsIcon icon={KeyboardIcon} strokeWidth={1.8} />
            <span className="hidden lg:inline">Hotkeys</span>
          </Button>
        }
      />
      <PopoverContent side="bottom" align="end" className="w-72">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium">Keyboard shortcuts</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRecording(null)
              resetHotkeys()
            }}
            className="text-muted-foreground"
          >
            <HugeiconsIcon icon={Refresh01Icon} strokeWidth={1.8} />
            Reset
          </Button>
        </div>

        <p className="mt-1 text-[11px] text-pretty text-muted-foreground">
          {recording
            ? "Press any key to bind it, or Esc to cancel."
            : "Click a key to change it."}
        </p>

        <div className="mt-3 flex flex-col">
          {HOTKEY_ACTIONS.map(({ action, label }) => (
            <div
              key={action}
              className="flex items-center justify-between gap-3 py-1"
            >
              <span className="text-xs text-muted-foreground">{label}</span>
              <button
                type="button"
                aria-label={`Change shortcut for ${label}`}
                onClick={() =>
                  setRecording((current) => (current === action ? null : action))
                }
                className="outline-none"
              >
                <Kbd
                  className={cn(
                    "cursor-pointer transition-colors hover:border-ring",
                    recording === action &&
                      "border-ring bg-background text-muted-foreground italic"
                  )}
                >
                  {recording === action ? "Press…" : formatHotkey(keys[action])}
                </Kbd>
              </button>
            </div>
          ))}
        </div>

        <div className="my-3 h-px bg-border" />

        <div className="flex flex-col">
          {FIXED_HOTKEYS.map(({ label, keys: combo }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 py-1"
            >
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="flex items-center gap-1">
                {combo.split(" ").map((part, i) => (
                  <Kbd key={i} className="bg-transparent text-muted-foreground">
                    {part}
                  </Kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
