import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton-shimmer bg-slate-200/70 dark:bg-white/5 rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };

