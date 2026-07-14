import type { Metadata } from "next"

import { Editor } from "@/components/workshop/editor"

export const metadata: Metadata = {
  title: "Workshop | Flipghost",
}

export default function WorkshopPage() {
  return <Editor />
}
