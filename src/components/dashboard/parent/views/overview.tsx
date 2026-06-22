"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, CheckCircle2, TrendingUp, TrendingDown, MessageSquare, FileText,
  AlertTriangle, ArrowRight, Sparkles, ShieldAlert, ShieldCheck,
  Activity, RefreshCw, Brain, Heart, Compass, Star, Zap,
} from "lucide-react";
import {
  api, type User, type GradeAverage, type AttendanceSummary,
  type Assignment, type Conversation,
} from "@/lib/api";
import {
  generateParentInsight, analyzeChildPsychology, analyzeChildCareerDirection,
} from "@/lib/mock-assistant";
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

// ── Эрсдэлийн оноо ──
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
  safe: { label: "Сайн", bg: "from-emerald-600 to-green-700", badge: "bg-green-100 text-green-700", icon: ShieldCheck, ring: "border-green-400", text: "text-green-400" },
  caution: { label: "Анхааруулга", bg: "from-amber-600 to-orange-700", badge: "bg-amber-100 text-amber-700", icon: AlertTriangle, ring: "border-amber-400", text: "text-amber-300" },
  alert: { label: "Яаралтай", bg: "from-red-700 to-rose-800", badge: "bg-red-100 text-red-700", icon: ShieldAlert, ring: "border-red-400", text: "text-red-300" },
};

// ── Mood colors ──
const MOOD_META = {
  "Эрч хүчтэй": { color: "text-green-600", bg: "bg-green-50", icon: Zap },
  "Хэвийн": { color: "text-blue-600", bg: "bg-blue-50", icon: Activity },
  "Түгшсэн": { color: "text-amber-600", bg: "bg-amber-50", icon: AlertTriangle },
  "Гутарсан": { color: "text-red-600", bg: "bg-red-50", icon: Heart },
};

export function ParentOverview({ user, onNavigate }: Props) {
  const [child, setChild] = useState<MyChild | null>(null);
  const [gradeAvg, setGradeAvg] = useState<GradeAverage | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const children = await api.get<MyChild[]>("/parent-student/my-children").catch(() => [] as MyChild[]);
        const myChild = children[0] ?? null;
        setChild(myChild);

        const studentId = myChild?.student?.id;
        const classId = myChild?.student?.class?.id;

        if (studentId) {
          const [avg, convs, asgn] = await Promise.allSettled([
            api.get<GradeAverage>(`/grades/student/${studentId}/average`),
            api.get<Conversation[]>("/messages/conversations"),
            classId ? api.get<Assignment[]>(`/assignments/class/${classId}`) : Promise.resolve([] as Assignment[]),
          ]);
          if (avg.status === "fulfilled") setGradeAvg(avg.value);
          if (convs.status === "fulfilled") setConversations(convs.value);
          if (asgn.status === "fulfilled") setAssignments(asgn.value);

          if (classId) {
            const today = new Date();
            const start = new Date(today);
            start.setDate(start.getDate() - 30);
            const sum = await api.get<AttendanceSummary>(
              `/attendance/summary/${classId}?start_date=${start.toISOString().split("T")[0]}&end_date=${today.toISOString().split("T")[0]}`,
            ).catch(() => null);
            if (sum) setAttendance(sum);
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Generate AI insight when data is ready
  useEffect(() => {
    if (!loading && child) {
      setInsightLoading(true);
      const avgPct = gradeAvg?.average_percentage ?? 100;
      const attRate = attendance?.attendance_rate ?? 100;
      const lowSubs = gradeAvg?.by_subject.filter(s => s.average_percentage < 65) ?? [];
      const overdue = assignments.filter(a => a.is_overdue).length;
      const risk = computeRisk(attRate, avgPct, lowSubs.length, overdue);
      const level = getRiskLevel(risk);

      setTimeout(() => {
        const text = generateParentInsight({
          studentName: child.student?.user ? `${child.student.user.first_name}` : "Хүүхэд",
          avgGrade: avgPct === 100 ? null : avgPct,
          attendanceRate: attRate === 100 ? null : attRate,
          absentCount: attendance?.absent ?? 0,
          lateCount: attendance?.late ?? 0,
          lowSubjects: lowSubs,
          overdueCount: overdue,
          riskScore: risk,
          riskLevel: level,
        });
        setInsight(text);
        setInsightLoading(false);
      }, 800);
    }
  }, [loading, child, gradeAvg, attendance, assignments]);

  const today = new Date();
  const dateStr = today.toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  const studentInfo = child?.student;
  const studentName = studentInfo?.user ? `${studentInfo.user.first_name} ${studentInfo.user.last_name}` : "Хүүхэд";

  const lowSubjects = gradeAvg?.by_subject.filter(s => s.average_percentage < 65) ?? [];
  const overdueAssignments = assignments.filter(a => a.is_overdue);
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unread_count, 0);
  const activeAssignments = assignments.filter(a => a.status === "active");

  const avgPct = gradeAvg?.average_percentage ?? null;
  const attRate = attendance?.attendance_rate ?? null;

  const riskScore = computeRisk(attRate ?? 100, avgPct ?? 100, lowSubjects.length, overdueAssignments.length);
  const riskLevel = getRiskLevel(riskScore);
  const riskMeta = RISK_META[riskLevel];
  const RiskIcon = riskMeta.icon;

  // Psychology analysis
  const psych = analyzeChildPsychology({
    avgGrade: avgPct,
    attendanceRate: attRate,
    trend: avgPct && avgPct > 75 ? "up" : avgPct && avgPct < 60 ? "down" : "stable",
    overdueCount: overdueAssignments.length,
    messageActivity: conversations.length,
  });
  const moodMeta = MOOD_META[psych.mood];
  const MoodIcon = moodMeta.icon;

  // Career direction
  const career = analyzeChildCareerDirection({
    grades: gradeAvg?.by_subject.map(s => ({ subject: s.subject, average_percentage: s.average_percentage })) ?? [],
  });

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-52 animate-pulse rounded-2xl bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />)}
        </div>
      </div>
    );
  }

  if (!child || !studentInfo) {
    return (
      <div className="p-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100">
              <Users className="h-7 w-7 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-600">Хүүхдийн мэдээлэл холбогдоогүй байна</p>
            <p className="text-sm text-gray-400 text-center max-w-xs">Сургуулийн админтай холбогдож хүүхдийн бүртгэлийг холбуулна уу.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B4B]">Өдрийн мэнд, {user.first_name}!</h1>
          <p className="text-sm text-gray-400 mt-0.5">{dateStr}</p>
        </div>
        {studentInfo?.class && (
          <Badge variant="outline" className="shrink-0 mt-1 text-[#1B2B4B] border-[#1B2B4B]/25 bg-[#1B2B4B]/5 text-xs">
            {studentName} · {studentInfo.class.name}
          </Badge>
        )}
      </div>

      {/* === AI Risk Panel === */}
      <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${riskMeta.bg} shadow-xl`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-bold text-base">AI Эрт Анхааруулга</h2>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${riskMeta.badge}`}>{riskMeta.label}</span>
                </div>
                <p className="text-white/60 text-xs mt-0.5">Сүүлийн 30 хоногийн дата дээр үндэслэв</p>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center">
              <div className={`w-14 h-14 rounded-2xl border-2 ${riskMeta.ring} bg-white/10 flex flex-col items-center justify-center`}>
                <span className={`text-xl font-black ${riskMeta.text}`}>{riskScore}</span>
                <span className="text-white/40 text-[9px] leading-none">/ 100</span>
              </div>
              <span className="text-white/50 text-[10px] mt-1">эрсдэл</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-h-[80px] mb-5">
            {insightLoading ? (
              <div className="flex items-center gap-2 text-white/50">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-sm">AI шинжилгээ хийж байна...</span>
              </div>
            ) : (
              <p className="text-white/90 text-sm leading-relaxed">{insight}</p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Дундаж дүн", value: avgPct != null ? `${Math.round(avgPct)}%` : "—", warn: (avgPct ?? 100) < 70 },
              { label: "Ирц", value: attRate != null ? `${attRate}%` : "—", warn: (attRate ?? 100) < 85 },
              { label: "Тасалсан", value: `${attendance?.absent ?? 0} удаа`, warn: (attendance?.absent ?? 0) > 3 },
              { label: "Хоцорсон хичээл", value: `${lowSubjects.length} хичээл`, warn: lowSubjects.length > 0 },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                <p className={`text-base font-bold ${item.warn ? "text-[#F5A623]" : "text-white"}`}>{item.value}</p>
                <p className="text-white/50 text-[10px] mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === Psychology + Career Direction (NEW) === */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Psychology Panel */}
        <Card className="border-purple-100 bg-gradient-to-br from-purple-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Brain className="w-4 h-4 text-purple-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-[#1B2B4B]">
                {studentName}-ийн сэтгэл зүйн байдал
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mood Score */}
            <div className={`rounded-xl p-4 ${moodMeta.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MoodIcon className={`w-5 h-5 ${moodMeta.color}`} />
                  <span className={`font-semibold ${moodMeta.color}`}>{psych.mood}</span>
                </div>
                <span className={`text-2xl font-bold ${moodMeta.color}`}>{psych.moodScore}%</span>
              </div>
              <Progress value={psych.moodScore} className={`h-2 [&>div]:${moodMeta.color.replace('text-', 'bg-')}`} />
            </div>

            {/* Factors */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Хүчин зүйлс:</p>
              <ul className="space-y-1.5">
                {psych.factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendation */}
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <p className="text-xs text-purple-900 leading-relaxed">
                <strong>AI зөвлөгөө:</strong> {psych.recommendation}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Career Direction Panel */}
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Compass className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-[#1B2B4B]">
                Карьерийн чиг хандлага
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Direction */}
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1">Таних чиглэл:</p>
              <p className="text-sm font-bold text-blue-900">{career.direction}</p>
            </div>

            {/* Strengths */}
            {career.strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Давуу талууд:</p>
                <div className="flex flex-wrap gap-2">
                  {career.strengths.map(s => (
                    <Badge key={s} className="bg-green-100 text-green-700 border-0">
                      <Star className="w-3 h-3 mr-1" />{s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Potential Careers */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Боломжит мэргэжлүүд:</p>
              <div className="flex flex-wrap gap-2">
                {career.potentialCareers.map(c => (
                  <Badge key={c} variant="outline" className="border-blue-200 text-blue-700">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Advice */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-blue-900 leading-relaxed">
                <strong>AI зөвлөгөө:</strong> {career.advice}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === Stats Grid === */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Дундаж дүн" value={avgPct != null ? `${Math.round(avgPct)}%` : "—"} sub={`${gradeAvg?.total_grades ?? 0} дүн нийт`} icon={avgPct != null && avgPct >= 70 ? TrendingUp : TrendingDown} iconBg={avgPct != null && avgPct >= 70 ? "bg-[#1B2B4B]/10" : "bg-red-100"} iconColor={avgPct != null && avgPct >= 70 ? "text-[#1B2B4B]" : "text-red-600"} />
        <StatCard label="Ирцийн хувь" value={attRate != null ? `${attRate}%` : "—"} sub={attendance ? `${attendance.present} ирсэн · ${attendance.absent} тасалсан` : "Мэдээлэл байхгүй"} icon={CheckCircle2} iconBg={attRate != null && attRate >= 85 ? "bg-green-100" : "bg-orange-100"} iconColor={attRate != null && attRate >= 85 ? "text-green-600" : "text-orange-600"} />
        <StatCard label="Хийгдэх даалгавар" value={String(activeAssignments.length)} sub={overdueAssignments.length > 0 ? `${overdueAssignments.length} хугацаа хэтэрсэн` : "Бүгд цагтаа"} icon={FileText} iconBg={overdueAssignments.length > 0 ? "bg-red-100" : "bg-orange-100"} iconColor={overdueAssignments.length > 0 ? "text-red-600" : "text-orange-600"} />
        <StatCard label="Шинэ мессеж" value={String(unreadMessages)} sub={`${conversations.length} харилцаа`} icon={MessageSquare} iconBg="bg-blue-100" iconColor="text-blue-600" />
      </div>

      {/* === Grades + Assignments === */}
      <div className="grid gap-6 lg:grid-cols-2">
        {gradeAvg && gradeAvg.by_subject.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[#1B2B4B]">{studentName}-ийн хичээлийн дүн</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate("grades")}>Дэлгэрэнгүй <ArrowRight className="ml-1 h-3 w-3" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {gradeAvg.by_subject.map((s) => {
                const pct = Math.round(s.average_percentage);
                const color = pct >= 80 ? "text-green-600" : pct >= 65 ? "text-amber-600" : "text-red-600";
                return (
                  <div key={s.subject}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-700 font-medium">{s.subject}</span>
                      <span className={`font-bold ${color}`}>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#1B2B4B]">Ойрын даалгаврууд</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate("messages")}>Багштай яриа <ArrowRight className="ml-1 h-3 w-3" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeAssignments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Даалгавар алга</p>
            ) : (
              activeAssignments.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-gray-50">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.is_overdue ? "bg-red-100" : "bg-[#F5A623]/12"}`}>
                    <FileText className={`h-4 w-4 ${a.is_overdue ? "text-red-600" : "text-[#F5A623]"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1B2B4B]">{a.title}</p>
                    <p className="text-xs text-gray-400">{a.subject}</p>
                  </div>
                  {a.is_overdue ? <Badge className="bg-red-100 text-red-700 text-[10px] border-0 shrink-0">Хугацаа дууссан</Badge> : <span className="text-xs text-gray-400 shrink-0">{a.days_until_due}х</span>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* === Attendance Detail === */}
      {attendance && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#1B2B4B]">Ирцийн байдал — Сүүлийн 30 хоног</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate("attendance")}>Дэлгэрэнгүй <ArrowRight className="ml-1 h-3 w-3" /></Button>
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
                <div key={item.label} className={`rounded-xl py-3 px-2 ${item.bg}`}>
                  <p className={`text-2xl font-bold ${item.text}`}>{item.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor }: {
  label: string; value: string; sub: string; icon: React.ElementType; iconBg: string; iconColor: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="mt-0.5 text-2xl font-bold text-[#1B2B4B] leading-none">{value}</p>
            <p className="mt-1 text-xs text-gray-400 truncate">{sub}</p>
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}