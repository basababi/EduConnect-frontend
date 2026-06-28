import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ──────────────────────────────────────────────
   PageHeader — consistent title block for every view
   ────────────────────────────────────────────── */
export function PageHeader({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Icon className="size-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground text-balance">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────
   StatCard — KPI tile with optional trend + accent
   ────────────────────────────────────────────── */
type StatTone = "default" | "navy" | "amber" | "emerald" | "rose";

const STAT_TONES: Record<
  StatTone,
  { iconWrap: string; value: string }
> = {
  default: { iconWrap: "bg-muted text-foreground", value: "text-foreground" },
  navy: { iconWrap: "bg-primary/10 text-primary", value: "text-foreground" },
  amber: { iconWrap: "bg-amber-100 text-amber-600", value: "text-foreground" },
  emerald: { iconWrap: "bg-emerald-100 text-emerald-600", value: "text-foreground" },
  rose: { iconWrap: "bg-rose-100 text-rose-600", value: "text-foreground" },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  trend,
  tone = "default",
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  tone?: StatTone;
  className?: string;
}) {
  const t = STAT_TONES[tone];
  const trendColor =
    trend?.direction === "up"
      ? "text-emerald-600"
      : trend?.direction === "down"
        ? "text-rose-600"
        : "text-muted-foreground";

  return (
    <div
      className={cn(
        "group rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
            t.iconWrap,
          )}
        >
          <Icon className="size-4.5" />
        </div>
        {trend && (
          <span className={cn("text-xs font-semibold", trendColor)}>
            {trend.value}
          </span>
        )}
      </div>
      <p className={cn("mt-3 text-2xl font-bold tracking-tight tabular-nums", t.value)}>
        {value}
      </p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

/* ──────────────────────────────────────────────
   SectionCard — titled content panel
   ────────────────────────────────────────────── */
export function SectionCard({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && <Icon className="size-4 shrink-0 text-primary" />}
            <div className="min-w-0">
              {title && (
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              )}
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   EmptyState — consistent empty/placeholder block
   ────────────────────────────────────────────── */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/5 ring-1 ring-primary/10">
        <Icon className="size-6 text-primary/40" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Pill — small status / category chip
   ────────────────────────────────────────────── */
const PILL_TONES = {
  navy: "bg-primary/10 text-primary",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  rose: "bg-rose-100 text-rose-700",
  slate: "bg-muted text-muted-foreground",
} as const;

export function Pill({
  children,
  tone = "slate",
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof PILL_TONES;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        PILL_TONES[tone],
        className,
      )}
    >
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  );
}
