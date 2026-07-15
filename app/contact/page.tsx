import type { Metadata } from "next"
import {
  Briefcase01Icon,
  Bug01Icon,
  Idea01Icon,
  Mail01Icon,
  MessageMultiple01Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons"

import { ComingSoon, type ComingSoonItem } from "@/components/landing/coming-soon"

export const metadata: Metadata = {
  title: "Contact | Flipghost",
  description:
    "Bug reports, feature requests, press, and security disclosures. Reaching a real person, once the door is open.",
}

const ITEMS: ComingSoonItem[] = [
  {
    title: "Bug reports",
    description:
      "The frame that vanished, the export that stalled, the brush that lagged. Send the project file and we will dig in.",
    icon: Bug01Icon,
  },
  {
    title: "Feature requests",
    description:
      "Tell us what you were trying to draw when the tool got in your way. That is far more useful than naming the feature.",
    icon: Idea01Icon,
  },
  {
    title: "General questions",
    description:
      "Anything that is not broken and not a request. Answered by someone who works on this, not a queue.",
    icon: MessageMultiple01Icon,
  },
  {
    title: "Security",
    description:
      "A dedicated address for disclosures, with a real reply and no lawyers as the first response.",
    icon: Shield01Icon,
  },
  {
    title: "Press and partnerships",
    description:
      "Writing about Flipghost, teaching with it, or putting it in front of a room. We will make time for that.",
    icon: Briefcase01Icon,
  },
  {
    title: "Just saying hello",
    description:
      "Send the loop you made. Genuinely. It is the best part of the week and it is not close.",
    icon: Mail01Icon,
  },
]

export default function ContactPage() {
  return (
    <ComingSoon
      title="Say something to a real person"
      description="No ticket portal, no chatbot pretending to be named Riley. When this page opens it will have addresses on it that reach the people building the thing you are writing about."
      itemsHeading="What you will be able to send"
      items={ITEMS}
      note="The inboxes are not set up yet, so there is nothing here to write to. If something in the workshop is broken right now, it is very likely we already know, and it is very likely we are already annoyed about it."
    />
  )
}
