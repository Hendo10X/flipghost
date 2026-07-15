import type { Metadata } from "next"
import {
  Compass01Icon,
  GhostIcon,
  Idea01Icon,
  Recycle01Icon,
  Timer01Icon,
  Video01Icon,
} from "@hugeicons/core-free-icons"

import { ComingSoon, type ComingSoonItem } from "@/components/landing/coming-soon"

export const metadata: Metadata = {
  title: "Tutorials | Flipghost",
  description:
    "Short lessons for drawing your first loop, learning timing and spacing, and building a walk cycle twelve frames at a time.",
}

const ITEMS: ComingSoonItem[] = [
  {
    title: "Your first loop",
    description:
      "Six frames, one blinking eye, about ten minutes. The point is finishing something, not making it good.",
    icon: Video01Icon,
  },
  {
    title: "The bouncing ball",
    description:
      "Every animator draws this one. It is where squash, stretch, and easing stop being words and start being frames.",
    icon: Recycle01Icon,
  },
  {
    title: "Timing and spacing",
    description:
      "Why the same drawings feel heavy or weightless depending only on how far apart you put them.",
    icon: Timer01Icon,
  },
  {
    title: "Walk cycles",
    description:
      "The four key poses, the contact frame everyone gets wrong, and how to keep a character from sliding.",
    icon: Compass01Icon,
  },
  {
    title: "Onion skin habits",
    description:
      "How experienced animators actually use it, which is far less than beginners expect and at far lower opacity.",
    icon: GhostIcon,
  },
  {
    title: "Loops that hide the seam",
    description:
      "Matching the last frame to the first without the whole thing hitching once a second forever.",
    icon: Idea01Icon,
  },
]

export default function TutorialsPage() {
  return (
    <ComingSoon
      title="Learn to animate twelve frames at a time"
      description="Nobody needs another four hour course. These will be short, specific, and built around finishing one small thing, because a finished loop teaches more than a half watched playlist."
      itemsHeading="What we are making"
      items={ITEMS}
      note="None of these are recorded yet. If you want to start anyway, open the workshop, draw a circle, duplicate the frame, and move the circle slightly. You are now animating, which is genuinely most of it."
    />
  )
}
