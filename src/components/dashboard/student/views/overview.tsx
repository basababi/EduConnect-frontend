"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Heart,
  Briefcase,
  FileText,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { api, type User, type GradeAverage, type Assignment, type Student } from "@/lib/api";
import type { StudentView } from "@/components/dashboard/student/student-shell";
interface Props {
  user: User;
  onNavigate: (view: StudentView) => void;
}

export function StudentOverview({ user, onNavigate }: Props) {
  const [gradeAvg, setGradeAvg] = useState<GradeAverage | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [avg, students] = await Promise.allSettled([
          api.get<GradeAverage>(`/grades/student/${user.id}/average`),
          api.get<Student[]>("/students"),
        ]);

        if (avg.status === "fulfilled") setGradeAvg(avg.value);

        if (students.status === "fulfilled") {
          const mine = students.value.find((s) => s.user_id === user.id);
          if (mine) {
            setStudentProfile(mine);
            if (mine.class_id) {
              const asgn = await api
                .get<Assignment[]>(`/assignments/class/${mine.class_id}`)
                .catch(() => [] as Assignment[]);
              setAssignments(asgn);
            }
          }
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
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const lowSubjects =
    gradeAvg?.by_subject.filter((s) => s.average_percentage < 60) ?? [];
  const upcomingAssignments = assignments
    .filter((a) => a.status === "active" && !a.is_overdue)
    .slice(0, 4);
  const overdueAssignments = assignments.filter((a) => a.is_overdue);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-20 animate-pulse rounded-xl bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B4B]">
          Өдрийн мэнд, {user.first_name}! 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{dateStr}</p>
        {studentProfile?.class && (
          <Badge variant="outline" className="mt-2 text-[#1B2B4B] border-[#1B2B4B]/30">
            {studentProfile.class.name} — {studentProfile.class.grade_level}-р анги
          </Badge>
        )}
      </div>

      {/* Warning: low score subjects */}
      {lowSubjects.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">Анхааруулга</p>
            <p className="text-amber-700 text-sm mt-0.5">
              {lowSubjects.map((s) => (
                <span key={s.subject}>
                  <strong>{s.subject}</strong> ({Math.round(s.average_percentage)}%)
                  {" "}
                </span>
              ))}
              — эдгээр хичээлд хоцорч байна. AI дагуул ашиглаарай.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => onNavigate("ai-tutor")}
            className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
          >
            Дагуул нээх
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Grade average */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Дундаж дүн</p>
                <p className="mt-1 text-3xl font-bold text-[#1B2B4B]">
                  {gradeAvg ? `${Math.round(gradeAvg.average_percentage)}%` : "—"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {gradeAvg?.total_grades ?? 0} дүн бүртгэлтэй
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B2B4B]/10">
                <TrendingUp className="h-6 w-6 text-[#1B2B4B]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming assignments */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Хийгдэх даалгавар</p>
                <p className="mt-1 text-3xl font-bold text-[#1B2B4B]">
                  {upcomingAssignments.length}
                </p>
                <p className="mt-1 text-xs text-red-500 font-medium">
                  {overdueAssignments.length > 0
                    ? `${overdueAssignments.length} хугацаа хэтэрсэн`
                    : "Бүгд цагтаа"}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  overdueAssignments.length > 0 ? "bg-red-100" : "bg-green-100"
                }`}
              >
                <FileText
                  className={`h-6 w-6 ${
                    overdueAssignments.length > 0 ? "text-red-600" : "text-green-600"
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects count */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Хичээлийн тоо</p>
                <p className="mt-1 text-3xl font-bold text-[#1B2B4B]">
                  {gradeAvg?.by_subject.length ?? 0}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {lowSubjects.length > 0
                    ? `${lowSubjects.length} хичээлд анхаарал хэрэгтэй`
                    : "Бүх хичээл сайн"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Grade by subject */}
        {gradeAvg && gradeAvg.by_subject.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[#1B2B4B]">Хичээл тус бүрийн дүн</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gradeAvg.by_subject.map((s) => (
                <div key={s.subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{s.subject}</span>
                    <span
                      className={`font-bold ${
                        s.average_percentage >= 80
                          ? "text-green-600"
                          : s.average_percentage >= 60
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {Math.round(s.average_percentage)}%
                    </span>
                  </div>
                  <Progress
                    value={s.average_percentage}
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Upcoming assignments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#1B2B4B]">Ойрын даалгаврууд</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => onNavigate("ai-tutor")}
              >
                Дагуулаас тусламж авах
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Ойрын даалгавар алга
              </p>
            ) : (
              upcomingAssignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5A623]/15">
                    <FileText className="h-4 w-4 text-[#F5A623]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1B2B4B]">{a.title}</p>
                    <p className="text-xs text-gray-500">{a.subject}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                    <Clock className="h-3 w-3" />
                    {a.days_until_due}х
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Feature cards */}
      <div>
        <h2 className="text-base font-semibold text-[#1B2B4B] mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F5A623]" />
          AI Дагуул функцүүд
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <button
            onClick={() => onNavigate("ai-tutor")}
            className="text-left rounded-xl border-2 border-[#1B2B4B]/10 p-5 hover:border-[#F5A623] hover:shadow-md transition-all group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B2B4B] mb-3 group-hover:bg-[#F5A623] transition-colors">
              <BookOpen className="h-5 w-5 text-white group-hover:text-[#1B2B4B]" />
            </div>
            <h3 className="font-semibold text-[#1B2B4B] text-sm">Хичээлийн Дагуул</h3>
            <p className="text-xs text-gray-500 mt-1">Алхам алхмаар заалт, дасгал, шалгалт</p>
          </button>

          <button
            onClick={() => onNavigate("wellbeing")}
            className="text-left rounded-xl border-2 border-[#1B2B4B]/10 p-5 hover:border-[#F5A623] hover:shadow-md transition-all group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B2B4B] mb-3 group-hover:bg-[#F5A623] transition-colors">
              <Heart className="h-5 w-5 text-white group-hover:text-[#1B2B4B]" />
            </div>
            <h3 className="font-semibold text-[#1B2B4B] text-sm">Сэтгэл Зүйч</h3>
            <p className="text-xs text-gray-500 mt-1">Хувийн, нууцлалтай яриа</p>
          </button>

          <button
            onClick={() => onNavigate("career")}
            className="text-left rounded-xl border-2 border-[#1B2B4B]/10 p-5 hover:border-[#F5A623] hover:shadow-md transition-all group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B2B4B] mb-3 group-hover:bg-[#F5A623] transition-colors">
              <Briefcase className="h-5 w-5 text-white group-hover:text-[#1B2B4B]" />
            </div>
            <h3 className="font-semibold text-[#1B2B4B] text-sm">Карьер Зөвлөгөө</h3>
            <p className="text-xs text-gray-500 mt-1">Тохирсон мэргэжил олох тест</p>
          </button>
        </div>
      </div>
    </div>
  );
}
