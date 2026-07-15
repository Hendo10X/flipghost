import { createHmac, timingSafeEqual } from "node:crypto"
import { revalidateTag } from "next/cache"

/**
 * Marble calls this when content changes so a new post appears immediately
 * rather than whenever the five minute revalidate window in lib/marble.ts
 * happens to lapse. Point Settings -> Webhooks at /api/marble/revalidate and
 * give it the same secret as MARBLE_WEBHOOK_SECRET.
 *
 * Anyone can POST here, so the signature is the only thing standing between a
 * stranger and an endless cache purge. Unverified requests are rejected.
 */
function isSignatureValid(secret: string, header: string, body: string) {
  const received = Buffer.from(header.replace(/^sha256=/, ""), "hex")
  const expected = createHmac("sha256", secret).update(body).digest()

  // timingSafeEqual throws rather than returns false on a length mismatch,
  // which is exactly what a malformed or truncated header produces.
  if (received.length !== expected.length) return false
  return timingSafeEqual(received, expected)
}

export async function POST(request: Request) {
  const secret = process.env.MARBLE_WEBHOOK_SECRET
  if (!secret) {
    return Response.json({ error: "Webhooks are not configured" }, { status: 501 })
  }

  const signature = request.headers.get("x-marble-signature")
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 401 })
  }

  // The raw text, not request.json(): the HMAC covers the exact bytes sent, and
  // re-serialising a parsed object will not reproduce them.
  const body = await request.text()

  let valid = false
  try {
    valid = isSignatureValid(secret, signature, body)
  } catch {
    valid = false
  }
  if (!valid) {
    return Response.json({ error: "Bad signature" }, { status: 401 })
  }

  // Every read in lib/marble.ts carries the "marble" tag, so one call covers
  // the blog, the changelog, and the tutorials. Working out which pages a
  // given event touches would be more code and no faster for the reader.
  //
  // expire: 0 rather than the "max" profile: "max" is stale-while-revalidate,
  // which would serve the pre-publish version to the first person through the
  // door and only refresh behind them. Publishing should mean published.
  revalidateTag("marble", { expire: 0 })

  const event = request.headers.get("x-marble-event") ?? "unknown"
  return Response.json({ revalidated: true, event })
}
