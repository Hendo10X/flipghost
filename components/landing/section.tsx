import { cn } from "@/lib/utils"

/**
 * Shared shell for landing sections: an accent eyebrow, a display heading,
 * and a capped-measure description above the section's panel.
 */
export function Section({
  eyebrow,
  title,
  description,
  children,
  className,
  headerClassName,
}: {
  eyebrow: string
  title: string
  description: string
  children?: React.ReactNode
  className?: string
  headerClassName?: string
}) {
  return (
    <section className={cn("mx-auto w-full max-w-5xl px-6 py-16 sm:py-20", className)}>
      <div className={cn("mb-8 flex flex-col gap-1.5", headerClassName)}>
        <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
          {eyebrow}
        </span>
        <h2 className="font-display text-2xl leading-tight font-normal tracking-tight text-balance sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-lg text-sm leading-relaxed text-pretty text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </section>
  )
}

/** A bordered surface used as the visual half of a feature section. */
export function Panel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card p-6 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  )
}
