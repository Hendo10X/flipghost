"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  Album01Icon,
  CloudSavingDone01Icon,
  CloudUploadIcon,
  Film01Icon,
  GhostIcon,
  Gif01Icon,
  ImageAdd01Icon,
  Loading03Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { saveProjectToCloud } from "@/lib/flipbook/cloud"
import { clearLocalSnapshot } from "@/lib/flipbook/persistence"
import {
  downloadBlob,
  exportGif,
  exportMp4,
  type ExportFormat,
} from "@/lib/flipbook/export"
import { getStagePreset, STAGE_PRESETS, useFlipbook } from "@/lib/flipbook/store"
import { cue } from "@/lib/sound"
import { signOut, useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { HotkeysMenu } from "@/components/workshop/hotkeys-menu"
import { UserAvatar } from "@/components/user-avatar"
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
  const projectId = useFlipbook((s) => s.projectId)
  const cloudStatus = useFlipbook((s) => s.cloudStatus)
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
        state,
        state.fps,
        { width: preset.width, height: preset.height },
        (p) => setExporting({ format, progress: p.value })
      )
      downloadBlob(blob, `${slugify(state.title)}.${format}`)
      cue("success")
    } catch (error) {
      console.error(error)
      setExportError(`${format.toUpperCase()} export failed. Please try again.`)
    } finally {
      setExporting(null)
    }
  }

  async function handleSave() {
    const state = useFlipbook.getState()
    if (state.cloudStatus === "saving") return
    state.setCloudStatus("saving")
    try {
      const wasScratch = state.projectId === null
      const { id } = await saveProjectToCloud(state)
      state.setProjectId(id)
      useFlipbook.getState().setCloudStatus("saved")
      // Keep the URL shareable across refreshes without remounting the page.
      window.history.replaceState(null, "", `/workshop?p=${id}`)
      // The scratch pad now lives in the cloud; don't resurrect a stale copy.
      if (wasScratch) clearLocalSnapshot()
      cue("success")
    } catch {
      useFlipbook.getState().setCloudStatus("error")
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
    // Taller on tablet so its controls can hit a 44px target without being
    // squeezed against the border.
    <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4 pointer-coarse:h-14 max-lg:h-14 max-lg:gap-2">
      <Link
        href={session ? "/projects" : "/"}
        aria-label={session ? "My animations" : "Flipghost home"}
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
        className="h-7 w-28 min-w-0 shrink truncate rounded-md bg-transparent px-2 text-sm font-medium outline-none placeholder:text-muted-foreground hover:bg-muted focus-visible:bg-muted lg:w-48"
        placeholder="Untitled Animation"
      />

      <Select
        value={stagePresetId}
        onValueChange={(value) => setStagePreset(value as string)}
        items={Object.fromEntries(
          STAGE_PRESETS.map((p) => [p.id, `${p.label} · ${p.width}×${p.height}`])
        )}
      >
        <SelectTrigger
          aria-label="Canvas size"
          className="min-w-0 overflow-hidden max-lg:max-w-40 [&>span:first-child]:truncate"
        >
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

      {/* Does not shrink: the title and the size select give way instead, so
          these stay reachable rather than being clipped by the root. */}
      <div className="ml-auto flex shrink-0 items-center gap-2 pointer-coarse:[&_[data-slot=button]]:h-11 pointer-coarse:[&_[data-slot=button]]:min-w-11 max-lg:[&_[data-slot=button]]:h-11 max-lg:[&_[data-slot=button]]:min-w-11">
        {exportError && (
          <span role="alert" className="text-xs text-destructive">
            {exportError}
          </span>
        )}

        {/* A shortcut sheet is no use without a keyboard. */}
        <div className="hidden lg:block">
          <HotkeysMenu />
        </div>

        <div className="h-4 w-px bg-border max-lg:hidden" />

        {session && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="lg"
                  disabled={cloudStatus === "saving"}
                  onClick={handleSave}
                  aria-label="Save to cloud"
                >
                  {cloudStatus === "saving" ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="animate-spin"
                      strokeWidth={1.8}
                    />
                  ) : cloudStatus === "saved" && projectId ? (
                    <HugeiconsIcon
                      icon={CloudSavingDone01Icon}
                      strokeWidth={1.8}
                    />
                  ) : (
                    <HugeiconsIcon icon={CloudUploadIcon} strokeWidth={1.8} />
                  )}
                  <span className="hidden lg:inline">
                    {cloudStatus === "saving"
                      ? "Saving"
                      : cloudStatus === "saved" && projectId
                        ? "Saved"
                        : cloudStatus === "error"
                          ? "Retry save"
                          : "Save"}
                  </span>
                </Button>
              }
            />
            <TooltipContent side="bottom">
              {projectId
                ? "Changes save automatically"
                : "Save to your animations"}
            </TooltipContent>
          </Tooltip>
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
                    <span className="hidden lg:inline">Import</span>
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
                    <span className="hidden lg:inline">GIF</span>
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
                    <span className="hidden lg:inline">MP4</span>
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
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    render={<Link href="/projects" />}
                    aria-label="My animations"
                    className="text-muted-foreground"
                  >
                    <HugeiconsIcon icon={Album01Icon} strokeWidth={1.8} />
                  </Button>
                }
              />
              <TooltipContent side="bottom">My animations</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={<span className="inline-flex select-none" />}
              >
                <UserAvatar
                  seed={session.user.id}
                  size={24}
                  className="rounded-full"
                />
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
                    onClick={() =>
                      signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            window.location.href = "/"
                          },
                        },
                      })
                    }
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
