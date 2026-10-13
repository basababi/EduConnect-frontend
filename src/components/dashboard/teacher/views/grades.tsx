"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Plus, TrendingUp, Users } from "lucide-react";
import {
  classesApi,
  gradesApi,
  studentsApi,
  studentDisplayName,
  type ClassRoom,
  type Grade,
  type Student,
} from "@/lib/api";
import { groupSubject } from "@/lib/terms";
import { toast } from "sonner";

const GRADE_TYPES = [
  { value: "quiz", label: "Сорил" },
  { value: "homework", label: "Гэрийн даалгавар" },
  { value: "midterm", label: "Явцын шалгалт" },
  { value: "final", label: "Төгсөлтийн шалгалт" },
  { value: "project", label: "Төсөл" },
  { value: "participation", label: "Оролцоо" },
];

/**
 * Үнэлгээ — бүлэг сонгоод сурагчдад оноо тавина.
 * Сургалтын төвд бүлэг = нэг курс тул "хичээл"-ийг тусад нь сонгохгүй:
 * үнэлгээний `subject` нь бүлгийн курсийн нэр (lib/terms.ts → groupSubject).
 */
export function TeacherGrades() {
  const [groups, setGroups] = useState<ClassRoom[]>([]);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [roster, setRoster] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    classesApi
      .list()
      .then((g) => {
        setGroups(g);
        if (g.length > 0) setGroupId(g[0].id);
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  const group = groups.find((g) => g.id === groupId) ?? null;

  const loadGroup = useCallback(() => {
    if (!groupId) return;
    Promise.all([
      gradesApi.byClass(groupId).catch(() => [] as Grade[]),
      studentsApi.list(groupId).catch(() => [] as Student[]),
    ]).then(([g, s]) => {
      setGrades(g);
      setRoster(s);
    });
  }, [groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  // Сурагч бүрийн дундаж
  const chartData = (() => {
    const byStudent = new Map<number, { name: string; total: number; count: number }>();
    for (const g of grades) {
      const entry = byStudent.get(g.student_id) ?? {
        name: g.student ? studentDisplayName(g.student) : `Сурагч ${g.student_id}`,
        total: 0,
        count: 0,
      };
      entry.total += g.percentage;
      entry.count += 1;
      byStudent.set(g.student_id, entry);
    }
    return [...byStudent.values()].map((v) => ({
      name: v.name,
      avg: Math.round(v.total / v.count),
    }));
  })();

  const groupAvg = grades.length
    ? Math.round(grades.reduce((s, g) => s + g.percentage, 0) / grades.length)
    : 0;

  if (loading) return <div className="h-96 animate-pulse rounded-xl bg-muted" />;

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Танд хариуцсан бүлэг алга</p>
          <p className="text-xs text-muted-foreground/70">Төвийн админ танд бүлэг хуваарилна</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Label className="text-xs">Бүлэг</Label>
          <Select value={groupId?.toString()} onValueChange={(v) => setGroupId(parseInt(v))}>
            <SelectTrigger className="mt-1 w-64 max-w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id.toString()}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="amber" disabled={!group || roster.length === 0} onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Үнэлгээ нэмэх
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Бүлгийн дундаж</p>
                <p className="text-2xl font-bold">{groupAvg}%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Нийт үнэлгээ</p>
            <p className="text-2xl font-bold">{grades.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Сурагч</p>
            <p className="text-2xl font-bold">{roster.length}</p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Сурагч бүрийн дундаж</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="avg" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Үнэлгээний жагсаалт</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {grades.map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {g.student ? studentDisplayName(g.student)[0] : "С"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {g.student ? studentDisplayName(g.student) : "—"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {GRADE_TYPES.find((t) => t.value === g.grade_type)?.label ?? g.grade_type}
                    {g.note ? ` · ${g.note}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums">
                    {g.score}/{g.max_score}
                  </p>
                  <Badge
                    className={
                      g.percentage >= 80
                        ? "bg-green-100 text-green-700"
                        : g.percentage >= 60
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                    }
                  >
                    {Math.round(g.percentage)}%
                  </Badge>
                </div>
              </div>
            ))}
            {grades.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {roster.length === 0
                  ? "Энэ бүлэгт сурагч элсээгүй байна"
                  : "Одоогоор үнэлгээ алга"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {group && (
        <AddGradeDialog
          key={`${group.id}-${addOpen}`}
          open={addOpen}
          onOpenChange={setAddOpen}
          group={group}
          roster={roster}
          onSaved={loadGroup}
        />
      )}
    </div>
  );
}

function AddGradeDialog({
  open,
  onOpenChange,
  group,
  roster,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  group: ClassRoom;
  roster: Student[];
  onSaved: () => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [gradeType, setGradeType] = useState("quiz");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const s = parseFloat(score);
    const m = parseFloat(maxScore);
    if (!studentId) {
      toast.error("Сурагчаа сонгоно уу");
      return;
    }
    if (!(m > 0) || !(s >= 0) || s > m) {
      toast.error("Оноо 0-ээс дээд оноо хүртэл байх ёстой");
      return;
    }
    setSubmitting(true);
    try {
      await gradesApi.create({
        student_id: parseInt(studentId),
        class_id: group.id,
        subject: groupSubject(group),
        score: s,
        max_score: m,
        grade_type: gradeType,
        note: note.trim() || undefined,
      });
      toast.success("Үнэлгээ нэмэгдлээ");
      onSaved();
      // Дараагийн сурагчид үргэлжлүүлэн тавихад төрөл, дээд оноог хэвээр үлдээнэ
      setStudentId("");
      setScore("");
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Нэмж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Шинэ үнэлгээ</DialogTitle>
          <DialogDescription>{group.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Сурагч</Label>
            <Select value={studentId} onValueChange={setStudentId} disabled={submitting}>
              <SelectTrigger>
                <SelectValue placeholder="Сурагч сонгох" />
              </SelectTrigger>
              <SelectContent>
                {roster.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {studentDisplayName(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="g-score">Оноо</Label>
              <Input id="g-score" type="number" min={0} step="0.5" value={score} onChange={(e) => setScore(e.target.value)} required disabled={submitting} />
            </div>
            <div>
              <Label htmlFor="g-max">Дээд оноо</Label>
              <Input id="g-max" type="number" min={1} step="0.5" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} required disabled={submitting} />
            </div>
          </div>
          <div>
            <Label>Төрөл</Label>
            <Select value={gradeType} onValueChange={setGradeType} disabled={submitting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="g-note">Тайлбар (заавал биш)</Label>
            <Textarea id="g-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Жишээ нь: 3-р сорил" disabled={submitting} />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={submitting}>
              Хаах
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
