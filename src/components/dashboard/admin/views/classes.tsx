"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  BookOpen,
  Users,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  GraduationCap,
  FileSpreadsheet,
} from "lucide-react";
import { ImportStudentsDialog } from "@/components/dashboard/admin/import-students-dialog";
import { toast } from "sonner";
import {
  classesApi,
  studentsApi,
  usersApi,
  studentDisplayName,
  type ClassRoom,
  type Student,
  type User,
  type CreateClassDto,
} from "@/lib/api";

export function AdminClasses() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRoom | null>(null);
  const [detail, setDetail] = useState<ClassRoom | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      classesApi.list().catch(() => [] as ClassRoom[]),
      studentsApi.list().catch(() => [] as Student[]),
      usersApi.list("teacher").catch(() => [] as User[]),
    ])
      .then(([cls, sts, tch]) => {
        setClasses(cls);
        setStudents(sts);
        setTeachers(tch);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = classes.filter(
    (c) =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.grade_level.toLowerCase().includes(search.toLowerCase()),
  );

  const studentCount = (classId: number) =>
    students.filter((s) => s.class_id === classId).length;

  async function handleDelete(c: ClassRoom) {
    if (!confirm(`"${c.name}" ангийг устгах уу?`)) return;
    try {
      await classesApi.remove(c.id);
      toast.success("Анги устгагдлаа");
      setClasses((prev) => prev.filter((x) => x.id !== c.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Устгаж чадсангүй");
    }
  }

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Ангиуд</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Нийт {classes.length} анги · {classes.filter((c) => c.is_active).length} идэвхтэй
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel импорт
          </Button>
          <Button
            variant="amber"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Анги нэмэх
          </Button>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Анги хайх..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-14">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Анги олдсонгүй</p>
            <p className="text-xs text-muted-foreground/70">
              Эхний ангиа &quot;Анги нэмэх&quot; товчоор үүсгээрэй
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card
              key={c.id}
              className="group cursor-pointer transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20"
              onClick={() => setDetail(c)}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(c);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.grade_level}-р анги · {c.academic_year}
                  </p>
                  {c.teacher && (
                    <p className="mt-0.5 text-xs text-muted-foreground/80">
                      Багш: {c.teacher.first_name} {c.teacher.last_name}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {studentCount(c.id)} сурагч
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${c.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}
                  >
                    {c.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClassDialog
        key={`${editing?.id ?? "new"}-${formOpen}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        teachers={teachers}
        onSaved={load}
      />

      <ClassDetailSheet
        cls={detail}
        onOpenChange={(v) => !v && setDetail(null)}
        onStudentsChanged={load}
      />

      <ImportStudentsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        classes={classes}
        onImported={load}
      />
    </div>
  );
}

// ── Анги үүсгэх/засах диалог ──
function ClassDialog({
  open,
  onOpenChange,
  editing,
  teachers,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: ClassRoom | null;
  teachers: User[];
  onSaved: () => void;
}) {
  // key-remount-аар нээх бүрт props-оос шинээр эхлүүлнэ (effect-гүй)
  const [name, setName] = useState(editing?.name ?? "");
  const [gradeLevel, setGradeLevel] = useState(editing?.grade_level ?? "");
  const [year, setYear] = useState(
    String(editing?.academic_year ?? new Date().getFullYear()),
  );
  const [teacherId, setTeacherId] = useState<string>(
    editing?.teacher_id ? String(editing.teacher_id) : "",
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const dto: CreateClassDto = {
      name: name.trim(),
      grade_level: gradeLevel.trim(),
      academic_year: Number(year),
      teacher_id: teacherId ? Number(teacherId) : undefined,
    };
    try {
      if (editing) {
        await classesApi.update(editing.id, dto);
        toast.success("Анги шинэчлэгдлээ");
      } else {
        await classesApi.create(dto);
        toast.success("Анги үүслээ");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Хадгалж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Анги засах" : "Шинэ анги"}</DialogTitle>
          <DialogDescription>Ангийн мэдээллийг бөглөнө үү.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cls-name">Ангийн нэр</Label>
            <Input
              id="cls-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="9А"
              required
              disabled={submitting}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cls-grade">Түвшин</Label>
              <Input
                id="cls-grade"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="9"
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cls-year">Хичээлийн жил</Label>
              <Input
                id="cls-year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Анги даасан багш (заавал биш)</Label>
            <Select value={teacherId} onValueChange={setTeacherId} disabled={submitting}>
              <SelectTrigger>
                <SelectValue placeholder="Багш сонгох" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.first_name} {t.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Болих
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Хадгалж байна..." : editing ? "Хадгалах" : "Үүсгэх"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Ангийн дэлгэрэнгүй + сурагч удирдах (Sheet) ──
function ClassDetailSheet({
  cls,
  onOpenChange,
  onStudentsChanged,
}: {
  cls: ClassRoom | null;
  onOpenChange: (v: boolean) => void;
  onStudentsChanged: () => void;
}) {
  return (
    <Sheet open={!!cls} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        {cls && (
          <ClassDetailContent
            key={cls.id}
            cls={cls}
            onStudentsChanged={onStudentsChanged}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ClassDetailContent({
  cls,
  onStudentsChanged,
}: {
  cls: ClassRoom;
  onStudentsChanged: () => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  // setState зөвхөн async callback дотор — эффект дотор синхрон setState байхгүй
  const reload = useCallback(() => {
    studentsApi
      .list(cls.id)
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [cls.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function removeStudent(s: Student) {
    if (!confirm("Энэ сурагчийг устгах уу?")) return;
    try {
      await studentsApi.remove(s.id);
      toast.success("Сурагч устгагдлаа");
      setStudents((prev) => prev.filter((x) => x.id !== s.id));
      onStudentsChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Устгаж чадсангүй");
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {cls.name}
        </SheetTitle>
        <SheetDescription>
          {cls.grade_level}-р анги · {cls.academic_year} · {students.length} сурагч
        </SheetDescription>
      </SheetHeader>

      <div className="flex items-center justify-between px-4">
        <p className="text-sm font-medium text-foreground">Сурагчид</p>
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-3.5 w-3.5" />
          Нэмэх
        </Button>
      </div>

      <div className="scrollbar-slim flex-1 space-y-1.5 overflow-y-auto px-4 pb-4">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <GraduationCap className="h-9 w-9 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Сурагч бүртгэгдээгүй</p>
          </div>
        ) : (
          students.map((s) => (
            <div
              key={s.id}
              className="group flex items-center gap-3 rounded-lg border p-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                {s.user?.first_name?.[0] ?? s.first_name?.[0] ?? s.student_code?.[0] ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {studentDisplayName(s)}
                </p>
                <p className="text-xs text-muted-foreground">{s.student_code ?? "—"}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removeStudent(s)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      <StudentDialog
        key={`add-${addOpen}`}
        open={addOpen}
        onOpenChange={setAddOpen}
        classId={cls.id}
        onSaved={() => {
          reload();
          onStudentsChanged();
        }}
      />
    </>
  );
}

// ── Сурагч нэмэх диалог ──
function StudentDialog({
  open,
  onOpenChange,
  classId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classId: number;
  onSaved: () => void;
}) {
  const [code, setCode] = useState("");
  const [dob, setDob] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await studentsApi.create({
        class_id: classId,
        student_code: code.trim() || undefined,
        date_of_birth: dob || undefined,
      });
      toast.success("Сурагч нэмэгдлээ");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Нэмж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Сурагч нэмэх</DialogTitle>
          <DialogDescription>
            Сурагчийн бүртгэл үүснэ. Нэвтрэх дансыг дараа урилгаар холбож болно.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="st-code">Сурагчийн код (заавал биш)</Label>
            <Input
              id="st-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ST-0001"
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Том үсэг, тоо, зураас (4-20 тэмдэгт)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-dob">Төрсөн огноо (заавал биш)</Label>
            <Input
              id="st-dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              disabled={submitting}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Болих
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Нэмж байна..." : "Нэмэх"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
