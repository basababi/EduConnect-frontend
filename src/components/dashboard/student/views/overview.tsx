"use client";

import { useEffect, useState } from "react";
import {
  BookOpen, Heart, Briefcase, FileText, AlertTriangle,
  TrendingUp, CheckCircle2, Clock, Sparkles, ArrowRight, CalendarDays,
  BookMarked, MapPin,
} from "lucide-react";
import {
  api, studentsApi, subjectsApi,
  type User, type GradeAverage, type Assignment, type Student, type Subject,
} from "@/lib/api";
import type { StudentView } from "@/components/dashboard/student/student-shell";
import { StatCard, SectionCard, EmptyState, Pill } from "@/components/ui/dashboard-ui";

interface Props {
  user: User;
  onNavigate: (view: StudentView) => void;
}

function gradeColor(p: number) {
  if (p >= 80) return { text: "text-emerald-600", bar: "bg-emerald-500" };
  if (p >= 60) return { text: "text-amber-600", bar: "bg-amber-500" };
  return { text: "text-rose-600", bar: "bg-rose-500" };
}

export function StudentOverview({ user, onNavigate }: Props) {
  const [gradeAvg, setGradeAvg] = useState<GradeAverage | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Элссэн хичээлүүд (student record-оос хамааралгүй)
        subjectsApi.enrolled().then(setSubjects).catch(() => setSubjects([]));

        // Сурагчийн өөрийн бүртгэл (student record id-г дүн/даалгаварт ашиглана)
        const mine = await studentsApi.me().catch(() => null);
        if (mine) {
          setStudentProfile(mine);
          const [avg, asgn] = await Promise.allSettled([
            api.get<GradeAverage>(`/grades/student/${mine.id}/average`),
            mine.class_id
              ? api.get<Assignment[]>(`/assignments/class/${mine.class_id}`)
              : Promise.resolve([] as Assignment[]),
          ]);
          if (avg.status === "fulfilled") setGradeAvg(avg.value);
          if (asgn.status === "fulfilled") setAssignments(asgn.value);
        }
      } catch {
        // errors handled per-call
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id]);

  const today = new Date();
  const dateStr = today.toLocaleDateString("mn-MN", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  const lowSubjects = gradeAvg?.by_subject.filter((s) => s.average_percentage < 60) ?? [];
  const upcomingAssignments = assignments
    .filter((a) => a.status === "active" && !a.is_overdue)
    .slice(0, 4);
  const overdueAssignments = assignments.filter((a) => a.is_overdue);

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="h-28 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm">
        <div className="absolute -right-8 -top-10 size-40 rounded-full bg-amber/20 blur-2xl" />
        <div className="absolute -bottom-12 right-24 size-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Өдрийн мэнд, {user.first_name}! 👋
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-primary-foreground/70">
              <CalendarDays className="size-3.5" />
              {dateStr}
            </p>
            {studentProfile?.class && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15">
                {studentProfile.class.name} · {studentProfile.class.grade_level}-р анги
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigate("ai-tutor")}
            className="group flex items-center gap-2 rounded-xl bg-amber px-4 py-2.5 text-sm font-semibold text-amber-foreground shadow-sm transition hover:brightness-105"
          >
            <Sparkles className="size-4" />
            AI Дагуул нээх
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Low-score warning */}
      {lowSubjects.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <AlertTriangle className="size-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Анхаарах хичээлүүд</p>
            <p className="mt-0.5 text-sm text-amber-700">
              {lowSubjects.map((s) => (
                <span key={s.subject} className="mr-1">
                  <strong>{s.subject}</strong> ({Math.round(s.average_percentage)}%)
                </span>
              ))}
              — AI Хичээлийн Дагуул ашиглан хоцрогдлоо нөхөөрэй.
            </p>
          </div>
          <button
            onClick={() => onNavigate("ai-tutor")}
            className="shrink-0 self-center rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
          >
            Дагуул нээх
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={TrendingUp}
          tone="navy"
          label="Жигнэсэн дүн"
          value={
            gradeAvg
              ? `${Math.round(gradeAvg.weighted_final ?? gradeAvg.average_percentage)}%`
              : "—"
          }
          hint={`${gradeAvg?.total_grades ?? 0} дүн · жигнэсэн эцсийн`}
        />
        <StatCard
          icon={FileText}
          tone={overdueAssignments.length > 0 ? "rose" : "emerald"}
          label="Хийгдэх даалгавар"
          value={upcomingAssignments.length}
          hint={
            overdueAssignments.length > 0
              ? `${overdueAssignments.length} хугацаа хэтэрсэн`
              : "Бүгд цагтаа"
          }
        />
        <StatCard
          icon={CheckCircle2}
          tone="amber"
          label="Хичээлийн тоо"
          value={gradeAvg?.by_subject.length ?? 0}
          hint={
            lowSubjects.length > 0
              ? `${lowSubjects.length} хичээлд анхаарал хэрэгтэй`
              : "Бүх хичээл тогтвортой"
          }
        />
      </div>

      {/* Миний хичээлүүд (элссэн) */}
      {subjects.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
            <BookMarked className="size-4 text-primary" />
            Миний хичээлүүд
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookMarked className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{s.name}</p>
                  {s.room && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {s.room}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Grade by subject */}
        {gradeAvg && gradeAvg.by_subject.length > 0 && (
          <SectionCard
            icon={TrendingUp}
            title="Хичээл тус бүрийн дүн"
            action={
              studentProfile?.id ? (
                <button
                  onClick={() =>
                    window.open(`/report-card/${studentProfile.id}`, "_blank")
                  }
                  className="flex items-center gap-1 text-xs font-medium text-primary transition hover:underline"
                >
                  <FileText className="size-3.5" />
                  Дүнгийн хуудас
                </button>
              ) : undefined
            }
            bodyClassName="space-y-3.5"
          >
            {gradeAvg.by_subject.map((s) => {
              const c = gradeColor(s.average_percentage);
              return (
                <div key={s.subject}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{s.subject}</span>
                    <span className={`font-bold tabular-nums ${c.text}`}>
                      {Math.round(s.average_percentage)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${c.bar}`}
                      style={{ width: `${Math.min(100, s.average_percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </SectionCard>
        )}

        {/* Upcoming assignments */}
        <SectionCard
          icon={Clock}
          title="Ойрын даалгаврууд"
          action={
            <button
              onClick={() => onNavigate("ai-tutor")}
              className="text-xs font-medium text-primary transition hover:underline"
            >
              Тусламж авах
            </button>
          }
          bodyClassName="space-y-2"
        >
          {upcomingAssignments.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Ойрын даалгавар алга" description="Одоогоор хүлээгдэж буй даалгавар байхгүй байна." />
          ) : (
            upcomingAssignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary/20 hover:bg-muted/40"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <FileText className="size-4 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.subject}</p>
                </div>
                <Pill tone={a.days_until_due <= 2 ? "rose" : "slate"} icon={Clock}>
                  {a.days_until_due} хоног
                </Pill>
              </div>
            ))
          )}
        </SectionCard>
      </div>

      {/* AI feature cards */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
          <Sparkles className="size-4 text-amber" />
          AI Дагуул функцүүд
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              { view: "ai-tutor", icon: BookOpen, title: "Хичээлийн Дагуул", desc: "Алхам алхмаар заалт, дасгал, шалгалт" },
              { view: "wellbeing", icon: Heart, title: "Сэтгэл Зүйч", desc: "Хувийн, нууцлалтай яриа, дэмжлэг" },
              { view: "career", icon: Briefcase, title: "Карьер Зөвлөгөө", desc: "Тохирсон мэргэжил, сургуулийн зам" },
            ] as const
          ).map(({ view, icon: Icon, title, desc }) => (
            <button
              key={view}
              className="group rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber/40 hover:shadow-md"
            >
              <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors group-hover:bg-amber group-hover:text-amber-foreground">
                <Icon className="size-5" />
              </div>
              <h3 className="flex items-center gap-1 text-sm font-semibold text-foreground">
                {title}
                <ArrowRight className="size-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
