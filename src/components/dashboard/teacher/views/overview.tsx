"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  CheckCircle2,
  FileText,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import {
  api,
  type User,
  type ClassRoom,
  type Student,
  type Assignment,
  type Conversation,
  type AttendanceSummary,
} from "@/lib/api";

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
          start.setDate(start.getDate() - 7);
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
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  // БОДИТ тооцоолол
  const totalStudents = students.length;
  const attendanceRate = summary?.attendance_rate ?? 0;
  const presentToday = summary?.present ?? 0;
  const absentToday = summary?.absent ?? 0;
  const lateToday = summary?.late ?? 0;

  const activeAssignments = assignments.filter((a) => a.status === "active").length;
  const totalAssignments = assignments.length;
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Өдрийн мэдээ, {user.first_name} {user.last_name} 👋
          </h1>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
        </div>
      </div>

      {/* 4 Stat cards — БОДИТ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">нийт сурагч</p>
                <p className="mt-1 text-3xl font-bold">{totalStudents}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {classes.length} анги
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">ирцтэй ирсэн</p>
                <p className="mt-1 text-3xl font-bold">{attendanceRate}%</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {presentToday} ирсэн - {absentToday} тасалсан - {lateToday} хоцорсон
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">идэвхтэй даалгавар</p>
                <p className="mt-1 text-3xl font-bold">
                  {activeAssignments}
                  <span className="text-lg text-muted-foreground">/{totalAssignments}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {assignments.filter((a) => a.is_overdue).length} хугацаа дууссан
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">шинэ мессеж</p>
                <p className="mt-1 text-3xl font-bold">{unreadMessages}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {conversations.length} харилцаа
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes overview */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Миний ангиуд</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">
              Бүгдийг харах <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {classes.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Анги байхгүй
              </div>
            ) : (
              classes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.grade_level}-р анги • {c.academic_year}
                    </p>
                  </div>
                  {c.teacher && (
                    <Badge variant="outline">
                      {c.teacher.first_name} {c.teacher.last_name}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent assignments — БОДИТ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Сүүлийн даалгаврууд</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">
              Бүгдийг харах &gt;
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {assignments.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Даалгавар алга
            </div>
          ) : (
            assignments.slice(0, 4).map((a) => (
              <div key={a.id} className="flex gap-3 border-b pb-3 last:border-0 last:pb-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {a.days_until_due > 0
                        ? `${a.days_until_due} хоног`
                        : "Дууссан"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {a.subject} • {a.class?.name ?? "—"}
                  </p>
                </div>
                {a.is_overdue ? (
                  <Badge className="bg-red-100 text-red-700">Хугацаа дууссан</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-700">Идэвхтэй</Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Attendance chart — БОДИТ */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Ирцийн статистик — {summary.class_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Circle chart */}
              <div className="flex items-center justify-center">
                <div className="relative h-32 w-32">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-muted"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeDasharray={`${(attendanceRate * 251.2) / 100} 251.2`}
                      className="text-green-500 transition-all"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{attendanceRate}%</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Ирсэн
                  </span>
                  <span className="font-medium">{presentToday}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Тасалсан
                  </span>
                  <span className="font-medium">{absentToday}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    Хоцорсон
                  </span>
                  <span className="font-medium">{lateToday}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Чөлөөтэй
                  </span>
                  <span className="font-medium">{summary.excused}</span>
                </div>
                <div className="mt-3 border-t pt-2 text-xs text-muted-foreground">
                  Нийт бичлэг: {summary.total_records}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}