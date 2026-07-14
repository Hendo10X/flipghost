"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Delete02Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { deleteProjectFromCloud } from "@/lib/flipbook/cloud"
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface ProjectCardProps {
  id: string
  title: string
  thumbnail: string | null
  meta: string
  updatedAt: string
}

export function ProjectCard({
  id,
  title,
  thumbnail,
  meta,
  updatedAt,
}: ProjectCardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    setError(false)
    try {
      await deleteProjectFromCloud(id)
      router.refresh()
    } catch {
      setError(true)
      setDeleting(false)
    }
  }

  return (
    <div className="group relative flex flex-col gap-2">
      <Link
        href={`/workshop?p=${id}`}
        className="block overflow-hidden rounded-lg bg-white ring-1 ring-black/10 transition-shadow outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring dark:ring-white/15"
      >
        <div className="aspect-square w-full">
          {thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element -- data URL, not optimizable
            <img
              src={thumbnail}
              alt={`Preview of ${title}`}
              draggable={false}
              className="size-full object-contain select-none"
            />
          )}
        </div>
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={title}>
            {title}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {meta} · {updatedAt}
          </p>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              Delete failed. Try again.
            </p>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${title}`}
                className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-destructive"
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.8} />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogTitle>Delete this animation?</AlertDialogTitle>
            <AlertDialogDescription>
              “{title}” and all of its frames will be removed. This can&apos;t
              be undone.
            </AlertDialogDescription>
            <div className="mt-4 flex justify-end gap-2">
              <AlertDialogClose
                render={
                  <Button variant="outline" size="lg">
                    Cancel
                  </Button>
                }
              />
              <Button
                variant="destructive"
                size="lg"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting && (
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="animate-spin"
                    strokeWidth={1.8}
                  />
                )}
                Delete
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
