import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Wordmark } from "@/components/wordmark"

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Workshop", href: "/workshop" },
      { label: "Showcase", href: "/showcase" },
      { label: "Pricing", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Tutorials", href: "#" },
      { label: "Onion skinning", href: "#" },
      { label: "Keyboard shortcuts", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Community", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t bg-card">
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col items-start gap-4 lg:col-span-2">
          <Wordmark className="text-base" iconClassName="size-5" />
          <p className="max-w-xs text-sm leading-relaxed text-pretty text-muted-foreground">
            Flipbook animation in the browser. Draw frame by frame, trace with
            onion skinning, export a GIF or MP4.
          </p>
          <Button
            render={<Link href="/signup" />}
            size="lg"
            className="mt-1 px-4"
          >
            Get started
          </Button>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.heading} className="flex flex-col gap-3">
            <h3 className="text-xs font-medium">{column.heading}</h3>
            <ul className="flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Oversized wordmark, cropped by the footer's edge. Full-bleed and
          centred on the viewport: inside the max-w-5xl column it would start
          at the column's edge and overflow to one side. */}
      <div className="overflow-hidden border-t" aria-hidden>
        <span className="block translate-y-[20%] text-center font-display text-[17vw] leading-none tracking-tight whitespace-nowrap text-foreground/[0.07] select-none">
          Flipghost
        </span>
      </div>

      <div className="border-t">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <span className="text-xs text-muted-foreground">
            © 2026 Flipghost. Built for people who draw.
          </span>
          <div className="flex items-center gap-4">
            {["Privacy", "Terms"].map((label) => (
              <Link
                key={label}
                href="#"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
