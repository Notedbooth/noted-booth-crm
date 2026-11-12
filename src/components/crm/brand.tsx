import { cn } from "@/lib/utils";

export function BrandMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <div className={cn("flex items-center gap-3", className)} dir="ltr">
      <div
        className={cn(
          "grid size-10 place-items-center rounded-xl border-2",
          tone === "light" ? "border-sidebar-primary bg-sidebar-accent" : "border-primary bg-secondary",
        )}
      >
        <div className={cn("size-4 rounded-full border-2", tone === "light" ? "border-sidebar-primary" : "border-primary")} />
      </div>
      <div className="leading-none">
        <div
          className={cn(
            "font-display text-xl font-bold tracking-[0.2em]",
            tone === "light" ? "text-sidebar-foreground" : "text-primary",
          )}
        >
          NOTED
        </div>
        <div
          className={cn(
            "mt-1 text-[10px] font-medium tracking-[0.35em]",
            tone === "light" ? "text-sidebar-primary" : "text-muted-foreground",
          )}
        >
          PHOTO BOOTH
        </div>
      </div>
    </div>
  );
}
