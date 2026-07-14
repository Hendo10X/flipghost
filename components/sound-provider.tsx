"use client"

import { useEffect } from "react"
import { bind } from "cuelume"

import { isSoundEnabled, setSoundEnabled } from "@/lib/sound"

/**
 * Wires up all `data-cuelume-*` interaction sounds once and restores the
 * user's saved on/off preference. Safe to mount anywhere client-side.
 */
export function SoundProvider() {
  useEffect(() => {
    setSoundEnabled(isSoundEnabled())
    bind()
  }, [])

  return null
}
