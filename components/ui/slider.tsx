"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({ className, ...props }: SliderPrimitive.Root.Props) {
  return (
    <SliderPrimitive.Root data-slot="slider" className={className} {...props}>
      <SliderPrimitive.Control className="flex h-4 w-full items-center">
        <SliderPrimitive.Track className="h-1 w-full rounded-full bg-muted select-none">
          <SliderPrimitive.Indicator className="h-1 rounded-full bg-primary select-none" />
          <SliderPrimitive.Thumb
            className={cn(
              "size-3 rounded-full bg-background shadow-sm ring-1 ring-border outline-none select-none focus-visible:ring-2 focus-visible:ring-ring",
              className
            )}
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
