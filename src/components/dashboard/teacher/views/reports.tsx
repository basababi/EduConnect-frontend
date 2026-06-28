"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  TrendingUp,
  Users,
  CheckCircle2,
  Award,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  classesApi,
  analyticsApi,
  type ClassRoom,
  type ClassPerformance,
  type ClassAttendanceAnalytics,
  type AtRiskResult,
} from "@/lib/api";

const TOOLTIP_STYLE = {
  backgroundColor: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "12px",
};

function scoreColor(p: number) {
  if (p >= 80) return "#10B981";
  if (p >= 60) return "#F5A623";
  return "#EF4444";
}

export function TeacherReports() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [perf, setPerf] = useState<ClassPerformance | null>(null);
  const [att, setAtt] = useState<ClassAttendanceAnalytics | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskResult | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    Promise.all([
      classesApi.list().catch(() => [] as ClassRoom[]),
      analyticsApi.atRisk().catch(() => ({ count: 0, students: [] }) as AtRiskResult),
    ])
      .then(([cls, risk]) => {
        setClasses(cls);
        setAtRisk(risk);
        if (cls.length) setClassId(String(cls[0].id));
      })
      .finally(() => setLoadingClasses(false));
  }, []);

  const loadClassData = useCallback(() => {
    if (!classId) return;
    setLoadingData(true);
    Promise.all([
      analyticsApi.classPerformance(Number(classId)).catch(() => null),
      analyticsApi.classAttendance(Number(classId)).catch(() => null),
    ])
      .then(([p, a]) => {
        setPerf(p);
        setAtt(a);
      })
      .finally(() => setLoadingData(false));
  }, [classId]);

  useEffect(() => {
    loadClassData();
  }, [loadClassData]);

  const classAtRisk =
    atRisk?.students.filter((s) => String(s.class_id) === classId) ?? [];

  if (loadingClasses) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
            <Activity className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Тайлан гаргах анги алга</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Тайлан &amp; Аналитик</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ангийн гүйцэтгэл, ирц, эрсдэлтэй сурагчид
          </p>
        </div>
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* At-risk banner */}
      {classAtRisk.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500">
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-900">
              Энэ ангид {classAtRisk.length} сурагч анхаарал шаардлагатай
            </p>
            <p className="mt-0.5 text-sm text-red-700">
              Дүн эсвэл ирц доогуур байна — AI шинжилгээгээр эрсдэлтэй гэж тэмдэглэв.
            </p>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={TrendingUp}
          label="Ангийн дундаж"
          value={perf ? `${perf.class_average}%` : "—"}
          tone="bg-blue-100 text-blue-600"
          loading={loadingData}
        />
        <Metric
          icon={Users}
          label="Ирц (30 хоног)"
          value={att ? `${att.attendance_rate}%` : "—"}
          tone="bg-emerald-100 text-emerald-600"
          loading={loadingData}
        />
        <Metric
          icon={CheckCircle2}
          label="Сурагчийн тоо"
          value={perf?.student_count ?? "—"}
          tone="bg-primary/10 text-primary"
          loading={loadingData}
        />
        <Metric
          icon={AlertCircle}
          label="Эрсдэлтэй"
          value={classAtRisk.length}
          tone="bg-red-100 text-red-600"
          loading={loadingData}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* By subject */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-emerald-600" />
              Хичээл тус бүрийн дундаж
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <Skeleton className="h-64 w-full" />
            ) : perf && perf.by_subject.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perf.by_subject} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis
                      type="category"
                      dataKey="subject"
                      width={90}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="average" radius={[0, 4, 4, 0]}>
                      {perf.by_subject.map((s, i) => (
                        <Cell key={i} fill={scoreColor(s.average)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart text="Дүнгийн мэдээлэл алга" />
            )}
          </CardContent>
        </Card>

        {/* Attendance breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-blue-600" />
              Ирцийн задаргаа (30 хоног)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <Skeleton className="h-64 w-full" />
            ) : att ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <AttStat label="Ирсэн" value={att.counts.present} cls="text-emerald-600" />
                  <AttStat label="Хоцорсон" value={att.counts.late} cls="text-amber-600" />
                  <AttStat label="Тасалсан" value={att.counts.absent} cls="text-red-600" />
                  <AttStat label="Чөлөөтэй" value={att.counts.excused} cls="text-blue-600" />
                </div>
                {att.chronic_absentees.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-800">
                      Байнга тасалдаг: {att.chronic_absentees.length} сурагч
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyChart text="Ирцийн мэдээлэл алга" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student performance table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Сурагчийн гүйцэтгэл</CardTitle>
            <Badge variant="outline">{perf?.by_student.length ?? 0} сурагч</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <Skeleton className="h-48 w-full" />
          ) : perf && perf.by_student.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-2 font-medium">#</th>
                    <th className="pb-2 pr-2 font-medium">Сурагчийн код</th>
                    <th className="pb-2 pr-2 text-right font-medium">Дундаж дүн</th>
                    <th className="pb-2 pr-2 text-right font-medium">Дүнгийн тоо</th>
                  </tr>
                </thead>
                <tbody>
                  {perf.by_student.map((s, i) => {
                    const risk = classAtRisk.some((r) => r.student_id === s.student_id);
                    return (
                      <tr
                        key={s.student_id}
                        className={`border-b last:border-0 hover:bg-muted/50 ${risk ? "bg-red-50/50" : ""}`}
                      >
                        <td className="py-2.5 pr-2 text-muted-foreground">{i + 1}</td>
                        <td className="py-2.5 pr-2">
                          <span className="flex items-center gap-2 font-medium">
                            {s.student_code ?? `#${s.student_id}`}
                            {risk && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2 text-right font-mono">
                          <span style={{ color: scoreColor(s.average) }} className="font-medium">
                            {s.average}%
                          </span>
                        </td>
                        <td className="py-2.5 pr-2 text-right font-mono text-muted-foreground">
                          {s.grade_count}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyChart text="Сурагчийн мэдээлэл алга" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  tone: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <p className="text-2xl font-bold text-foreground">{value}</p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function AttStat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className={`text-2xl font-bold ${cls}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-2">
      <Activity className="h-8 w-8 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
