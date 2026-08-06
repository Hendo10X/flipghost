import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import "@/components/animata/button/algolia-blue-button.css"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-0 text-white",
        hotkey: "border-0 text-primary-foreground",
        outline:
          "border-border hover:bg-muted/70 hover:text-foreground active:not-aria-[haspopup]:scale-[0.98] aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:not-aria-[haspopup]:scale-[0.98] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground active:not-aria-[haspopup]:scale-[0.98] aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 active:not-aria-[haspopup]:scale-[0.98] dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline active:not-aria-[haspopup]:scale-[0.98]",
      },
      size: {
        default:
          "h-7 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-5 gap-1 rounded-sm px-2 text-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "h-6 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-8 gap-1.5 px-2.5 text-xs/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        // 44px. The sizes above are tuned for the workshop, where the toolbar
        // is dense on purpose and every control is a deliberate click. The
        // landing and auth pages are the opposite: a thumb, on a phone, on the
        // one button that matters. `lg` at 32px with 12px text was the ceiling
        // for both, and it belonged to neither.
        xl: "h-11 gap-2 px-4 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-xs": "size-5 rounded-sm [&_svg:not([class*='size-'])]:size-2.5",
        "icon-sm": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-lg": "size-8 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  nativeButton,
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const buttonClassName = cn(buttonVariants({ variant, size, className }))
  const buttonProps = {
    ...props,
    "data-slot": "button",
    // A custom `render` (e.g. a Link) usually isn't a native <button>.
    nativeButton: nativeButton ?? props.render === undefined,
  }

  const hasDepth = variant === "default" || variant === "hotkey"

  if (!hasDepth) {
    return (
      <ButtonPrimitive {...buttonProps} className={buttonClassName}>
        {children}
      </ButtonPrimitive>
    )
  }

  return (
    <ButtonPrimitive
      {...buttonProps}
      className={cn(
        buttonClassName,
        "button-lift group/button relative h-auto p-0"
      )}
    >
      <span
        className={cn(
          buttonClassName,
          "button-lift-surface pointer-events-none relative z-10",
          variant === "hotkey" && "button-lift-surface-hotkey"
        )}
      >
        {children}
      </span>
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
