import type { Metadata } from "next"
import {
  Chart01Icon,
  CodeIcon,
  Idea01Icon,
  Megaphone01Icon,
  Note01Icon,
  PenTool01Icon,
} from "@hugeicons/core-free-icons"

import { ComingSoon, type ComingSoonItem } from "@/components/landing/coming-soon"

export const metadata: Metadata = {
  title: "Blog | Flipghost",
  description:
    "Notes from inside the workshop: craft, engineering, and the decisions behind how Flipghost works.",
}

const ITEMS: ComingSoonItem[] = [
  {
    title: "Craft posts",
    description:
      "Timing, spacing, weight, and the small habits that separate a loop that reads from one that only moves.",
    icon: PenTool01Icon,
  },
  {
    title: "How it is built",
    description:
      "Getting a browser canvas to feel like paper, and what it costs to keep a stroke under sixteen milliseconds.",
    icon: CodeIcon,
  },
  {
    title: "Decisions and regrets",
    description:
      "Why the timeline works the way it does, plus the choices we would make differently now that we have shipped them.",
    icon: Idea01Icon,
  },
  {
    title: "Teardowns",
    description:
      "Taking a loop apart frame by frame to see exactly where the illusion is doing its work.",
    icon: Chart01Icon,
  },
  {
    title: "Interviews",
    description:
      "Animators talking about process, in detail, including the unglamorous middle where most of the work happens.",
    icon: Note01Icon,
  },
  {
    title: "Announcements",
    description:
      "The occasional post that exists because something shipped and it deserves more than a changelog line.",
    icon: Megaphone01Icon,
  },
]

export default function BlogPage() {
  return (
    <ComingSoon
      title="Notes from inside the workshop"
      description="A slow blog about frame by frame animation and the software built to serve it. Written when there is something worth saying, which is less often than a content calendar would like."
      itemsHeading="What will be here"
      items={ITEMS}
      note="No posts yet, and no newsletter to join. When the first one lands it will be linked from the changelog, which is currently the most reliable way to tell that anything happened at all."
    />
  )
}
