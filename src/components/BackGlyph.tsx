import { cn } from "@/lib/utils";

/** Facebook Lite–style back chevron « ❮ », used by every back button. */
export function BackGlyph({ className, size }: { className?: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex items-center justify-center font-bold leading-none select-none", className)}
      style={{ fontSize: size ? `${size}px` : "1.15em" }}
    >
      ❮
    </span>
  );
}
