"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type User, type ClassRoom, type Student, type AttendanceSummary } from "@/lib/api";
import type { AdminView } from "@/components/dashboard/admin/admin-shell";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Супер Админ",
  admin: "Сургуулийн Админ",
  teacher: "Багш",
  parent: "Эцэг эх",
  student: "Сурагч",
};

const ROLE_COLOR: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  teacher: "bg-[#1B2B4B]/10 text-[#1B2B4B]",
  parent: "bg-green-100 text-green-700",
  student: "bg-amber-100 text-amber-700",
};

interface Props {
  user: User;
  onNavigate: (view: AdminView) => void;
}

export function AdminOverview({ user, onNavigate }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceSummaries, setAttendanceSummaries] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [us, cls, sts] = await Promise.allSettled([
          api.get<User[]>("/users"),
          api.get<ClassRoom[]>("/classes"),
          api.get<Student[]>("/students"),
        ]);
        if (us.status === "fulfilled") setUsers(us.value);
        if (cls.status === "fulfilled") {
          setClasses(cls.value);
          // Get attendance summaries for each class
          const today = new Date();
          const start = new Date(today);
          start.setDate(start.getDate() - 7);
          const startStr = start.toISOString().split("T")[0];
          const endStr = today.toISOString().split("T")[0];

          if (cls.status === "fulfilled") {
            const summaries = await Promise.allSettled(
              cls.value.slice(0, 3).map((c) =>
                api.get<AttendanceSummary>(
                  `/attendance/summary/${c.id}?start_date=${startStr}&end_date=${endStr}`
                )
              )
            );
            setAttendanceSummaries(
              summaries.filter((s) => s.status === "fulfilled").map((s) => (s as PromiseFulfilledResult<AttendanceSummary>).value)
            );
          }
        }
        if (sts.status === "fulfilled") setStudents(sts.value);
      } catch {
        // handled
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

  const teacherCount = users.filter((u) => u.role === "teacher").length;
  const parentCount = users.filter((u) => u.role === "parent").length;
  const studentCount = students.length;
  const avgAttendance =
    attendanceSummaries.length > 0
      ? Math.round(
          attendanceSummaries.reduce((sum, s) => sum + s.attendance_rate, 0) /
            attendanceSummaries.length
        )
      : null;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-20 animate-pulse rounded-xl bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B4B]">
          Өдрийн мэнд, {user.first_name}! 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{dateStr}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Нийт хэрэглэгч</p>
                <p className="mt-1 text-3xl font-bold text-[#1B2B4B]">{users.length}</p>
                <p className="mt-1 text-xs text-gray-500">{teacherCount} багш · {parentCount} эцэг эх</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B2B4B]/10">
                <Users className="h-6 w-6 text-[#1B2B4B]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Нийт сурагч</p>
                <p className="mt-1 text-3xl font-bold text-[#1B2B4B]">{studentCount}</p>
                <p className="mt-1 text-xs text-gray-500">{classes.length} анги</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <GraduationCap className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Идэвхтэй анги</p>
                <p className="mt-1 text-3xl font-bold text-[#1B2B4B]">
                  {classes.filter((c) => c.is_active).length}
                </p>
                <p className="mt-1 text-xs text-gray-500">{classes.length} нийт</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Ирцийн дундаж</p>
                <p className="mt-1 text-3xl font-bold text-[#1B2B4B]">
                  {avgAttendance !== null ? `${avgAttendance}%` : "—"}
                </p>
                <p className="mt-1 text-xs text-gray-500">7 хоногийн дундаж</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent users */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#1B2B4B]">Хэрэглэгчид</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => onNavigate("users")}
              >
                Бүгдийг харах <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.slice(0, 6).map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B2B4B] text-white text-xs font-bold">
                  {u.first_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1B2B4B] truncate">
                    {u.first_name} {u.last_name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <Badge
                  className={`text-xs shrink-0 ${ROLE_COLOR[u.role] ?? "bg-gray-100 text-gray-600"}`}
                  variant="secondary"
                >
                  {ROLE_LABEL[u.role] ?? u.role}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Classes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#1B2B4B]">Ангиуд</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => onNavigate("classes")}
              >
                Бүгдийг харах <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {classes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Анги байхгүй</p>
            ) : (
              classes.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1B2B4B]/10">
                    <BookOpen className="h-4 w-4 text-[#1B2B4B]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#1B2B4B]">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.grade_level}-р анги · {c.academic_year}</p>
                  </div>
                  <Badge
                    className={`text-xs shrink-0 ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    variant="secondary"
                  >
                    {c.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance by class */}
      {attendanceSummaries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#F5A623]" />
              <CardTitle className="text-base text-[#1B2B4B]">
                Ирцийн статистик — 7 хоног
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {attendanceSummaries.map((s) => (
              <div key={s.class_id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-[#1B2B4B]">{s.class_name}</span>
                  <span
                    className={`font-bold ${
                      s.attendance_rate >= 90
                        ? "text-green-600"
                        : s.attendance_rate >= 75
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {s.attendance_rate}%
                  </span>
                </div>
                <Progress value={s.attendance_rate} className="h-2" />
                <p className="text-xs text-gray-400 mt-1">
                  {s.present} ирсэн · {s.absent} тасалсан · {s.late} хоцорсон
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
