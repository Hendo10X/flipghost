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
import { cn } from "@/lib/utils"

interface FeatureLink {
  title: string
  description: string
  icon: typeof GhostIcon
}

const PRODUCT: FeatureLink[] = [
  {
    title: "Canvas & brushes",
    description: "Low-latency freehand drawing.",
    icon: PaintBoardIcon,
  },
  {
    title: "Onion skinning",
    description: "Trace motion between frames.",
    icon: GhostIcon,
  },
  {
    title: "Timeline",
    description: "Reorder and duplicate frames.",
    icon: PlayListIcon,
  },
  {
    title: "Export",
    description: "Looping GIF and MP4 output.",
    icon: Film01Icon,
  },
]

const RESOURCES = ["Documentation", "Tutorials", "Changelog", "Community"]

const triggerClass =
  "group flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors outline-none select-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 data-[popup-open]:text-foreground"

export function LandingNav() {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4">
      <Link
        href="/"
        className="col-start-1 flex items-center gap-2 justify-self-start text-sm font-medium select-none"
      >
        <HugeiconsIcon icon={GhostIcon} className="size-4" strokeWidth={2} />
        Flipghost
      </Link>

      <NavigationMenu.Root className="col-start-2 hidden justify-self-center md:block">
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
                      href="#"
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
                  <li key={item}>
                    <NavigationMenu.Link
                      href="#"
                      className="block rounded-md px-2.5 py-2 text-sm transition-colors outline-none hover:bg-muted focus-visible:bg-muted"
                    >
                      {item}
                    </NavigationMenu.Link>
                  </li>
                ))}
              </ul>
            </NavigationMenu.Content>
          </NavigationMenu.Item>

          <NavigationMenu.Item>
            <NavigationMenu.Link
              href="#"
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              Pricing
            </NavigationMenu.Link>
          </NavigationMenu.Item>

          <NavigationMenu.Item>
            <NavigationMenu.Link
              href="#"
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
          className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
        >
          Sign in
        </Button>
        <Button
          render={<Link href="/signup" />}
          size="lg"
          className="hidden px-3 md:inline-flex"
        >
          Get started
        </Button>
        <MobileMenu />
      </div>
    </header>
  )
}

function MobileMenu() {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Open menu"
            className="text-muted-foreground md:hidden"
          >
            <HugeiconsIcon icon={Menu01Icon} strokeWidth={1.8} />
          </Button>
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-40 bg-black/40 md:hidden",
            "transition-opacity duration-200 ease-out",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed inset-x-0 top-0 z-50 flex flex-col gap-1 border-b bg-popover px-4 pt-4 pb-5 text-popover-foreground shadow-lg outline-none md:hidden",
            "transition-transform duration-200 ease-out",
            "data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full"
          )}
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium select-none">
              <HugeiconsIcon icon={GhostIcon} className="size-4" strokeWidth={2} />
              Flipghost
            </span>
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
            <a
              key={item.title}
              href="#"
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
            >
              <HugeiconsIcon
                icon={item.icon}
                className="size-4 text-muted-foreground"
                strokeWidth={1.8}
              />
              {item.title}
            </a>
          ))}

          <p className="px-2 pt-3 pb-1 text-[11px] font-medium text-muted-foreground">
            Resources
          </p>
          {RESOURCES.map((item) => (
            <a
              key={item}
              href="#"
              className="rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
            >
              {item}
            </a>
          ))}

          <a
            href="#"
            className="rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
          >
            Pricing
          </a>
          <a
            href="#"
            className="rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
          >
            Showcase
          </a>

          <div className="mt-3 flex flex-col gap-2">
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
