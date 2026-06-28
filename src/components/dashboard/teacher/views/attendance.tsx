"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, QrCode, Save, CheckCircle2, XCircle, Clock } from "lucide-react";
import { api, studentDisplayName, type ClassRoom, type Student } from "@/lib/api";
import { toast } from "sonner";

const STATUS_CONFIG = {
  present: { label: "Ирсэн", color: "bg-green-500", icon: CheckCircle2 },
  absent: { label: "Тасалсан", color: "bg-red-500", icon: XCircle },
  late: { label: "Хоцорсон", color: "bg-orange-500", icon: Clock },
  excused: { label: "Чөлөөтэй", color: "bg-blue-500", icon: CheckCircle2 },
};

type Status = keyof typeof STATUS_CONFIG;

export function TeacherAttendance() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const [marks, setMarks] = useState<Record<number, Status>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<ClassRoom[]>("/classes").then((cls) => {
      setClasses(cls);
      if (cls.length > 0) {
        setSelectedClass(cls[0].id);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedClass) {
      api
        .get<Student[]>(`/students?class_id=${selectedClass}`)
        .then((s) => {
          setStudents(s);
          const initialMarks: Record<number, Status> = {};
          s.forEach((st) => (initialMarks[st.id] = "present"));
          setMarks(initialMarks);
        })
        .catch(() => setStudents([]));
    }
  }, [selectedClass]);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.student_code?.toLowerCase().includes(q) ||
      studentDisplayName(s).toLowerCase().includes(q)
    );
  });

  const counts = {
    present: Object.values(marks).filter((s) => s === "present").length,
    absent: Object.values(marks).filter((s) => s === "absent").length,
    late: Object.values(marks).filter((s) => s === "late").length,
    excused: Object.values(marks).filter((s) => s === "excused").length,
  };

  async function handleSave() {
    if (!selectedClass) return;
    setSaving(true);
    try {
      const markArray = Object.entries(marks)
        .filter(([_, status]) => status !== "present")
        .map(([studentId, status]) => ({
          student_id: parseInt(studentId),
          status,
        }));

      await api.post("/attendance/mark-class", {
        class_id: selectedClass,
        date,
        marks: markArray,
      });

      toast.success("Ирц амжилттай хадгаллаа!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Хадгалж чадсангүй");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs">Огноо</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-44"
            />
          </div>
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
          <div className="relative">
            <Label className="text-xs">Сурагч хайх</Label>
            <Search className="absolute left-3 top-8 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Нэр, код..."
              className="mt-1 w-56 pl-9"
            />
          </div>
        </div>
        <Button variant="outline" className="self-start">
          <QrCode className="mr-2 h-4 w-4" />
          QR горим
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs text-muted-foreground">Нийт</p>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              {students.length}
            </div>
          </CardContent>
        </Card>
        {(["present", "absent", "late", "excused"] as Status[]).map((status) => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          const pct = students.length > 0 ? Math.round((counts[status] / students.length) * 100) : 0;
          return (
            <Card key={status}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  <p className="text-2xl font-bold">{counts[status]}</p>
                  <p className="text-xs text-muted-foreground">{pct}%</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cfg.color} text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Student list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Сурагчид ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filtered.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {studentDisplayName(student)[0] ?? "С"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {studentDisplayName(student)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {student.student_code}
                  </p>
                </div>
                <div className="flex gap-1">
                  {(Object.keys(STATUS_CONFIG) as Status[]).map((status) => {
                    const cfg = STATUS_CONFIG[status];
                    const Icon = cfg.icon;
                    const isActive = marks[student.id] === status;
                    return (
                      <button
                        key={status}
                        onClick={() =>
                          setMarks({ ...marks, [student.id]: status })
                        }
                        className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                          isActive
                            ? `${cfg.color} text-white`
                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Энэ ангид сурагч алга
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save bar */}
      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-accent hover:bg-accent/90 shadow-lg"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Хадгалж байна..." : "Хадгалах"}
        </Button>
      </div>
    </div>
  );
}