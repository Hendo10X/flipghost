"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  Film01Icon,
  GhostIcon,
  Gif01Icon,
  ImageAdd01Icon,
  Loading03Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  downloadBlob,
  exportGif,
  exportMp4,
  type ExportFormat,
} from "@/lib/flipbook/export"
import { getStagePreset, STAGE_PRESETS, useFlipbook } from "@/lib/flipbook/store"
import { signOut, useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function slugify(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug || "flipghost-animation"
}

export function WorkshopHeader() {
  const title = useFlipbook((s) => s.title)
  const setTitle = useFlipbook((s) => s.setTitle)
  const stagePresetId = useFlipbook((s) => s.stagePresetId)
  const setStagePreset = useFlipbook((s) => s.setStagePreset)
  const requestImport = useFlipbook((s) => s.requestImport)
  const { data: session } = useSession()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState<{
    format: ExportFormat
    progress: number
  } | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  async function handleExport(format: ExportFormat) {
    if (exporting) return
    const state = useFlipbook.getState()
    state.setPlaying(false)
    setExporting({ format, progress: 0 })
    setExportError(null)
    try {
      const run = format === "gif" ? exportGif : exportMp4
      const preset = getStagePreset(state.stagePresetId)
      const blob = await run(
        state.frames,
        state.fps,
        { width: preset.width, height: preset.height },
        (p) => setExporting({ format, progress: p.value })
      )
      downloadBlob(blob, `${slugify(state.title)}.${format}`)
    } catch (error) {
      console.error(error)
      setExportError(`${format.toUpperCase()} export failed. Please try again.`)
    } finally {
      setExporting(null)
    }
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") requestImport(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
      <Link
        href="/"
        aria-label="Flipghost home"
        className="flex items-center gap-2 text-sm font-medium select-none"
      >
        <HugeiconsIcon icon={GhostIcon} className="size-4" strokeWidth={2} />
      </Link>

      <div className="h-4 w-px bg-border" />

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Animation title"
        spellCheck={false}
        className="h-7 w-48 truncate rounded-md bg-transparent px-2 text-sm font-medium outline-none placeholder:text-muted-foreground hover:bg-muted focus-visible:bg-muted"
        placeholder="Untitled Animation"
      />

      <Select
        value={stagePresetId}
        onValueChange={(value) => setStagePreset(value as string)}
        items={Object.fromEntries(
          STAGE_PRESETS.map((p) => [p.id, `${p.label} · ${p.width}×${p.height}`])
        )}
      >
        <SelectTrigger aria-label="Canvas size">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STAGE_PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              {preset.label} · {preset.width}×{preset.height}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2">
        {exportError && (
          <span role="alert" className="text-xs text-destructive">
            {exportError}
          </span>
        )}

        {session ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFile}
            />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="lg"
                    aria-label="Import image"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <HugeiconsIcon icon={ImageAdd01Icon} strokeWidth={1.8} />
                    Import
                  </Button>
                }
              />
              <TooltipContent side="bottom">
                Place an image on the current frame
              </TooltipContent>
            </Tooltip>
          </>
        ) : (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="lg"
                  render={<Link href="/signup" />}
                  aria-label="Sign up to import images"
                  className="text-muted-foreground"
                >
                  <HugeiconsIcon icon={ImageAdd01Icon} strokeWidth={1.8} />
                  Import
                </Button>
              }
            />
            <TooltipContent side="bottom">
              Sign up to import images
            </TooltipContent>
          </Tooltip>
        )}

        <div className="h-4 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="lg"
                disabled={exporting !== null}
                onClick={() => handleExport("gif")}
                aria-label="Export GIF"
              >
                {exporting?.format === "gif" ? (
                  <>
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="animate-spin"
                      strokeWidth={1.8}
                    />
                    <span className="tabular-nums">
                      {Math.round(exporting.progress * 100)}%
                    </span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Gif01Icon} strokeWidth={1.8} />
                    GIF
                  </>
                )}
              </Button>
            }
          />
          <TooltipContent side="bottom">Export a looping GIF</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="lg"
                disabled={exporting !== null}
                onClick={() => handleExport("mp4")}
                aria-label="Export MP4"
              >
                {exporting?.format === "mp4" ? (
                  <>
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="animate-spin"
                      strokeWidth={1.8}
                    />
                    <span className="tabular-nums">
                      {Math.round(exporting.progress * 100)}%
                    </span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Film01Icon} strokeWidth={1.8} />
                    MP4
                  </>
                )}
              </Button>
            }
          />
          <TooltipContent side="bottom">Export an MP4 video</TooltipContent>
        </Tooltip>

        <div className="h-4 w-px bg-border" />

        {session ? (
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium uppercase select-none" />
                }
              >
                {(session.user.name || session.user.email).slice(0, 1)}
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {session.user.email}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Sign out"
                    onClick={() => signOut()}
                    className="text-muted-foreground"
                  >
                    <HugeiconsIcon icon={Logout01Icon} strokeWidth={1.8} />
                  </Button>
                }
              />
              <TooltipContent side="bottom">Sign out</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <Button
            render={<Link href="/signin" />}
            variant="ghost"
            size="lg"
            className="text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Button>
        )}
      </div>
    </header>
  )
}
