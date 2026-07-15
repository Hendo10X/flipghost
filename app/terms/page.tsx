import type { Metadata } from "next"
import {
  Legal01Icon,
  LegalDocument01Icon,
  PaintBoardIcon,
  Recycle01Icon,
  Shield01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons"

import { ComingSoon, type ComingSoonItem } from "@/components/landing/coming-soon"

export const metadata: Metadata = {
  title: "Terms | Flipghost",
  description:
    "The terms of service for Flipghost, written to be read rather than survived.",
}

const ITEMS: ComingSoonItem[] = [
  {
    title: "Who owns the drawings",
    description:
      "The ownership question, answered in the first paragraph instead of the twelfth, because it is the only one most people came for.",
    icon: PaintBoardIcon,
  },
  {
    title: "What you agree to",
    description:
      "The short list of things you cannot do with the service, written without inventing new meanings for ordinary words.",
    icon: Tick01Icon,
  },
  {
    title: "What we agree to",
    description:
      "Our side of it, including notice before meaningful changes rather than a quiet edit and a new date at the top.",
    icon: Shield01Icon,
  },
  {
    title: "Accounts and endings",
    description:
      "How an account can be closed, by you or by us, what warning that comes with, and what you can take with you.",
    icon: Recycle01Icon,
  },
  {
    title: "The unavoidable parts",
    description:
      "Liability, warranties, and governing law. Genuinely required, kept as short as a lawyer will let us keep them.",
    icon: Legal01Icon,
  },
  {
    title: "A plain summary",
    description:
      "A readable version beside each section, marked clearly as a summary, since the binding text is still the binding text.",
    icon: LegalDocument01Icon,
  },
]

export default function TermsPage() {
  return (
    <ComingSoon
      title="The rules, written to be read"
      description="Terms of service are usually a wall built to be scrolled past. This one is being drafted to be short enough to actually read, starting with the part everyone wants answered about who owns what you draw."
      itemsHeading="What the terms will cover"
      items={ITEMS}
      note="This page is a placeholder and is not an agreement. Nothing on it binds anyone yet. The real terms are being drafted and will be published here before Flipghost accepts accounts at any scale."
    />
  )
}
