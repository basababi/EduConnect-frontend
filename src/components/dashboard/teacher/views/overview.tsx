"use client";

import { useEffect, useState } from "react";
import {
  Users, CheckCircle2, FileText, MessageSquare, ArrowRight,
  CalendarDays, ClipboardList,
} from "lucide-react";
import {
  api, type User, type ClassRoom, type Student,
  type Assignment, type Conversation, type AttendanceSummary,
} from "@/lib/api";
import { StatCard, SectionCard, EmptyState, Pill } from "@/components/ui/dashboard-ui";

interface Props {
  user: User;
}

export function TeacherOverview({ user }: Props) {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const cls = await api.get<ClassRoom[]>("/classes");
        setClasses(cls);

        const allStudents = await api.get<Student[]>("/students");
        setStudents(allStudents);

        const a = await api.get<Assignment[]>("/assignments/my");
        setAssignments(a);

        const convs = await api.get<Conversation[]>("/messages/conversations");
        setConversations(convs);

        if (cls.length > 0) {
          const today = new Date();
          const start = new Date(today);
          start.setDate(start.getDate() - 30);
          const sum = await api.get<AttendanceSummary>(
            `/attendance/summary/${cls[0].id}?start_date=${start.toISOString().split("T")[0]}&end_date=${today.toISOString().split("T")[0]}`,
          );
          setSummary(sum);
        }
      } catch (err) {
        console.error("Failed to load overview:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const today = new Date();
  const dateStr = today.toLocaleDateString("mn-MN", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  const totalStudents = students.length;
  const attendanceRate = summary?.attendance_rate ?? 0;
  const presentToday = summary?.present ?? 0;
  const absentToday = summary?.absent ?? 0;
  const lateToday = summary?.late ?? 0;

  const activeAssignments = assignments.filter((a) => a.status === "active").length;
  const totalAssignments = assignments.length;
  const overdueCount = assignments.filter((a) => a.is_overdue).length;
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm">
        <div className="absolute -right-8 -top-10 size-40 rounded-full bg-amber/20 blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight">
            Өдрийн мэнд, {user.first_name} {user.last_name} 👋
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-primary-foreground/70">
            <CalendarDays className="size-3.5" />
            {dateStr}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-medium ring-1 ring-white/15">
              {classes.length} анги
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-medium ring-1 ring-white/15">
              {totalStudents} сурагч
            </span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          tone="navy"
          label="Нийт сурагч"
          value={totalStudents}
          hint={`${classes.length} ангид`}
        />
        <StatCard
          icon={CheckCircle2}
          tone="emerald"
          label="30 хоногийн ирц"
          value={`${attendanceRate}%`}
          hint={`${presentToday} ирсэн · ${absentToday} тасалсан · ${lateToday} хоцорсон`}
        />
        <StatCard
          icon={FileText}
          tone="amber"
          label="Идэвхтэй даалгавар"
          value={
            <>
              {activeAssignments}
              <span className="text-base font-semibold text-muted-foreground">/{totalAssignments}</span>
            </>
          }
          hint={overdueCount > 0 ? `${overdueCount} хугацаа дууссан` : "Бүгд хугацаандаа"}
        />
        <StatCard
          icon={MessageSquare}
          tone={unreadMessages > 0 ? "rose" : "default"}
          label="Шинэ мессеж"
          value={unreadMessages}
          hint={`${conversations.length} харилцаа`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Classes */}
        <SectionCard
          icon={Users}
          title="Миний ангиуд"
          action={
            <button className="inline-flex items-center gap-1 text-xs font-medium text-primary transition hover:underline">
              Бүгдийг харах <ArrowRight className="size-3" />
            </button>
          }
          bodyClassName="space-y-2"
        >
          {classes.length === 0 ? (
            <EmptyState icon={Users} title="Анги байхгүй" />
          ) : (
            classes.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary/20 hover:bg-muted/40"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.grade_level}-р анги · {c.academic_year}
                  </p>
                </div>
                {c.teacher && (
                  <Pill tone="slate">
                    {c.teacher.first_name} {c.teacher.last_name}
                  </Pill>
                )}
              </div>
            ))
          )}
        </SectionCard>

        {/* Recent assignments */}
        <SectionCard
          icon={ClipboardList}
          title="Сүүлийн даалгаврууд"
          bodyClassName="space-y-2"
        >
          {assignments.length === 0 ? (
            <EmptyState icon={FileText} title="Даалгавар алга" />
          ) : (
            assignments.slice(0, 4).map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary/20 hover:bg-muted/40"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.subject} · {a.class?.name ?? "—"}
                  </p>
                </div>
                {a.is_overdue ? (
                  <Pill tone="rose">Хугацаа дууссан</Pill>
                ) : (
                  <Pill tone="emerald">{a.days_until_due > 0 ? `${a.days_until_due} хоног` : "Идэвхтэй"}</Pill>
                )}
              </div>
            ))
          )}
        </SectionCard>
      </div>

      {/* Attendance chart */}
      {summary && (
        <SectionCard icon={CheckCircle2} title={`Ирцийн статистик — ${summary.class_name}`}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex items-center justify-center">
              <div className="relative size-36">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted" />
                  <circle
                    cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(attendanceRate * 251.2) / 100} 251.2`}
                    className="text-emerald-500 transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold tabular-nums text-foreground">{attendanceRate}%</span>
                  <span className="text-[11px] text-muted-foreground">ирц</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { label: "Ирсэн", value: presentToday, dot: "bg-emerald-500" },
                { label: "Тасалсан", value: absentToday, dot: "bg-rose-500" },
                { label: "Хоцорсон", value: lateToday, dot: "bg-amber-500" },
                { label: "Чөлөөтэй", value: summary.excused, dot: "bg-sky-500" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className={`size-2 rounded-full ${row.dot}`} />
                    {row.label}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">{row.value}</span>
                </div>
              ))}
              <p className="border-t border-border pt-2 text-xs text-muted-foreground">
                Нийт бичлэг: {summary.total_records}
              </p>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
