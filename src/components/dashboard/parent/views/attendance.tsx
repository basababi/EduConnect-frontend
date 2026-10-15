"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader, Pill } from "@/components/ui/dashboard-ui";
import { CheckSquare, CircleCheck, Hourglass, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  api,
  attendanceApi,
  enrollmentsApi,
  studentDisplayName,
  type AttendanceRecord,
  type AttendanceStatus,
  type StudentAttendanceSummary,
} from "@/lib/api";
import { formatDate, formatTimeRange, isoWeekdayOf } from "@/lib/format";
import { ATTENDANCE_STATUS_LABELS, WEEKDAY_SHORT } from "@/lib/terms";
import { WeekSchedule } from "@/components/dashboard/sessions/session-ui";

interface ChildLink {
  student_id: number;
  student: {
    id: number;
    student_code: string | null;
    first_name?: string | null;
    last_name?: string | null;
    user: { id: number; first_name: string; last_name: string } | null;
  } | null;
}

const STATUS_PILL: Record<
  AttendanceStatus,
  { tone: "emerald" | "rose" | "amber" | "navy"; icon: typeof CircleCheck }
> = {
  present: { tone: "emerald", icon: CircleCheck },
  absent: { tone: "rose", icon: XCircle },
  late: { tone: "amber", icon: Hourglass },
  excused: { tone: "navy", icon: Info },
};

export function AttendancePill({ status }: { status: AttendanceStatus }) {
  const meta = STATUS_PILL[status] ?? STATUS_PILL.present;
  return (
    <Pill tone={meta.tone} icon={meta.icon}>
      {ATTENDANCE_STATUS_LABELS[status] ?? status}
    </Pill>
  );
}

const childName = (c: ChildLink) =>
  c.student ? studentDisplayName(c.student) : `Сурагч #${c.student_id}`;

/** Эцэг эх — хүүхдийн ирцийн хувь, хичээл бүрийн ирц, ирэх хичээлүүд */
export function ParentAttendance() {
  const [children, setChildren] = useState<ChildLink[] | null>(null);
  const [childId, setChildId] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<ChildLink[]>("/parent-student/my-children")
      .then((list) => {
        setChildren(list);
        setChildId(list[0]?.student_id ?? null);
      })
      .catch(() => setChildren([]));
  }, []);

  if (!children) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="animate-in-rise space-y-6 p-4 sm:p-6">
      <PageHeader icon={CheckSquare} title="Ирц" description="Хичээл бүрийн ирц, ирэх хичээлүүд" />

      {children.length === 0 ? (
        <div className="rounded-2xl border bg-card">
          <EmptyState
            icon={CheckSquare}
            title="Холбогдсон хүүхэд алга"
            description="Төвийн админ таныг хүүхэдтэй тань холбосны дараа ирц энд харагдана."
          />
        </div>
      ) : (
        <>
          {children.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {children.map((c) => (
                <button
                  key={c.student_id}
                  type="button"
                  aria-pressed={c.student_id === childId}
                  onClick={() => setChildId(c.student_id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    c.student_id === childId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent",
                  )}
                >
                  {childName(c)}
                </button>
              ))}
            </div>
          )}
          {childId && <ChildAttendance key={childId} studentId={childId} />}
        </>
      )}
    </div>
  );
}

function ChildAttendance({ studentId }: { studentId: number }) {
  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [classIds, setClassIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    attendanceApi
      .studentSummary(studentId)
      .then(setSummary)
      .catch(() => setSummary(null));
    attendanceApi
      .byStudent(studentId)
      .then(setRecords)
      .catch(() => setRecords([]));
    enrollmentsApi
      .forStudent(studentId)
      .then((list) =>
        setClassIds(
          new Set(
            list.filter((e) => e.status === "active" || e.status === "paused").map((e) => e.class_id),
          ),
        ),
      )
      .catch(() => setClassIds(new Set()));
  }, [studentId]);

  const counts: Array<{ status: AttendanceStatus; value: number }> = summary
    ? [
        { status: "present", value: summary.present },
        { status: "absent", value: summary.absent },
        { status: "late", value: summary.late },
        { status: "excused", value: summary.excused },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        {!summary ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : summary.total === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Ирц хараахан бүртгэгдээгүй байна
          </p>
        ) : (
          <>
            <p className="text-xs font-medium text-muted-foreground">Ирсэн хувь (хоцорсныг оруулав)</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-foreground">
              {summary.attendance_rate ?? "—"}%
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {counts.map((c) => (
                <span key={c.status} className="inline-flex items-center gap-1.5 text-sm">
                  <AttendancePill status={c.status} />
                  <span className="font-semibold tabular-nums text-foreground">{c.value}</span>
                </span>
              ))}
            </div>
            {summary.by_class.length > 1 && (
              <ul className="mt-4 divide-y border-t">
                {summary.by_class.map((c) => (
                  <li key={c.class_id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="truncate text-foreground">{c.class_name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {c.attendance_rate ?? "—"}% · {c.absent} ирээгүй
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-foreground">Хичээлийн хуваарь</h2>
        <WeekSchedule
          showTeacher
          filter={(s) => classIds.has(s.class_id)}
          emptyText="Энэ долоо хоногт хичээл алга"
        />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-foreground">Ирцийн түүх</h2>
        {!records ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : records.length === 0 ? (
          <p className="rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">
            Бүртгэл алга
          </p>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card">
            {records.slice(0, 60).map((r) => {
              const date = (r.session?.date ?? r.date).slice(0, 10);
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(date)} · {WEEKDAY_SHORT[isoWeekdayOf(date)]}
                      {r.session && (
                        <span className="ml-2 font-normal tabular-nums text-muted-foreground">
                          {formatTimeRange(r.session.start_time, r.session.end_time)}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[r.class?.name, r.session?.topic, r.note].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <AttendancePill status={r.status} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
