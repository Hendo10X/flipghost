import type { Metadata } from "next"
import {
  Download01Icon,
  GlobalIcon,
  Layers01Icon,
  Recycle01Icon,
  SecurityLockIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons"

import { ComingSoon, type ComingSoonItem } from "@/components/landing/coming-soon"

export const metadata: Metadata = {
  title: "Privacy | Flipghost",
  description:
    "The privacy policy for Flipghost, written to be read once and understood the first time.",
}

const ITEMS: ComingSoonItem[] = [
  {
    title: "What we collect",
    description:
      "Every field, listed by name, with the reason it exists next to it rather than three sections away.",
    icon: ViewIcon,
  },
  {
    title: "Where your drawings live",
    description:
      "Which parts of a project stay in your browser, which parts reach our servers, and exactly what triggers the difference.",
    icon: Layers01Icon,
  },
  {
    title: "Who else is involved",
    description:
      "The named list of services we hand data to in order to run this, and what each one receives.",
    icon: GlobalIcon,
  },
  {
    title: "How long we keep it",
    description:
      "A retention period per category, including what happens after you close an account and how long the grace period runs.",
    icon: Recycle01Icon,
  },
  {
    title: "Getting it back",
    description:
      "How to export everything you have made and how to ask for deletion, without a retention call in the middle.",
    icon: Download01Icon,
  },
  {
    title: "How it is protected",
    description:
      "Encryption, access controls, and how we would tell you if something went wrong, in a timeframe we commit to.",
    icon: SecurityLockIcon,
  },
]

export default function PrivacyPage() {
  return (
    <ComingSoon
      title="What we know about you, in plain words"
      description="Privacy policies are usually written so that reading them carefully is a punishment. Ours is being drafted to be read once, understood the first time, and checked against what the software actually does."
      itemsHeading="What the policy will cover"
      items={ITEMS}
      note="This page is a placeholder and is not a policy. Nothing on it is a legal commitment yet. The real document is being drafted and will be published here before Flipghost accepts accounts at any scale."
    />
  )
}
