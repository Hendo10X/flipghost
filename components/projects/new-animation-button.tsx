"use client"

import { useRouter } from "next/navigation"
import { ArrowDown01Icon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { STAGE_PRESETS } from "@/lib/flipbook/store"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NewAnimationButton() {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="lg" className="px-3">
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
            New animation
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              className="-mr-0.5 size-3 opacity-80"
              strokeWidth={2}
            />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>Choose a canvas size</DropdownMenuLabel>
        {STAGE_PRESETS.map((preset) => (
          <DropdownMenuItem
            key={preset.id}
            onClick={() => router.push(`/workshop?new=${preset.id}`)}
          >
            <span className="flex-1">{preset.label}</span>
            <span className="text-muted-foreground tabular-nums">
              {preset.width}×{preset.height}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
