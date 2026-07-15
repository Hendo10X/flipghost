"use client"

import Link from "next/link"
import { Dialog } from "@base-ui/react/dialog"
import { NavigationMenu } from "@base-ui/react/navigation-menu"
import {
  ArrowDown01Icon,
  Cancel01Icon,
  Film01Icon,
  GhostIcon,
  Menu01Icon,
  PaintBoardIcon,
  PlayListIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import { Wordmark } from "@/components/wordmark"
import { cn } from "@/lib/utils"

interface FeatureLink {
  title: string
  description: string
  href: string
  icon: typeof GhostIcon
}

const PRODUCT: FeatureLink[] = [
  {
    title: "Canvas & brushes",
    description: "Low-latency freehand drawing.",
    href: "/docs",
    icon: PaintBoardIcon,
  },
  {
    title: "Onion skinning",
    description: "Trace motion between frames.",
    href: "/docs",
    icon: GhostIcon,
  },
  {
    title: "Timeline",
    description: "Reorder and duplicate frames.",
    href: "/docs",
    icon: PlayListIcon,
  },
  {
    title: "Export",
    description: "Looping GIF and MP4 output.",
    href: "/docs",
    icon: Film01Icon,
  },
]

const RESOURCES: { label: string; href: string }[] = [
  { label: "Documentation", href: "/docs" },
  { label: "Tutorials", href: "/tutorials" },
  { label: "Changelog", href: "/changelog" },
  { label: "Community", href: "/community" },
]

const triggerClass =
  "group flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors outline-none select-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 data-[popup-open]:text-foreground"

export function LandingNav() {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4">
      <Link href="/" className="col-start-1 justify-self-start">
        <Wordmark />
      </Link>

      <NavigationMenu.Root className="col-start-2 hidden justify-self-center lg:block">
        <NavigationMenu.List className="flex items-center gap-1">
          <NavigationMenu.Item>
            <NavigationMenu.Trigger className={triggerClass}>
              Product
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className="size-3 transition-transform duration-200 group-data-[popup-open]:rotate-180"
                strokeWidth={2}
              />
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className="w-[26rem] p-2">
              <ul className="grid grid-cols-2 gap-1">
                {PRODUCT.map((item) => (
                  <li key={item.title}>
                    <NavigationMenu.Link
                      render={<Link href={item.href} />}
                      className="flex items-start gap-3 rounded-lg p-2.5 transition-colors outline-none hover:bg-muted focus-visible:bg-muted"
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-card text-foreground">
                        <HugeiconsIcon
                          icon={item.icon}
                          className="size-4"
                          strokeWidth={1.8}
                        />
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </NavigationMenu.Link>
                  </li>
                ))}
              </ul>
            </NavigationMenu.Content>
          </NavigationMenu.Item>

          <NavigationMenu.Item>
            <NavigationMenu.Trigger className={triggerClass}>
              Resources
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className="size-3 transition-transform duration-200 group-data-[popup-open]:rotate-180"
                strokeWidth={2}
              />
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className="w-56 p-2">
              <ul className="flex flex-col gap-0.5">
                {RESOURCES.map((item) => (
                  <li key={item.label}>
                    <NavigationMenu.Link
                      render={<Link href={item.href} />}
                      className="block rounded-md px-2.5 py-2 text-sm transition-colors outline-none hover:bg-muted focus-visible:bg-muted"
                    >
                      {item.label}
                    </NavigationMenu.Link>
                  </li>
                ))}
              </ul>
            </NavigationMenu.Content>
          </NavigationMenu.Item>

          <NavigationMenu.Item>
            <NavigationMenu.Link
              render={<Link href="/pricing" />}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              Pricing
            </NavigationMenu.Link>
          </NavigationMenu.Item>

          <NavigationMenu.Item>
            <NavigationMenu.Link
              render={<Link href="/showcase" />}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              Showcase
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>

        <NavigationMenu.Portal>
          <NavigationMenu.Positioner
            side="bottom"
            align="center"
            sideOffset={8}
            className="z-50"
          >
            <NavigationMenu.Popup
              className={cn(
                "origin-[var(--transform-origin)] rounded-xl border bg-popover text-popover-foreground shadow-lg outline-none",
                "transition-[transform,opacity] duration-200 ease-out",
                "data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0",
                "data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0"
              )}
            >
              <NavigationMenu.Viewport />
            </NavigationMenu.Popup>
          </NavigationMenu.Positioner>
        </NavigationMenu.Portal>
      </NavigationMenu.Root>

      <div className="col-start-3 flex items-center gap-2 justify-self-end">
        <Button
          render={<Link href="/signin" />}
          variant="ghost"
          size="lg"
          className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
        >
          Sign in
        </Button>
        <Button
          render={<Link href="/signup" />}
          size="lg"
          className="hidden px-3 sm:inline-flex"
        >
          Get started
        </Button>
        <CompactMenu />
      </div>
    </header>
  )
}

/**
 * The nav for phones and tablets. Tablets are the primary target, so the
 * sign in and get started buttons stay in the header alongside this, and
 * only the Product/Resources dropdowns collapse in here.
 */
function CompactMenu() {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Open menu"
            className="text-muted-foreground lg:hidden"
          >
            <HugeiconsIcon icon={Menu01Icon} strokeWidth={1.8} />
          </Button>
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-40 bg-black/40 lg:hidden",
            "transition-opacity duration-200 ease-out",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed inset-x-0 top-0 z-50 flex flex-col gap-1 border-b bg-popover px-4 pt-4 pb-5 text-popover-foreground shadow-lg outline-none lg:hidden",
            "transition-transform duration-200 ease-out",
            "data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full"
          )}
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <div className="mb-2 flex items-center justify-between">
            <Wordmark />
            <Dialog.Close
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Close menu"
                  className="text-muted-foreground"
                >
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.8} />
                </Button>
              }
            />
          </div>

          <p className="px-2 pt-2 pb-1 text-[11px] font-medium text-muted-foreground">
            Product
          </p>
          {PRODUCT.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted sm:py-3"
            >
              <HugeiconsIcon
                icon={item.icon}
                className="size-4 text-muted-foreground"
                strokeWidth={1.8}
              />
              {item.title}
            </Link>
          ))}

          <p className="px-2 pt-3 pb-1 text-[11px] font-medium text-muted-foreground">
            Resources
          </p>
          {RESOURCES.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted sm:py-3"
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/pricing"
            className="rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted sm:py-3"
          >
            Pricing
          </Link>
          <Link
            href="/showcase"
            className="rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted sm:py-3"
          >
            Showcase
          </Link>

          {/* Phones only: from sm up these same two live in the header. */}
          <div className="mt-3 flex flex-col gap-2 sm:hidden">
            <Button
              render={<Link href="/signup" />}
              size="lg"
              className="w-full"
            >
              Get started
            </Button>
            <Button
              render={<Link href="/signin" />}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Sign in
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
