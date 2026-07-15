import type { Metadata } from "next"

import { WritingIndex } from "@/components/marble/writing-index"
import { getPosts, MARBLE_CATEGORY } from "@/lib/marble"

export const metadata: Metadata = {
  title: "Tutorials | Flipghost",
  description:
    "Short, specific walkthroughs built around finishing one small thing rather than watching four hours of video.",
}

export default async function TutorialsPage() {
  const posts = await getPosts(MARBLE_CATEGORY.tutorials)

  return (
    <WritingIndex
      eyebrow="Tutorials"
      title="Learn to animate twelve frames at a time"
      description="Nobody needs another four hour course. These are short, specific, and built around finishing one small thing, because a finished loop teaches more than a half watched playlist."
      posts={posts}
      basePath="/tutorials"
      emptyMessage="None of these are written yet. If you want to start anyway, open the workshop, draw a circle, duplicate the frame, and move the circle slightly. You are now animating, which is genuinely most of it."
    />
  )
}
