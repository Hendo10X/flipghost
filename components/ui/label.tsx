import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-xs font-medium select-none peer-disabled:pointer-events-none peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
