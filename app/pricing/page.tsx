import type { Metadata } from "next"
import {
  Coins01Icon,
  CreditCardIcon,
  Film01Icon,
  Layers01Icon,
  PaintBoardIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons"

import { ComingSoon, type ComingSoonItem } from "@/components/landing/coming-soon"

export const metadata: Metadata = {
  title: "Pricing | Flipghost",
  description:
    "Drawing stays free. The things that cost us money are the only things that will cost you money.",
}

const ITEMS: ComingSoonItem[] = [
  {
    title: "Free to draw",
    description:
      "The canvas, the timeline, onion skinning, and local export. No frame limit, no watermark, no countdown.",
    icon: PaintBoardIcon,
  },
  {
    title: "Paid for the heavy lifting",
    description:
      "Long renders at high resolution run on our machines instead of your laptop, so those sit behind a plan.",
    icon: Film01Icon,
  },
  {
    title: "Cloud projects",
    description:
      "Keep every project synced across machines and roll a timeline back to any version you saved.",
    icon: Layers01Icon,
  },
  {
    title: "One price, no seats",
    description:
      "Billed monthly or yearly. Cancel whenever you like and your work stays yours, still open, still exportable.",
    icon: Coins01Icon,
  },
  {
    title: "Student pricing",
    description:
      "If you are still learning to animate, you should not be the person funding this. Show us an .edu address.",
    icon: Tag01Icon,
  },
  {
    title: "Honest trials",
    description:
      "No card up front. When a trial ends nothing gets deleted, and nothing you drew gets held hostage.",
    icon: CreditCardIcon,
  },
]

export default function PricingPage() {
  return (
    <ComingSoon
      title="Pricing that fits how much you draw"
      description="We are still working out what is fair to charge for. The rule we are starting from is simple: drawing stays free, and you only pay for the parts that cost us something real."
      itemsHeading="How we are thinking about it"
      items={ITEMS}
      note="Until this page has actual numbers on it, everything in the workshop is free to use, including export. If you are already deep in a project, you will not wake up locked out of it."
    />
  )
}
