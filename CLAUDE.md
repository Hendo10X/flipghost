# Flipghost

A browser flipbook-animation app. You draw a frame, draw the next one slightly
moved, and it plays. Next.js 16 (App Router) · React 19 · TypeScript · Tailwind
v4 · Base UI + shadcn idiom · Fabric.js v7 canvas · Zustand · Drizzle + Neon ·
better-auth. Content (blog, changelog, tutorials) comes from Marble CMS.

## Non-negotiables

- **Bun only.** `bun install`, `bun run <script>`. Never npm, pnpm, or yarn — it
  would fork the lockfile.
- **Do not start dev servers.** No `bun run dev`, no `next dev`. Verify with
  `bun run typecheck`, `bun run lint`, and `bun run build`. The one exception is
  a change to the animation engine, which a human must exercise by hand (see
  below) — you still do not start the server for it.
- **Icons are Hugeicons** (`@hugeicons/react` + `@hugeicons/core-free-icons`).
  Do not add another icon library.
- **UI follows the design skills** in `.claude/skills/` and the shared page
  idiom (see below). Match the surrounding code's density and idiom.

## The one thing that matters most

**A green build tells you almost nothing about whether this app works.**

There are no automated tests of the animation engine. Every serious bug this
project has had — autosave silently dropping strokes, fast frame-stepping
merging two frames, the undo model losing a deleted frame — compiled cleanly,
passed lint, and built. They were behaviour bugs in async, stateful, canvas
code that no typecheck can see.

So: if you change anything under `lib/flipbook/` or `components/workshop/`, it
is not done when it builds. It is done when a human has opened the workshop and
watched the affected thing work — drawn a stroke, stepped a frame, hit undo,
run an export. If you are an agent and cannot do that, say so plainly and leave
it for a human rather than reporting it verified.

## Ownership boundary

The codebase splits cleanly into a **core** and a **surface**. They share
exactly one file. Respect the split; it is what lets more than one person work
here without breaking the part that has no tests.

### Core — needs Henderson's review (see .github/CODEOWNERS)

- `lib/flipbook/` — the animation engine: store, history/undo, persistence,
  the pressure brush, export (GIF/MP4), demos.
- `components/workshop/` — the editor, canvas, timeline, toolbar.
- `app/workshop/`, `app/api/projects/` — loading and saving projects.
- `lib/auth.ts`, `db/` — auth and the database schema.

Do not edit these to make a surface task easier. If a marketing or content task
seems to need a change here, stop and flag it instead.

### Surface — the day-to-day work

- `components/landing/`, `app/*/page.tsx` (except workshop), `app/globals.css`
  — the marketing site.
- `components/marble/`, the `app/blog|changelog|tutorials` pages,
  `content/docs/*.mdx`, `lib/marble.ts` — content and its templates.
- `components/ui/` — shared primitives. Additive changes are fine; see the trap
  below.

### The shared file: `components/ui/button.tsx`

The workshop toolbar and the marketing site both use this. Its sizes are tuned
for the dense toolbar: `lg` is 32px, and the smaller sizes go down from there.

**Never retune an existing size to suit a marketing page.** Changing `lg` from
32px because a landing CTA looks small will silently resize every button in the
workshop toolbar. Add a new size instead — this is exactly why `xl` (44px)
exists, for landing and auth. Adding sizes is safe; changing them is not.

## The page idiom (surface work)

Every marketing page is the same shell, and consistency across them is a
feature. Match it rather than inventing per page:

```
<div className="flex min-h-dvh flex-col">
  <LandingNav />
  <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-14 pb-20 sm:pt-20">
    <header> eyebrow (text-xs sky) + font-display h1 (text-4xl sm:text-5xl)
             + muted lede </header>
    ... animate-in fade-in-0 slide-in-from-bottom-2 sections,
        cards as rounded-xl border bg-card p-5 shadow-sm ...
  </main>
  <SiteFooter />
</div>
```

Do not ship a page with a `LandingNav` and no `SiteFooter` — it becomes a
navigational dead end. Headings descend by level; an `h1` is never smaller than
an `h2` elsewhere on the site.

## Content (Marble CMS)

Blog, changelog, and tutorials are Marble posts, one **category per section**
with slugs exactly `blog`, `changelog`, `tutorials`. A post filed under any
other category renders nowhere. `lib/marble.ts` never throws: if the key is
missing or the API is down, the pages render their empty state and the build
stays green. Docs are the exception — they are MDX in `content/docs/`, reviewed
alongside code, not in the CMS.

Drafts staged for pasting live in `drafts/` (gitignored). Marble is the source
of truth once pasted.

## Commands

| Command | What |
| --- | --- |
| `bun install` | Install (CI uses `--frozen-lockfile`) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | ESLint |
| `bun run build` | Production build — must pass with no secrets set |
| `bun run format` | Prettier |
| `bun run db:generate` / `db:push` | Drizzle migrations (core; coordinate first) |

If `bun run build` fails on a mangled file under `.next/`, that is a stale
artifact, not your code. `rm -rf .next` and rebuild.

## Environment

`.env` holds real secrets and is gitignored; `.env.example` documents every
variable. The build must never depend on a real secret being present — `db/`
falls back to a placeholder connection string and Marble degrades to empty.
That property is what keeps CI green, so do not break it.
