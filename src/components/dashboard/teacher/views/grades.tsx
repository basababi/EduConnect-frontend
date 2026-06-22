"use client";

import { useEffect, useState } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, TrendingUp } from "lucide-react";
import { api, type ClassRoom, type Grade } from "@/lib/api";
import { toast } from "sonner";

const SUBJECTS = ["Математик", "Монгол хэл", "Англи хэл", "Байгаль", "Түүх"];
const GRADE_TYPES = [
  { value: "quiz", label: "Шалгалт" },
  { value: "homework", label: "Гэрийн даалгавар" },
  { value: "midterm", label: "Дунд шалгалт" },
  { value: "final", label: "Эцсийн шалгалт" },
  { value: "project", label: "Төсөл" },
  { value: "participation", label: "Оролцоо" },
];

export function TeacherGrades() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("Математик");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  // New grade form
  const [newGrade, setNewGrade] = useState({
    student_id: "",
    score: "",
    max_score: "100",
    grade_type: "quiz",
    note: "",
  });

  useEffect(() => {
    api.get<ClassRoom[]>("/classes").then((cls) => {
      setClasses(cls);
      if (cls.length > 0) setSelectedClass(cls[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedClass) {
      api
        .get<Grade[]>(`/grades/class/${selectedClass}?subject=${selectedSubject}`)
        .then(setGrades)
        .catch(() => setGrades([]));
    }
  }, [selectedClass, selectedSubject]);

  // Chart data: average per student
  const chartData = (() => {
    const byStudent = new Map<number, { name: string; total: number; count: number }>();
    grades.forEach((g) => {
      const key = g.student_id;
      const name = `${g.student?.user?.first_name ?? ""} ${g.student?.user?.last_name ?? ""}`.trim();
      if (!byStudent.has(key)) {
        byStudent.set(key, { name, total: 0, count: 0 });
      }
      const entry = byStudent.get(key)!;
      entry.total += g.percentage;
      entry.count += 1;
    });
    return Array.from(byStudent.entries()).map(([id, v]) => ({
      name: v.name || `Сурагч ${id}`,
      avg: Math.round(v.total / v.count),
    }));
  })();

  const classAvg =
    grades.length > 0
      ? Math.round(grades.reduce((s, g) => s + g.percentage, 0) / grades.length)
      : 0;

  async function handleAddGrade(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClass) return;
    try {
      await api.post("/grades", {
        student_id: parseInt(newGrade.student_id),
        class_id: selectedClass,
        subject: selectedSubject,
        score: parseFloat(newGrade.score),
        max_score: parseFloat(newGrade.max_score),
        grade_type: newGrade.grade_type,
        note: newGrade.note || undefined,
      });
      toast.success("Дүн амжилттай нэмлээ");
      setAddOpen(false);
      setNewGrade({ student_id: "", score: "", max_score: "100", grade_type: "quiz", note: "" });
      // Reload
      const fresh = await api.get<Grade[]>(`/grades/class/${selectedClass}?subject=${selectedSubject}`);
      setGrades(fresh);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Нэмж чадсангүй");
    }
  }

  if (loading) return <div className="h-96 animate-pulse rounded-xl bg-muted" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <div>
            <Label className="text-xs">Анги</Label>
            <Select
              value={selectedClass?.toString()}
              onValueChange={(v) => setSelectedClass(parseInt(v))}
            >
              <SelectTrigger className="mt-1 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Хичээл</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="mt-1 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Дүн нэмэх
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Шинэ дүн оруулах</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddGrade} className="space-y-3">
              <div>
                <Label>Сурагчийн ID</Label>
                <Input
                  type="number"
                  value={newGrade.student_id}
                  onChange={(e) =>
                    setNewGrade({ ...newGrade, student_id: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Оноо</Label>
                  <Input
                    type="number"
                    value={newGrade.score}
                    onChange={(e) =>
                      setNewGrade({ ...newGrade, score: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Макс оноо</Label>
                  <Input
                    type="number"
                    value={newGrade.max_score}
                    onChange={(e) =>
                      setNewGrade({ ...newGrade, max_score: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Төрөл</Label>
                <Select
                  value={newGrade.grade_type}
                  onValueChange={(v) =>
                    setNewGrade({ ...newGrade, grade_type: v })
                  }
                >
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
                <Label>Тайлбар (optional)</Label>
                <Textarea
                  value={newGrade.note}
                  onChange={(e) =>
                    setNewGrade({ ...newGrade, note: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full">
                Хадгалах
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ангийн дундаж</p>
                <p className="text-2xl font-bold">{classAvg}%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Нийт дүн</p>
            <p className="text-2xl font-bold">{grades.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Хичээл</p>
            <p className="text-2xl font-bold">{selectedSubject}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
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
                  <Bar dataKey="avg" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grades table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Дүнгийн жагсаалт</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {grades.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {g.student?.user?.first_name?.[0] ?? "С"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {g.student?.user?.first_name} {g.student?.user?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {g.student?.student_code} •{" "}
                    {GRADE_TYPES.find((t) => t.value === g.grade_type)?.label}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
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
                    {g.percentage}%
                  </Badge>
                </div>
              </div>
            ))}
            {grades.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Одоогоор дүн алга
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}