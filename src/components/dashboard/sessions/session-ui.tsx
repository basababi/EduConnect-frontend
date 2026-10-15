"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/ui/dashboard-ui";
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Hourglass,
  MapPin,
  UserRound,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  sessionsApi,
  type AttendanceStatus,
  type ClassSession,
  type SessionStatus,
} from "@/lib/api";
import {
  addDaysLocal,
  formatDate,
  formatTimeRange,
  todayLocal,
  weekStartLocal,
} from "@/lib/format";
import {
  ATTENDANCE_STATUS_LABELS,
  SESSION_KIND_LABELS,
  SESSION_STATUS_LABELS,
  WEEKDAY_LABELS,
} from "@/lib/terms";

/* ──────────────────────────────────────────────
   Хичээлийн төлөв — өнгө дангаараа утга зөөхгүй: дүрс + үгтэй
   ────────────────────────────────────────────── */
export function SessionStatusPill({ status }: { status: SessionStatus }) {
  if (status === "held") {
    return (
      <Pill tone="emerald" icon={CheckCircle2}>
        {SESSION_STATUS_LABELS.held}
      </Pill>
    );
  }
  if (status === "cancelled") {
    return (
      <Pill tone="rose" icon={Ban}>
        {SESSION_STATUS_LABELS.cancelled}
      </Pill>
    );
  }
  return (
    <Pill tone="slate" icon={Clock}>
      {SESSION_STATUS_LABELS.scheduled}
    </Pill>
  );
}

export function SessionKindPill({ kind }: { kind: ClassSession["kind"] }) {
  if (kind === "regular") return null;
  return <Pill tone="navy">{SESSION_KIND_LABELS[kind]}</Pill>;
}

/* ──────────────────────────────────────────────
   Ирцийн 4 сонголт — утсан дээр хуруугаар дарахад хангалттай том
   ────────────────────────────────────────────── */
const ATTENDANCE_OPTIONS: Array<{
  status: AttendanceStatus;
  icon: typeof CheckCircle2;
  active: string;
}> = [
  { status: "present", icon: CircleCheck, active: "bg-emerald-600 text-white border-emerald-600" },
  { status: "absent", icon: XCircle, active: "bg-rose-600 text-white border-rose-600" },
  { status: "late", icon: Hourglass, active: "bg-amber-500 text-white border-amber-500" },
  { status: "excused", icon: CheckCircle2, active: "bg-sky-600 text-white border-sky-600" },
];

export function AttendanceToggle({
  value,
  onChange,
  disabled,
  label,
}: {
  value: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  disabled?: boolean;
  /** Дэлгэц уншигчид: сурагчийн нэр */
  label: string;
}) {
  return (
    <div role="group" aria-label={`${label} — ирц`} className="grid grid-cols-2 gap-1 sm:grid-cols-4">
      {ATTENDANCE_OPTIONS.map((o) => {
        const Icon = o.icon;
        const active = value === o.status;
        return (
          <button
            key={o.status}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(o.status)}
            className={cn(
              "flex h-9 items-center justify-center gap-1 rounded-lg border px-2 text-xs font-medium transition-colors disabled:opacity-50",
              active
                ? o.active
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{ATTENDANCE_STATUS_LABELS[o.status]}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Хичээлийн товч мэдээлэл: цаг · бүлэг · өрөө · багш */
export function SessionMeta({
  session,
  showGroup = true,
  showTeacher = false,
}: {
  session: ClassSession;
  showGroup?: boolean;
  showTeacher?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="flex flex-wrap items-center gap-x-2 text-sm">
        <span className="font-semibold tabular-nums text-foreground">
          {formatTimeRange(session.start_time, session.end_time)}
        </span>
        {showGroup && session.class && (
          <span className="truncate font-medium text-foreground">{session.class.name}</span>
        )}
      </p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-xs text-muted-foreground">
        {session.room && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {session.room}
          </span>
        )}
        {showTeacher && session.teacher && (
          <span className="inline-flex items-center gap-1">
            <UserRound className="h-3 w-3" />
            {session.teacher.last_name} {session.teacher.first_name}
          </span>
        )}
        {session.topic && <span className="truncate">{session.topic}</span>}
      </p>
      {session.status === "cancelled" && session.cancel_reason && (
        <p className="mt-0.5 text-xs text-rose-700">{session.cancel_reason}</p>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Долоо хоногийн хуваарь — багш, сурагч, эцэг эх (сервер эрхээр нь шүүнэ)
   ────────────────────────────────────────────── */
export function WeekSchedule({
  showGroup = true,
  showTeacher = false,
  filter,
  emptyText = "Энэ долоо хоногт хичээл алга",
}: {
  showGroup?: boolean;
  showTeacher?: boolean;
  /** Жишээ нь эцэг эхийн сонгосон хүүхдийн бүлгүүдээр шүүх */
  filter?: (s: ClassSession) => boolean;
  emptyText?: string;
}) {
  const [today] = useState(todayLocal);
  const [weekStart, setWeekStart] = useState(() => weekStartLocal(todayLocal()));
  const weekEnd = addDaysLocal(weekStart, 6);
  const [sessions, setSessions] = useState<ClassSession[] | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    sessionsApi
      .list({ from: weekStart, to: weekEnd })
      .then((list) => {
        if (cancelled) return;
        setSessions(list);
        setFailed(false);
        setLoadedKey(weekStart);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoadedKey(weekStart);
      });
    return () => {
      cancelled = true;
    };
  }, [weekStart, weekEnd]);

  const loading = loadedKey !== weekStart;
  const visible = (sessions ?? []).filter((s) => !filter || filter(s));
  const days = Array.from({ length: 7 }, (_, i) => addDaysLocal(weekStart, i));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            title="Өмнөх долоо хоног"
            onClick={() => setWeekStart((w) => addDaysLocal(w, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-44 text-center text-sm font-medium tabular-nums text-foreground">
            {formatDate(weekStart)} – {formatDate(weekEnd)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            title="Дараагийн долоо хоног"
            onClick={() => setWeekStart((w) => addDaysLocal(w, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {weekStart !== weekStartLocal(today) && (
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(weekStartLocal(today))}>
            Энэ долоо хоног
          </Button>
        )}
      </div>

      {failed ? (
        <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          Хуваарийг ачаалж чадсангүй
        </p>
      ) : !sessions ? (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((d) => (
            <Skeleton key={d} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className={cn("transition-opacity", loading && "opacity-60")}>
          {visible.length === 0 && (
            <p className="mb-3 rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          )}
          <div className="grid gap-2 md:grid-cols-7">
            {days.map((d, i) => {
              const daySessions = visible.filter((s) => s.date === d);
              const isToday = d === today;
              if (daySessions.length === 0 && visible.length === 0) return null;
              return (
                <section
                  key={d}
                  className={cn(
                    "rounded-xl border bg-card p-2.5",
                    isToday && "border-primary/50 ring-1 ring-primary/30",
                    daySessions.length === 0 && "hidden md:block",
                  )}
                >
                  <h3 className="mb-2 flex items-baseline justify-between gap-1 text-xs">
                    <span className={cn("font-semibold", isToday ? "text-primary" : "text-foreground")}>
                      {WEEKDAY_LABELS[i + 1]}
                      {isToday && " · Өнөөдөр"}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{d.slice(5).replace("-", ".")}</span>
                  </h3>
                  <div className="space-y-1.5">
                    {daySessions.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground/60">—</p>
                    ) : (
                      daySessions.map((s) => (
                        <div
                          key={s.id}
                          className={cn(
                            "rounded-lg border p-2",
                            s.status === "cancelled" && "bg-muted/50",
                          )}
                        >
                          <div
                            className={cn(
                              s.status === "cancelled" && "[&_.font-semibold]:line-through",
                            )}
                          >
                            <SessionMeta session={s} showGroup={showGroup} showTeacher={showTeacher} />
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {s.status !== "scheduled" && <SessionStatusPill status={s.status} />}
                            <SessionKindPill kind={s.kind} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
