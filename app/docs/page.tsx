import type { Metadata } from "next"
import {
  Book02Icon,
  CodeIcon,
  Film01Icon,
  GhostIcon,
  KeyboardIcon,
  PlayListIcon,
} from "@hugeicons/core-free-icons"

import { ComingSoon, type ComingSoonItem } from "@/components/landing/coming-soon"

export const metadata: Metadata = {
  title: "Documentation | Flipghost",
  description:
    "How the canvas, timeline, onion skinning, and exporter actually work, written for people who would rather be drawing.",
}

const ITEMS: ComingSoonItem[] = [
  {
    title: "Getting started",
    description:
      "Open a canvas, draw a frame, duplicate it, change one thing. That is the whole loop, and it takes about a minute.",
    icon: Book02Icon,
  },
  {
    title: "Onion skinning",
    description:
      "How many frames back to show, how faint to make them, and when turning it off is the thing that unblocks you.",
    icon: GhostIcon,
  },
  {
    title: "The timeline",
    description:
      "Reordering, duplicating, holding a frame for longer, and getting the timing right without counting out loud.",
    icon: PlayListIcon,
  },
  {
    title: "Export formats",
    description:
      "When a GIF is the right answer, when it is not, and what the MP4 encoder is doing to your line work.",
    icon: Film01Icon,
  },
  {
    title: "Keyboard shortcuts",
    description:
      "The full map, plus the six that matter. Learning those six is worth roughly an hour a week back.",
    icon: KeyboardIcon,
  },
  {
    title: "Project format",
    description:
      "What a Flipghost project is on disk, so you can back it up, move it, or read it with something that is not us.",
    icon: CodeIcon,
  },
]

export default function DocsPage() {
  return (
    <ComingSoon
      title="The manual, once it is worth reading"
      description="Flipghost is meant to be the kind of tool you can work out by poking at it. Where that fails, the docs should be short, specific, and honest about the parts that are still awkward."
      itemsHeading="What we are writing"
      items={ITEMS}
      note="Nothing is published yet. In the meantime the workshop labels its tools as you hover them, and the shortcuts menu lists every key binding, which between them cover most of what a first draft of this page would say."
    />
  )
}
