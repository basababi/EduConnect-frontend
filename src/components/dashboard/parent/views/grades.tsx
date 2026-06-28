"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, FileText } from "lucide-react";
import { api, type GradeAverage, type Grade } from "@/lib/api";

interface MyChild {
  student_id: number;
  student: { id: number; user: { id: number; first_name: string; last_name: string } | null; class: { id: number; name: string } | null } | null;
}

export function ParentGrades() {
  const [child, setChild] = useState<MyChild | null>(null);
  const [gradeAvg, setGradeAvg] = useState<GradeAverage | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const children = await api.get<MyChild[]>("/parent-student/my-children").catch(() => [] as MyChild[]);
        const myChild = children[0] ?? null;
        setChild(myChild);

        const studentId = myChild?.student?.id;
        if (studentId) {
          const [avg, gradeList] = await Promise.allSettled([
            api.get<GradeAverage>(`/grades/student/${studentId}/average`),
            api.get<Grade[]>(`/grades/student/${studentId}`),
          ]);
          if (avg.status === "fulfilled") setGradeAvg(avg.value);
          if (gradeList.status === "fulfilled") setGrades(gradeList.value);
        }
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const studentName = child?.student?.user
    ? `${child.student.user.first_name} ${child.student.user.last_name}`
    : "Хүүхэд";

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  const gradesBySubject: Record<string, Grade[]> = {};
  grades.forEach((g) => {
    if (!gradesBySubject[g.subject]) gradesBySubject[g.subject] = [];
    gradesBySubject[g.subject].push(g);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B4B]">{studentName} — Дүн</h1>
          {gradeAvg && (
            <p className="text-sm text-gray-500 mt-0.5">
              Жигнэсэн дүн:{" "}
              <strong>{Math.round(gradeAvg.weighted_final ?? gradeAvg.average_percentage)}%</strong>{" "}
              · {gradeAvg.total_grades} дүн
            </p>
          )}
        </div>
        {child?.student?.id && (
          <button
            onClick={() =>
              window.open(`/report-card/${child.student!.id}`, "_blank")
            }
            className="flex items-center gap-2 rounded-lg bg-[#1B2B4B] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1B2B4B]/90"
          >
            <FileText className="h-4 w-4" />
            Дүнгийн хуудас
          </button>
        )}
      </div>

      {/* Summary cards */}
      {gradeAvg && gradeAvg.by_subject.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#1B2B4B]">Хичээл тус бүрийн дундаж</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {gradeAvg.by_subject.map((s) => {
              const pct = Math.round(s.average_percentage);
              const isLow = pct < 60;
              const isHigh = pct >= 80;
              return (
                <div key={s.subject}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#1B2B4B]">{s.subject}</span>
                      <Badge
                        className={`text-xs ${
                          isHigh
                            ? "bg-green-100 text-green-700"
                            : isLow
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                        variant="secondary"
                      >
                        {isHigh ? "Сайн" : isLow ? "Анхаарах" : "Дунд"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isHigh ? (
                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      ) : isLow ? (
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <Minus className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      <span
                        className={`font-bold ${
                          isHigh ? "text-green-600" : isLow ? "text-red-600" : "text-amber-600"
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <Progress value={s.average_percentage} className="h-2.5" />
                  <p className="text-xs text-gray-400 mt-1">{s.count} дүн бүртгэгдсэн</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Grades by subject */}
      {Object.keys(gradesBySubject).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(gradesBySubject).map(([subject, subjectGrades]) => (
            <Card key={subject}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#1B2B4B]">{subject}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subjectGrades.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-700">{g.grade_type}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(g.created_at).toLocaleDateString("mn-MN")}
                          {g.note && ` · ${g.note}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-base font-bold ${
                            g.percentage >= 80
                              ? "text-green-600"
                              : g.percentage >= 60
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {g.score}/{g.max_score}
                        </p>
                        <p className="text-xs text-gray-400">{Math.round(g.percentage)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-gray-400">Дүн бүртгэгдээгүй байна</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
