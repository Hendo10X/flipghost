/**
 * Marble (marblecms.com) is the source for the written pages: the blog, the
 * changelog, and the tutorials. Docs are deliberately not here — they live as
 * MDX under content/docs so they can be reviewed alongside the code they
 * describe.
 *
 * Every read goes through marbleFetch, which never throws. A marketing page
 * going blank is bad; the whole site failing to build because a CMS was down,
 * or because MARBLE_API_KEY is not set yet, is worse. Failures log and return
 * null, and the pages render their empty state.
 */

const API_URL = "https://api.marblecms.com/v1"

// Read lazily rather than at module scope so the value is not baked in at
// build time before the key exists.
const apiKey = () => process.env.MARBLE_API_KEY

/**
 * Each section of the site is one Marble category. Posts are filtered by these
 * slugs, so the workspace needs a category whose slug matches each value here.
 */
export const MARBLE_CATEGORY = {
  blog: "blog",
  changelog: "changelog",
  tutorials: "tutorials",
} as const

export interface MarbleAuthor {
  id: string
  name: string
  slug: string
  image: string | null
  bio: string | null
  role: string | null
}

export interface MarbleTag {
  id: string
  name: string
  slug: string
}

export interface MarbleCategory {
  id: string
  name: string
  slug: string
}

export interface MarblePost {
  id: string
  slug: string
  title: string
  status: "published" | "draft"
  /** Rendered HTML from Marble's editor, not markdown. */
  content: string
  featured: boolean
  description: string
  coverImage: string | null
  /**
   * ISO strings. Marble's own SDK types these as Date because it parses the
   * response; over plain fetch they arrive as strings and stay strings.
   */
  publishedAt: string
  updatedAt: string
  authors: MarbleAuthor[]
  category: MarbleCategory
  tags: MarbleTag[]
}

interface MarblePagination {
  limit: number
  currentPage: number
  nextPage: number | null
  previousPage: number | null
  totalItems: number
  totalPages: number
}

interface PostListResponse {
  posts: MarblePost[]
  pagination: MarblePagination
}

async function marbleFetch<T>(
  path: string,
  tag: string,
): Promise<T | null> {
  const key = apiKey()
  if (!key) return null

  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: key },
      // Content changes on the writer's schedule, not the reader's, so a few
      // minutes of staleness is fine. The tags let a Marble webhook call
      // revalidateTag("marble") for an immediate refresh.
      next: { revalidate: 300, tags: ["marble", tag] },
    })

    if (!response.ok) {
      console.error(
        `Marble ${path} responded ${response.status} ${response.statusText}`,
      )
      return null
    }

    return (await response.json()) as T
  } catch (error) {
    console.error(`Marble ${path} failed`, error)
    return null
  }
}

export async function getPosts(
  category: (typeof MARBLE_CATEGORY)[keyof typeof MARBLE_CATEGORY],
  { limit = 30 }: { limit?: number } = {},
): Promise<MarblePost[]> {
  const query = new URLSearchParams({ category, limit: String(limit) })
  const data = await marbleFetch<PostListResponse>(
    `/posts?${query}`,
    `marble:${category}`,
  )
  if (!data?.posts) return []

  // Marble can serve drafts to an authorised key, which is the whole point of
  // a preview key, but these pages are public.
  return data.posts.filter((post) => post.status === "published")
}

export async function getPost(
  category: (typeof MARBLE_CATEGORY)[keyof typeof MARBLE_CATEGORY],
  slug: string,
): Promise<MarblePost | null> {
  const data = await marbleFetch<{ post: MarblePost }>(
    `/posts/${encodeURIComponent(slug)}`,
    `marble:post:${slug}`,
  )
  const post = data?.post
  if (!post || post.status !== "published") return null

  // Slugs are unique per workspace, not per category, so /blog/<a-tutorial>
  // would otherwise resolve and render the tutorial under the wrong section.
  if (post.category?.slug !== category) return null

  return post
}

export function formatPostDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/** Rough minutes-to-read from the rendered HTML, at 200 words per minute. */
export function readingTime(html: string): number {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
