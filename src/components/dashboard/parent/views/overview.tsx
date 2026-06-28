"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  FileText,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  api,
  type User,
  type GradeAverage,
  type AttendanceSummary,
  type Assignment,
  type Conversation,
} from "@/lib/api";
import type { ParentView } from "@/components/dashboard/parent/parent-shell";

interface MyChild {
  student_id: number;
  student: {
    id: number;
    student_code: string | null;
    user: { id: number; first_name: string; last_name: string } | null;
    class: { id: number; name: string } | null;
  } | null;
}

interface Props {
  user: User;
  onNavigate: (view: ParentView) => void;
}

// Бодит дата дээр тулгуурласан эрсдэлийн оноо (хуурамч AI биш)
function computeRisk(att: number, avg: number, low: number, over: number): number {
  let s = 0;
  if (att < 90) s += 15;
  if (att < 80) s += 15;
  if (att < 70) s += 10;
  if (avg < 75) s += 15;
  if (avg < 65) s += 15;
  if (avg < 55) s += 5;
  s += Math.min(20, low * 7);
  s += Math.min(10, over * 5);
  return Math.min(100, s);
}

type RiskLevel = "safe" | "caution" | "alert";
function getRiskLevel(s: number): RiskLevel {
  if (s <= 25) return "safe";
  if (s <= 55) return "caution";
  return "alert";
}

const RISK_META = {
  safe: { label: "Сайн", badge: "bg-green-100 text-green-700", icon: ShieldCheck, ring: "text-emerald-500" },
  caution: { label: "Анхаарах", badge: "bg-amber-100 text-amber-700", icon: AlertTriangle, ring: "text-amber-500" },
  alert: { label: "Яаралтай", badge: "bg-red-100 text-red-700", icon: ShieldAlert, ring: "text-red-500" },
};

export function ParentOverview({ user, onNavigate }: Props) {
  const [child, setChild] = useState<MyChild | null>(null);
  const [gradeAvg, setGradeAvg] = useState<GradeAverage | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const children = await api
          .get<MyChild[]>("/parent-student/my-children")
          .catch(() => [] as MyChild[]);
        const myChild = children[0] ?? null;
        setChild(myChild);

        const studentId = myChild?.student?.id;
        const classId = myChild?.student?.class?.id;

        if (studentId) {
          const [avg, convs, asgn] = await Promise.allSettled([
            api.get<GradeAverage>(`/grades/student/${studentId}/average`),
            api.get<Conversation[]>("/messages/conversations"),
            classId
              ? api.get<Assignment[]>(`/assignments/class/${classId}`)
              : Promise.resolve([] as Assignment[]),
          ]);
          if (avg.status === "fulfilled") setGradeAvg(avg.value);
          if (convs.status === "fulfilled") setConversations(convs.value);
          if (asgn.status === "fulfilled") setAssignments(asgn.value);

          if (classId) {
            const today = new Date();
            const start = new Date(today);
            start.setDate(start.getDate() - 30);
            const sum = await api
              .get<AttendanceSummary>(
                `/attendance/summary/${classId}?start_date=${start.toISOString().split("T")[0]}&end_date=${today.toISOString().split("T")[0]}`,
              )
              .catch(() => null);
            if (sum) setAttendance(sum);
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const today = new Date();
  const dateStr = today.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const studentInfo = child?.student;
  const studentName = studentInfo?.user
    ? `${studentInfo.user.first_name} ${studentInfo.user.last_name}`
    : "Хүүхэд";

  const lowSubjects = gradeAvg?.by_subject.filter((s) => s.average_percentage < 65) ?? [];
  const overdueAssignments = assignments.filter((a) => a.is_overdue);
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unread_count, 0);
  const activeAssignments = assignments.filter((a) => a.status === "active");

  // Зөвхөн БОДИТ дата байгаа үед л үнэлгээ хийнэ (хоосон үед 0% = муу гэж буруу тооцохгүй)
  const hasGrades = (gradeAvg?.total_grades ?? 0) > 0;
  const hasAttendance = (attendance?.total_records ?? 0) > 0;
  const hasData = hasGrades || hasAttendance;
  const avgPct = hasGrades ? gradeAvg!.average_percentage : null;
  const attRate = hasAttendance ? attendance!.attendance_rate : null;

  const riskScore = computeRisk(
    attRate ?? 100,
    avgPct ?? 100,
    lowSubjects.length,
    overdueAssignments.length,
  );
  const riskLevel = getRiskLevel(riskScore);
  const riskMeta = RISK_META[riskLevel];
  const RiskIcon = riskMeta.icon;

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!child || !studentInfo) {
    return (
      <div className="p-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-muted-foreground">
              Хүүхдийн мэдээлэл холбогдоогүй байна
            </p>
            <p className="max-w-xs text-center text-sm text-muted-foreground/70">
              Сургуулийн админтай холбогдож хүүхдийн бүртгэлийг холбуулна уу.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Өдрийн мэнд, {user.first_name}!
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{dateStr}</p>
        </div>
        {studentInfo?.class && (
          <Badge
            variant="outline"
            className="mt-1 shrink-0 border-primary/25 bg-primary/5 text-xs text-primary"
          >
            {studentName} · {studentInfo.class.name}
          </Badge>
        )}
      </div>

      {/* Summary panel (зөвхөн бодит дата дээр) */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-muted ${hasData ? riskMeta.ring : "text-muted-foreground"}`}
              >
                <RiskIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-foreground">Хүүхдийн ерөнхий байдал</h2>
                  {hasData && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskMeta.badge}`}>
                      {riskMeta.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasData ? "Сүүлийн 30 хоногийн дата" : "Дүн/ирц бүртгэгдээгүй байна"}
                </p>
              </div>
            </div>
            <div className="text-right">
              {hasData ? (
                <>
                  <span className={`text-3xl font-black ${riskMeta.ring}`}>{riskScore}</span>
                  <span className="text-xs text-muted-foreground"> / 100 эрсдэл</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Дата хүрэлцэхгүй</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Дундаж дүн"
          value={avgPct != null ? `${Math.round(avgPct)}%` : "—"}
          sub={`${gradeAvg?.total_grades ?? 0} дүн нийт`}
          icon={avgPct != null && avgPct >= 70 ? TrendingUp : TrendingDown}
          iconBg={avgPct != null && avgPct >= 70 ? "bg-primary/10" : "bg-red-100"}
          iconColor={avgPct != null && avgPct >= 70 ? "text-primary" : "text-red-600"}
        />
        <StatCard
          label="Ирцийн хувь"
          value={attRate != null ? `${attRate}%` : "—"}
          sub={attendance ? `${attendance.present} ирсэн · ${attendance.absent} тасалсан` : "Мэдээлэл байхгүй"}
          icon={CheckCircle2}
          iconBg={attRate != null && attRate >= 85 ? "bg-green-100" : "bg-orange-100"}
          iconColor={attRate != null && attRate >= 85 ? "text-green-600" : "text-orange-600"}
        />
        <StatCard
          label="Хийгдэх даалгавар"
          value={String(activeAssignments.length)}
          sub={overdueAssignments.length > 0 ? `${overdueAssignments.length} хугацаа хэтэрсэн` : "Бүгд цагтаа"}
          icon={FileText}
          iconBg={overdueAssignments.length > 0 ? "bg-red-100" : "bg-orange-100"}
          iconColor={overdueAssignments.length > 0 ? "text-red-600" : "text-orange-600"}
        />
        <StatCard
          label="Шинэ мессеж"
          value={String(unreadMessages)}
          sub={`${conversations.length} харилцаа`}
          icon={MessageSquare}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
      </div>

      {/* Grades + Assignments */}
      <div className="grid gap-6 lg:grid-cols-2">
        {gradeAvg && gradeAvg.by_subject.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-primary">
                  {studentName}-ийн хичээлийн дүн
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate("grades")}>
                  Дэлгэрэнгүй <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {gradeAvg.by_subject.map((s) => {
                const pct = Math.round(s.average_percentage);
                const color = pct >= 80 ? "text-green-600" : pct >= 65 ? "text-amber-600" : "text-red-600";
                return (
                  <div key={s.subject}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium text-foreground">{s.subject}</span>
                      <span className={`font-bold ${color}`}>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-primary">Ойрын даалгаврууд</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate("messages")}>
                Багштай яриа <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeAssignments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Даалгавар алга</p>
            ) : (
              activeAssignments.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.is_overdue ? "bg-red-100" : "bg-amber/12"}`}>
                    <FileText className={`h-4 w-4 ${a.is_overdue ? "text-red-600" : "text-amber"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.subject}</p>
                  </div>
                  {a.is_overdue ? (
                    <Badge className="shrink-0 border-0 bg-red-100 text-[10px] text-red-700">
                      Хугацаа дууссан
                    </Badge>
                  ) : (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {a.days_until_due} хоног
                    </span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Detail */}
      {attendance && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-primary">
                Ирцийн байдал — Сүүлийн 30 хоног
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate("attendance")}>
                Дэлгэрэнгүй <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: "Ирсэн", value: attendance.present, bg: "bg-green-50", text: "text-green-700" },
                { label: "Тасалсан", value: attendance.absent, bg: "bg-red-50", text: "text-red-700" },
                { label: "Хоцорсон", value: attendance.late, bg: "bg-orange-50", text: "text-orange-700" },
                { label: "Чөлөөтэй", value: attendance.excused, bg: "bg-blue-50", text: "text-blue-700" },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl px-2 py-3 ${item.bg}`}>
                  <p className={`text-2xl font-bold ${item.text}`}>{item.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="pb-4 pt-5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-2xl font-bold leading-none text-primary">{value}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p>
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
