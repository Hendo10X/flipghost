"use client"

import { useState } from "react"
import type { Input as InputPrimitive } from "@base-ui/react/input"
import { EyeIcon, EyeClosedIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

function PasswordInput({ className, ...props }: InputPrimitive.Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <HugeiconsIcon
          icon={visible ? EyeIcon : EyeClosedIcon}
          className="size-4"
          strokeWidth={1.8}
        />
      </button>
    </div>
  )
}

export { PasswordInput }
