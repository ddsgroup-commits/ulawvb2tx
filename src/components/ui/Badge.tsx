import { cn } from "@/lib/utils";
import { TAG_LABELS, TAG_COLORS, EVENT_TYPE_LABELS, EVENT_TYPE_TEXT_COLORS } from "@/lib/utils";
import type { AnnouncementTag, EventType } from "@prisma/client";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "navy" | "gold";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "badge",
        variant === "navy" && "bg-navy text-white",
        variant === "gold" && "bg-gold text-white",
        variant === "outline" && "border border-current bg-transparent",
        variant === "default" && "bg-slate-100 text-slate-700",
        className
      )}
    >
      {children}
    </span>
  );
}

export function TagBadge({ tag }: { tag: AnnouncementTag }) {
  return (
    <span className={cn("badge", TAG_COLORS[tag])}>
      {TAG_LABELS[tag]}
    </span>
  );
}

export function EventTypeBadge({ type }: { type: EventType }) {
  const colorMap: Record<EventType, string> = {
    CLASS: "bg-blue-100 text-blue-700",
    EXAM: "bg-red-100 text-red-700",
    DEADLINE: "bg-amber-100 text-amber-700",
    EVENT: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={cn("badge", colorMap[type])}>
      {EVENT_TYPE_LABELS[type]}
    </span>
  );
}
