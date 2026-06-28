"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";
import {
  analyticsApi,
  type SchoolDashboard,
  type AtRiskResult,
} from "@/lib/api";

export function AdminReports() {
  const [dash, setDash] = useState<SchoolDashboard | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.schoolDashboard().catch(() => null),
      analyticsApi.atRisk().catch(() => ({ count: 0, students: [] }) as AtRiskResult),
    ])
      .then(([d, r]) => {
        setDash(d);
        setAtRisk(r);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const highRisk = atRisk?.students.filter((s) => s.risk_level === "high") ?? [];

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Сургуулийн тайлан</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Ерөнхий статистик ба эрсдэлтэй сурагчид
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={GraduationCap}
          label="Нийт сурагч"
          value={dash?.students ?? 0}
          tone="bg-primary/10 text-primary"
        />
        <Stat
          icon={Users}
          label="Багш"
          value={dash?.teachers ?? 0}
          tone="bg-blue-100 text-blue-600"
        />
        <Stat
          icon={BookOpen}
          label="Анги"
          value={dash?.classes ?? 0}
          tone="bg-amber-100 text-amber-600"
        />
        <Stat
          icon={TrendingUp}
          label="Дүнгийн дундаж"
          value={`${dash?.overall_average_grade ?? 0}%`}
          tone="bg-emerald-100 text-emerald-600"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-4 w-4 text-emerald-600" />
              Өнөөдрийн ирц
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dash?.today_attendance_rate != null ? (
              <div className="flex flex-col items-center py-4">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <svg className="h-32 w-32 -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted" />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className="text-emerald-500"
                      strokeDasharray={`${(dash.today_attendance_rate / 100) * 351.8} 351.8`}
                    />
                  </svg>
                  <span className="absolute text-2xl font-bold text-foreground">
                    {dash.today_attendance_rate}%
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Өнөөдрийн дундаж ирц</p>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Өнөөдөр ирц бүртгэгдээгүй
              </p>
            )}
          </CardContent>
        </Card>

        {/* At-risk students */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Эрсдэлтэй сурагчид
              </CardTitle>
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                {atRisk?.count ?? 0} нийт · {highRisk.length} өндөр
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {atRisk && atRisk.students.length > 0 ? (
              <div className="scrollbar-slim max-h-72 space-y-2 overflow-y-auto">
                {atRisk.students.map((s) => (
                  <div
                    key={s.student_id}
                    className="flex items-center gap-3 rounded-lg border p-2.5"
                  >
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${s.risk_level === "high" ? "bg-red-500" : "bg-amber-500"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {s.student_code ?? `Сурагч #${s.student_id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.reasons.join(" · ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-3 text-xs text-muted-foreground">
                      {s.average_grade != null && <span>Дүн: {s.average_grade}%</span>}
                      {s.attendance_rate != null && <span>Ирц: {s.attendance_rate}%</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10">
                <AlertTriangle className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Эрсдэлтэй сурагч алга 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
