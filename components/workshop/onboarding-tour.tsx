"use client"

import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/lib/utils"
import { useFlipbook } from "@/lib/flipbook/store"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "flipghost:tour-completed:v1"

export interface TourStep {
  target: string
  title: string
  description: string
  position?: "top" | "bottom" | "left" | "right" | "center"
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="canvas"]',
    title: "1. The Drawing Canvas",
    description:
      "This is your primary animation stage. Draw freehand frame-by-frame, pan around, and zoom with Ctrl + scroll or shortcut controls.",
    position: "bottom",
  },
  {
    target: '[data-tour="tools"]',
    title: "2. Drawing Tools",
    description:
      "Switch between Select (V), Brush (B), and Eraser (E) tools to craft your artwork.",
    position: "right",
  },
  {
    target: '[data-tour="color-picker"]',
    title: "3. Colors & Swatches",
    description:
      "Pick from curated preset colors, sample from your canvas with the eyedropper, or open the custom color wheel.",
    position: "right",
  },
  {
    target: '[data-tour="brush-size"]',
    title: "4. Brush Thickness",
    description:
      "Choose your brush stroke width (4px, 8px, 16px, or 32px) for fine details or broad shading.",
    position: "right",
  },
  {
    target: '[data-tour="undo-redo"]',
    title: "5. Undo, Redo & Clear",
    description:
      "Quickly undo edits (Ctrl+Z), redo changes (Ctrl+Shift+Z), or clear the current frame canvas.",
    position: "right",
  },
  {
    target: '[data-tour="project-title"]',
    title: "6. Title & Aspect Ratio",
    description:
      "Give your animation a title and select your canvas aspect ratio (Square 1:1, Full HD 16:9, Story 9:16, 4:3).",
    position: "bottom",
  },
  {
    target: '[data-tour="playback-fps"]',
    title: "7. Playback & Animation Speed",
    description:
      "Press Space to play your flipbook animation, and set your target speed from 1 to 30 frames per second.",
    position: "top",
  },
  {
    target: '[data-tour="onion-skin"]',
    title: "8. Onion Skinning Ghosts",
    description:
      "Trace motion easily with ghost overlays of previous (red) and next (green) frames. Click the arrow to adjust ghost count and opacity.",
    position: "top",
  },
  {
    target: '[data-tour="export"]',
    title: "9. Export & Help",
    description:
      "Export your animation as a looping GIF or MP4 video! Click the '?' icon in the header anytime to view hotkeys or re-launch this tour.",
    position: "bottom",
  },
]

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

export function OnboardingTour() {
  const tourOpen = useFlipbook((s) => s.tourOpen)
  const currentStep = useFlipbook((s) => s.tourStep)
  const startTour = useFlipbook((s) => s.startTour)
  const nextTourStep = useFlipbook((s) => s.nextTourStep)
  const prevTourStep = useFlipbook((s) => s.prevTourStep)
  const closeTour = useFlipbook((s) => s.closeTour)

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  })
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 1024)
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const step = TOUR_STEPS[currentStep]

  const updatePosition = useCallback(() => {
    if (!step) return
    const el = document.querySelector(step.target)
    if (!el) {
      setTargetRect((prev) => (prev === null ? prev : null))
      return
    }

    const rect = el.getBoundingClientRect()
    const padding = 8
    const paddedRect = {
      top: Math.max(8, rect.top - padding),
      left: Math.max(8, rect.left - padding),
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    }

    setTargetRect((prev) => {
      if (
        prev &&
        prev.top === paddedRect.top &&
        prev.left === paddedRect.left &&
        prev.width === paddedRect.width &&
        prev.height === paddedRect.height
      ) {
        return prev
      }
      return paddedRect
    })

    // Calculate popover coordinates based on position preference and viewport bounds
    const popoverWidth = 320
    const popoverHeight = 200
    const margin = 16

    let top = 0
    let left = 0

    const pos = step.position || "bottom"

    switch (pos) {
      case "right":
        left = paddedRect.left + paddedRect.width + margin
        top = paddedRect.top + paddedRect.height / 2 - popoverHeight / 2
        break
      case "left":
        left = paddedRect.left - popoverWidth - margin
        top = paddedRect.top + paddedRect.height / 2 - popoverHeight / 2
        break
      case "top":
        left = paddedRect.left + paddedRect.width / 2 - popoverWidth / 2
        top = paddedRect.top - popoverHeight - margin
        break
      case "bottom":
      default:
        left = paddedRect.left + paddedRect.width / 2 - popoverWidth / 2
        top = paddedRect.top + paddedRect.height + margin
        break
    }

    // Viewport collision bounds clamp
    const maxLeft = window.innerWidth - popoverWidth - 20
    const maxTop = window.innerHeight - popoverHeight - 20

    left = Math.max(20, Math.min(left, maxLeft))
    top = Math.max(20, Math.min(top, maxTop))

    setPopoverPos((prev) => {
      if (prev?.top === top && prev?.left === left) return prev
      return { top, left }
    })
  }, [step])

  // Check if user is a new registrant before auto-triggering on first visit
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024) return

    try {
      const isNewSignup = window.localStorage.getItem("flipghost:is-new-signup") === "true"
      const completed = window.localStorage.getItem(STORAGE_KEY) === "true"
      if (isNewSignup && !completed) {
        // Small delay to ensure DOM layout has rendered
        const timer = setTimeout(() => {
          startTour()
        }, 800)
        return () => clearTimeout(timer)
      }
    } catch {
      // Storage unavailable
    }
  }, [startTour])

  // Listen for manual trigger from header help button
  useEffect(() => {
    window.addEventListener("flipghost:start-tour", startTour)
    return () => window.removeEventListener("flipghost:start-tour", startTour)
  }, [startTour])

  // Update target rect on window resize or step change
  useLayoutEffect(() => {
    if (!tourOpen) return

    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    const frameId = requestAnimationFrame(() => {
      updatePosition()
    })

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [tourOpen, currentStep, updatePosition])

  // Keyboard navigation
  useEffect(() => {
    if (!tourOpen) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        closeTour()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        nextTourStep(TOUR_STEPS.length)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        prevTourStep()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [tourOpen, currentStep, nextTourStep, prevTourStep, closeTour])

  function handleNext() {
    nextTourStep(TOUR_STEPS.length)
  }

  function handleBack() {
    prevTourStep()
  }

  function handleClose() {
    closeTour()
    try {
      window.localStorage.setItem(STORAGE_KEY, "true")
      window.localStorage.removeItem("flipghost:is-new-signup")
    } catch {
      // Storage blocked
    }
  }

  if (!isDesktop || !tourOpen || !step) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Semi-transparent backdrop with spotlight cutout around target element */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300" />

      {/* Spotlight highlight border around active step target */}
      {targetRect && (
        <div
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
          }}
          className={cn(
            "pointer-events-none absolute rounded-xl border-2 border-primary/80 shadow-[0_0_25px_rgba(56,189,248,0.35)] transition-all duration-300 ease-out",
            "ring-4 ring-primary/20"
          )}
        />
      )}

      {/* Tour popover card */}
      <div
        style={{
          top: `${popoverPos.top}px`,
          left: `${popoverPos.left}px`,
        }}
        className={cn(
          "absolute z-50 flex w-[320px] flex-col gap-3 rounded-2xl border bg-popover/95 p-4 text-popover-foreground shadow-2xl backdrop-blur-md",
          "animate-in fade-in-0 zoom-in-95 duration-200 ease-out"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <HugeiconsIcon icon={SparklesIcon} className="size-4" strokeWidth={2} />
            <span>
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Close tour"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          </Button>
        </div>

        {/* Step Content */}
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold tracking-tight">{step.title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {step.description}
          </p>
        </div>

        {/* Step progress indicators */}
        <div className="flex items-center gap-1 my-1">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-200",
                i === currentStep
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted hover:bg-muted-foreground/40"
              )}
            />
          ))}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={handleClose}
            className="text-xs text-muted-foreground"
          >
            Skip
          </Button>

          <div className="flex items-center gap-1.5">
            {currentStep > 0 && (
              <Button variant="outline" size="xs" onClick={handleBack}>
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3" strokeWidth={2} />
                Back
              </Button>
            )}

            <Button size="xs" onClick={handleNext} className="gap-1 px-3">
              <span>{currentStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}</span>
              {currentStep < TOUR_STEPS.length - 1 && (
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" strokeWidth={2} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
