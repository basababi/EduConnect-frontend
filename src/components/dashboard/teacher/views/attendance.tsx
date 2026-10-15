"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/ui/dashboard-ui";
import {
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Save,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  sessionsApi,
  type AttendanceStatus,
  type ClassSession,
  type SessionDetail,
} from "@/lib/api";
import { addDaysLocal, formatDate, formatTimeRange, todayLocal, isoWeekdayOf } from "@/lib/format";
import { ATTENDANCE_STATUS_LABELS, WEEKDAY_LABELS } from "@/lib/terms";
import {
  AttendanceToggle,
  SessionKindPill,
  SessionMeta,
  SessionStatusPill,
} from "@/components/dashboard/sessions/session-ui";
import { ReasonDialog } from "@/components/dashboard/reason-dialog";

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

/**
 * Багшийн ирц — хичээл (session) бүрээр. Өдрөө сонгоод хичээлээ дарж, ирээгүй/хоцорсон
 * сурагчийг л тэмдэглэнэ (бусад нь "ирсэн"). Утсан дээр нэг гараар хийхэд зориулсан.
 */
export function TeacherAttendance() {
  const [today] = useState(todayLocal);
  const [date, setDate] = useState(todayLocal);
  const [sessions, setSessions] = useState<ClassSession[] | null>(null);
  const [loadedDate, setLoadedDate] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    sessionsApi
      .list({ from: date, to: date })
      .then((list) => {
        if (cancelled) return;
        setSessions(list);
        setLoadedDate(date);
        // Ирц нь бүртгэгдээгүй эхний хичээлийг автоматаар нээнэ
        setSelectedId((current) =>
          current && list.some((s) => s.id === current)
            ? current
            : (list.find((s) => s.status === "scheduled") ?? list[0])?.id ?? null,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setSessions([]);
        setLoadedDate(date);
      });
    return () => {
      cancelled = true;
    };
  }, [date, version]);

  const loading = loadedDate !== date;
  const selected = sessions?.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="animate-in-rise space-y-5 p-4 sm:p-6">
      <PageHeader
        icon={CheckSquare}
        title="Ирц бүртгэл"
        description="Хичээлээ сонгоод ирээгүй, хоцорсон сурагчийг тэмдэглэнэ — бусад нь ирсэн гэж бүртгэгдэнэ."
      />

      {/* Өдөр сонгох */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          title="Өмнөх өдөр"
          onClick={() => setDate((d) => addDaysLocal(d, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input
          type="date"
          aria-label="Огноо"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="w-40"
        />
        <Button
          variant="outline"
          size="icon"
          title="Дараагийн өдөр"
          onClick={() => setDate((d) => addDaysLocal(d, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {WEEKDAY_LABELS[isoWeekdayOf(date)]}
          {date === today && " · Өнөөдөр"}
        </span>
        {date !== today && (
          <Button variant="ghost" size="sm" onClick={() => setDate(today)}>
            Өнөөдөр
          </Button>
        )}
      </div>

      {/* Тухайн өдрийн хичээлүүд */}
      {!sessions ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border bg-card">
          <EmptyState
            icon={CalendarDays}
            title={`${formatDate(date)}-нд хичээл алга`}
            description="Хичээлүүд бүлгийн долоо хоногийн хуваариас автоматаар үүсдэг. Хуваарийг админ бүлгийн дэлгэрэнгүйгээс тохируулна."
          />
        </div>
      ) : (
        <div className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-3", loading && "opacity-60")}>
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              aria-pressed={s.id === selectedId}
              className={cn(
                "rounded-xl border bg-card p-3 text-left transition-shadow hover:shadow-md",
                s.id === selectedId && "border-primary ring-2 ring-primary/30",
              )}
            >
              <SessionMeta session={s} />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <SessionStatusPill status={s.status} />
                <SessionKindPill kind={s.kind} />
                {s.attendance && s.attendance.total > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {s.attendance.present + s.attendance.late}/{s.attendance.total} ирсэн
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <SessionAttendance
          key={`${selected.id}-${version}`}
          sessionId={selected.id}
          isFuture={selected.date > today}
          onSaved={() => setVersion((v) => v + 1)}
        />
      )}
    </div>
  );
}

function SessionAttendance({
  sessionId,
  isFuture,
  onSaved,
}: {
  sessionId: number;
  isFuture: boolean;
  onSaved: () => void;
}) {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [marks, setMarks] = useState<Record<number, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [topic, setTopic] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    sessionsApi
      .get(sessionId)
      .then((d) => {
        setDetail(d);
        setMarks(
          Object.fromEntries(d.roster.map((r) => [r.student_id, r.attendance?.status ?? "present"])),
        );
        setNotes(
          Object.fromEntries(d.roster.map((r) => [r.student_id, r.attendance?.note ?? ""])),
        );
        setTopic(d.topic ?? "");
      })
      .catch(() => setFailed(true));
  }, [sessionId]);

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const st of Object.values(marks)) c[st] += 1;
    return c;
  }, [marks]);

  if (failed) {
    return (
      <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
        Хичээлийг ачаалж чадсангүй
      </p>
    );
  }
  if (!detail) return <Skeleton className="h-72 w-full rounded-2xl" />;

  const cancelled = detail.status === "cancelled";
  const editable = !cancelled && !isFuture;
  const q = search.trim().toLowerCase();
  const roster = detail.roster.filter(
    (r) => !q || `${r.name} ${r.student_code ?? ""}`.toLowerCase().includes(q),
  );

  async function save() {
    if (!detail) return;
    setSaving(true);
    try {
      // Бүх сурагчийг тодорхой илгээнэ — дахин засахад "ирээгүй → ирсэн" өөрчлөлт ч хадгалагдана
      await sessionsApi.markAttendance(detail.id, {
        marks: detail.roster.map((r) => ({
          student_id: r.student_id,
          status: marks[r.student_id] ?? "present",
          note: notes[r.student_id]?.trim() || undefined,
        })),
        topic: topic.trim() || undefined,
      });
      toast.success(
        `Ирц хадгалагдлаа: ${counts.present + counts.late}/${detail.roster.length} ирсэн`,
      );
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Хадгалж чадсангүй");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border bg-card shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground">{detail.class?.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(detail.date)} · {formatTimeRange(detail.start_time, detail.end_time)}
            {detail.room ? ` · ${detail.room}` : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <SessionStatusPill status={detail.status} />
            <SessionKindPill kind={detail.kind} />
          </div>
        </div>
        {detail.status === "scheduled" && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:bg-destructive/10"
            onClick={() => setCancelling(true)}
          >
            <XCircle className="h-3.5 w-3.5" />
            Хичээл цуцлах
          </Button>
        )}
      </header>

      {cancelled ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Энэ хичээл цуцлагдсан{detail.cancel_reason ? `: ${detail.cancel_reason}` : ""}
        </p>
      ) : detail.roster.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Энэ бүлэгт суралцаж буй сурагч алга
        </p>
      ) : (
        <div className="space-y-4 p-4">
          {isFuture && (
            <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              Хичээл болоогүй байна — ирцийг хичээлийн өдөр бүртгэнэ.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {STATUSES.map((st) => (
              <span key={st} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                {ATTENDANCE_STATUS_LABELS[st]}{" "}
                <span className="font-semibold tabular-nums">{counts[st]}</span>
              </span>
            ))}
            {editable && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() =>
                  setMarks(Object.fromEntries(detail.roster.map((r) => [r.student_id, "present"])))
                }
              >
                Бүгд ирсэн
              </Button>
            )}
          </div>

          {detail.roster.length > 8 && (
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Сурагч хайх..."
                className="pl-9"
              />
            </div>
          )}

          <ul className="divide-y rounded-xl border">
            {roster.map((r) => {
              const status = marks[r.student_id] ?? "present";
              return (
                <li
                  key={r.student_id}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                    {r.student_code && (
                      <p className="text-xs text-muted-foreground">{r.student_code}</p>
                    )}
                  </div>
                  <div className="w-full space-y-1.5 sm:w-auto sm:min-w-80">
                    <AttendanceToggle
                      label={r.name}
                      value={status}
                      disabled={!editable || saving}
                      onChange={(st) => setMarks((m) => ({ ...m, [r.student_id]: st }))}
                    />
                    {editable && status !== "present" && (
                      <Input
                        value={notes[r.student_id] ?? ""}
                        onChange={(e) =>
                          setNotes((n) => ({ ...n, [r.student_id]: e.target.value }))
                        }
                        placeholder="Тайлбар (заавал биш)"
                        maxLength={300}
                        className="h-8 text-xs"
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {editable && (
            <>
              <div className="space-y-2">
                <Label htmlFor="session-topic">Хичээлийн сэдэв</Label>
                <Input
                  id="session-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Жишээ: Present Simple, давталт"
                  maxLength={200}
                />
              </div>
              <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] flex justify-end md:bottom-3">
                <Button size="lg" className="gap-2 shadow-lg" disabled={saving} onClick={save}>
                  <Save className="h-4 w-4" />
                  {saving
                    ? "Хадгалж байна..."
                    : detail.status === "held"
                      ? "Ирцийг шинэчлэх"
                      : "Ирц хадгалах"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <ReasonDialog
        open={cancelling}
        onOpenChange={setCancelling}
        title="Хичээл цуцлах"
        description={`${detail.class?.name ?? ""} · ${formatDate(detail.date)} ${detail.start_time}. Бүлгийн сурагч, эцэг эхэд мэдэгдэл очно.`}
        confirmLabel="Цуцлах"
        onConfirm={async (reason) => {
          await sessionsApi.cancel(detail.id, reason);
          toast.success("Хичээл цуцлагдлаа");
          onSaved();
        }}
      />
    </section>
  );
}
