import type { Metadata } from "next"
import {
  Building02Icon,
  GhostIcon,
  Globe02Icon,
  PenTool01Icon,
  Target01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"

import { ComingSoon, type ComingSoonItem } from "@/components/landing/coming-soon"

export const metadata: Metadata = {
  title: "About | Flipghost",
  description:
    "Why we built a flipbook in a browser, who is building it, and what we are trying not to turn it into.",
}

const ITEMS: ComingSoonItem[] = [
  {
    title: "Why a flipbook",
    description:
      "Frame by frame is the oldest way to animate and still the most direct. Nothing sits between the drawing and the motion.",
    icon: PenTool01Icon,
  },
  {
    title: "Why a browser",
    description:
      "No install, no licence server, no forty minute setup before the first line. A URL and a canvas is the whole ask.",
    icon: Globe02Icon,
  },
  {
    title: "What we will not do",
    description:
      "No watermark on your work, no holding exports hostage, no rewriting the tool around whoever is loudest.",
    icon: Target01Icon,
  },
  {
    title: "Who is building it",
    description:
      "A small team that draws. Every feature has to survive someone on it actually using the thing on a real project.",
    icon: Building02Icon,
  },
  {
    title: "The ghost",
    description:
      "Onion skinning is the heart of the tool, and an onion skin is a ghost of the frame before. The name picked itself.",
    icon: GhostIcon,
  },
  {
    title: "Where it goes",
    description:
      "Better brushes, better timing tools, better export. The roadmap is boring on purpose and we would like to keep it that way.",
    icon: ViewIcon,
  },
]

export default function AboutPage() {
  return (
    <ComingSoon
      title="Why we built a flipbook in a browser"
      description="Animation software has spent thirty years getting more powerful and less inviting. Flipghost is a small argument that the fastest way to learn to animate is still to draw one frame, then draw the next one."
      itemsHeading="The short version"
      items={ITEMS}
      note="The longer version, with names attached and the parts we got wrong included, is being written. Until then this page is the honest summary, and the workshop is the actual argument."
    />
  )
}
