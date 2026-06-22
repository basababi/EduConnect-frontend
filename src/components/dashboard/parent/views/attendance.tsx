"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, type AttendanceSummary, type AttendanceRecord } from "@/lib/api";

interface MyChild {
  student_id: number;
  student: { id: number; user: { id: number; first_name: string; last_name: string } | null; class: { id: number; name: string } | null } | null;
}

const STATUS_LABEL: Record<string, string> = {
  present: "Ирсэн",
  absent: "Тасалсан",
  late: "Хоцорсон",
  excused: "Чөлөөтэй",
};

const STATUS_COLOR: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-orange-100 text-orange-700",
  excused: "bg-blue-100 text-blue-700",
};

export function ParentAttendance() {
  const [child, setChild] = useState<MyChild | null>(null);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const children = await api.get<MyChild[]>("/parent-student/my-children").catch(() => [] as MyChild[]);
        const myChild = children[0] ?? null;
        setChild(myChild);

        const classId = myChild?.student?.class?.id;
        const studentId = myChild?.student?.id;

        if (classId && studentId) {
          const today = new Date();
          const start = new Date(today);
          start.setDate(start.getDate() - 30);
          const startStr = start.toISOString().split("T")[0];
          const endStr = today.toISOString().split("T")[0];

          const [sum, recs] = await Promise.allSettled([
            api.get<AttendanceSummary>(
              `/attendance/summary/${classId}?start_date=${startStr}&end_date=${endStr}`
            ),
            api.get<AttendanceRecord[]>(
              `/attendance/student/${studentId}?start_date=${startStr}&end_date=${endStr}`
            ),
          ]);
          if (sum.status === "fulfilled") setSummary(sum.value);
          if (recs.status === "fulfilled") setRecords(recs.value);
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
        <div className="h-32 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B4B]">{studentName} — Ирц</h1>
        <p className="text-sm text-gray-500 mt-0.5">Сүүлийн 30 хоногийн ирцийн бүртгэл</p>
      </div>

      {/* Summary */}
      {summary ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Ирцийн хувь", value: `${summary.attendance_rate}%`, color: "text-[#1B2B4B] bg-[#1B2B4B]/5" },
            { label: "Ирсэн", value: summary.present, color: "text-green-600 bg-green-50" },
            { label: "Тасалсан", value: summary.absent, color: "text-red-600 bg-red-50" },
            { label: "Хоцорсон", value: summary.late, color: "text-orange-600 bg-orange-50" },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className={`pt-5 pb-5 text-center rounded-xl ${item.color.split(" ")[1]}`}>
                <p className={`text-3xl font-bold ${item.color.split(" ")[0]}`}>{item.value}</p>
                <p className="text-xs text-gray-500 mt-1">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-400">Ирцийн мэдээлэл байхгүй байна</p>
          </CardContent>
        </Card>
      )}

      {/* Attendance records */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#1B2B4B]">Ирцийн бүртгэл</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Бүртгэл байхгүй</p>
          ) : (
            <div className="space-y-2">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2.5 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1B2B4B]">
                      {new Date(r.date).toLocaleDateString("mn-MN", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </p>
                    {r.subject && (
                      <p className="text-xs text-gray-500">{r.subject}{r.period ? ` · ${r.period}-р цаг` : ""}</p>
                    )}
                    {r.note && <p className="text-xs text-gray-400 mt-0.5">{r.note}</p>}
                  </div>
                  <Badge
                    className={`${STATUS_COLOR[r.status] ?? "bg-gray-100 text-gray-600"} text-xs`}
                    variant="secondary"
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
