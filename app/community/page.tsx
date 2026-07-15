import type { Metadata } from "next"
import {
  Bookmark01Icon,
  Calendar03Icon,
  Megaphone01Icon,
  MessageMultiple01Icon,
  PaintBoardIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons"

import { ComingSoon, type ComingSoonItem } from "@/components/landing/coming-soon"

export const metadata: Metadata = {
  title: "Community | Flipghost",
  description:
    "A place for people who draw frame by frame. Critique threads, weekly prompts, brush swaps, and open studio hours.",
}

const ITEMS: ComingSoonItem[] = [
  {
    title: "Critique threads",
    description:
      "Post a loop and get notes from people who have redrawn the same twelve frames more times than they will admit to.",
    icon: MessageMultiple01Icon,
  },
  {
    title: "Weekly prompts",
    description:
      "One short brief every Monday. Twelve frames, one loop, no pressure and no prizes.",
    icon: Calendar03Icon,
  },
  {
    title: "Brush swaps",
    description:
      "Share the settings behind a line you like, and pull someone else's straight into your own toolbar.",
    icon: PaintBoardIcon,
  },
  {
    title: "Work in progress",
    description:
      "A feed for the rough pass, the timing that is still wrong, and the one frame you cannot get right.",
    icon: Bookmark01Icon,
  },
  {
    title: "Open studio hours",
    description:
      "Drop in, draw alongside other people for an hour, leave whenever. Cameras optional and mostly off.",
    icon: UserMultiple02Icon,
  },
  {
    title: "Showcase picks",
    description:
      "The loops we cannot stop watching, gathered up and pointed at properly instead of buried in a grid.",
    icon: Megaphone01Icon,
  },
]

export default function CommunityPage() {
  return (
    <ComingSoon
      title="A room full of people who draw"
      description="Animation is quiet work, and mostly solitary. Flipghost is building somewhere to put the loop down in front of someone else and hear what they actually see in it."
      itemsHeading="What you will find here"
      items={ITEMS}
      note="There is nothing to join yet, so there is nothing to sign up for. The workshop is open in the meantime, and anything you make in it will still be there when the doors open."
    />
  )
}
