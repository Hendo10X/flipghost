import type { Metadata } from "next"
import {
  Bug01Icon,
  Clock01Icon,
  PackageIcon,
  Rocket01Icon,
  SparklesIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons"

import { ComingSoon, type ComingSoonItem } from "@/components/landing/coming-soon"

export const metadata: Metadata = {
  title: "Changelog | Flipghost",
  description:
    "Every change to Flipghost, written down. Features, fixes, and the things we are still getting wrong.",
}

const ITEMS: ComingSoonItem[] = [
  {
    title: "What shipped",
    description:
      "New tools, new export formats, new corners of the timeline, each with a loop showing what it actually does.",
    icon: SparklesIcon,
  },
  {
    title: "What got fixed",
    description:
      "The brush lag, the dropped frame, the export that stalled at 98 percent. Named plainly, not as improvements to stability.",
    icon: Bug01Icon,
  },
  {
    title: "Version tags",
    description:
      "Every entry pinned to a version, so you can tell which build you were drawing in when something changed.",
    icon: Tag01Icon,
  },
  {
    title: "Release notes",
    description:
      "The longer write up for releases big enough to need one, including anything that behaves differently now.",
    icon: PackageIcon,
  },
  {
    title: "What is next",
    description:
      "The short list of what we are building now, kept honest and updated when it slips, which it will.",
    icon: Rocket01Icon,
  },
  {
    title: "Dated, always",
    description:
      "Real dates on every entry. A changelog without dates is a marketing page wearing a fake moustache.",
    icon: Clock01Icon,
  },
]

export default function ChangelogPage() {
  return (
    <ComingSoon
      title="Every change, written down"
      description="Flipghost moves fast enough that the workshop you open next month will not be the one you opened today. This is where we will tell you exactly what moved, and when."
      itemsHeading="What goes in an entry"
      items={ITEMS}
      note="The first entries are being written now. Until then, the shortest possible changelog is this: we built a canvas, a timeline, onion skinning, and an exporter, and we are still sanding the edges off all four."
    />
  )
}
