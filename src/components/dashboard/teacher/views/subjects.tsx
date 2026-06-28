"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  BookMarked,
  Plus,
  Users,
  Trash2,
  UserPlus,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import {
  subjectsApi,
  classesApi,
  studentsApi,
  studentDisplayName,
  type Subject,
  type ClassRoom,
  type Student,
  type EnrolledStudent,
} from "@/lib/api";

export function TeacherSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [manage, setManage] = useState<Subject | null>(null);

  const load = useCallback(() => {
    Promise.all([
      subjectsApi.mine().catch(() => [] as Subject[]),
      classesApi.list().catch(() => [] as ClassRoom[]),
    ])
      .then(([subs, cls]) => {
        setSubjects(subs);
        setClasses(cls);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const className = (id: number) => classes.find((c) => c.id === id)?.name ?? "—";

  async function remove(s: Subject) {
    if (!confirm(`"${s.name}" хичээлийг устгах уу?`)) return;
    try {
      await subjectsApi.remove(s.id);
      toast.success("Хичээл устгагдлаа");
      setSubjects((prev) => prev.filter((x) => x.id !== s.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Устгаж чадсангүй");
    }
  }

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Миний хичээлүүд</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Хичээл үүсгээд дүн, материал, даалгавараа дээр нь зохион байгуул
          </p>
        </div>
        <Button
          variant="amber"
          className="gap-2"
          onClick={() => setCreateOpen(true)}
          disabled={classes.length === 0}
        >
          <Plus className="h-4 w-4" />
          Хичээл үүсгэх
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyCard text="Танд хариуцсан анги алга — админ анги хуваарилна" />
      ) : subjects.length === 0 ? (
        <EmptyCard text="Эхний хичээлээ үүсгээрэй" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <Card
              key={s.id}
              className="group cursor-pointer transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20"
              onClick={() => setManage(s)}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <BookMarked className="h-5 w-5 text-primary" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(s);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{className(s.class_id)}</p>
                  {s.room && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground/80">
                      <MapPin className="h-3 w-3" />
                      {s.room}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="gap-1 bg-muted text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {s.student_count ?? 0} сурагч
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        classes={classes}
        onSaved={load}
      />

      <ManageSheet subject={manage} onOpenChange={(v) => !v && setManage(null)} onChanged={load} />
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
        <BookMarked className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  classes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes: ClassRoom[];
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [room, setRoom] = useState("");
  const [kind, setKind] = useState<"required" | "elective">("required");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setClassId(classes[0] ? String(classes[0].id) : "");
      setRoom("");
      setKind("required");
    }
  }, [open, classes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!classId) return;
    setSubmitting(true);
    try {
      await subjectsApi.create({
        class_id: Number(classId),
        name: name.trim(),
        room: room.trim() || undefined,
        auto_enroll: kind === "required",
      });
      toast.success(
        kind === "required"
          ? "Хичээл үүсч, ангийн сурагчид автоматаар элслээ"
          : "Сонгон хичээл үүслээ — сурагчдыг гараар элсүүлнэ",
      );
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Үүсгэж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Шинэ хичээл</DialogTitle>
          <DialogDescription>
            Хичээлээ үүсгээд дүн, материал, даалгавараа дээр нь нэмнэ.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sub-name">Хичээлийн нэр</Label>
            <Input
              id="sub-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Математик"
              required
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label>Анги</Label>
            <Select value={classId} onValueChange={setClassId} disabled={submitting}>
              <SelectTrigger>
                <SelectValue placeholder="Анги сонгох" />
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
          <div className="space-y-2">
            <Label htmlFor="sub-room">Өрөө (заавал биш)</Label>
            <Input
              id="sub-room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="201"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label>Төрөл</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKind("required")}
                className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                  kind === "required"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <p className="font-medium text-foreground">Заавал</p>
                <p className="text-xs text-muted-foreground">Бүх сурагч автомат элснэ</p>
              </button>
              <button
                type="button"
                onClick={() => setKind("elective")}
                className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                  kind === "elective"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <p className="font-medium text-foreground">Сонгон</p>
                <p className="text-xs text-muted-foreground">Сурагчдыг гараар элсүүлнэ</p>
              </button>
            </div>
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
              {submitting ? "Үүсгэж байна..." : "Үүсгэх"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManageSheet({
  subject,
  onOpenChange,
  onChanged,
}: {
  subject: Subject | null;
  onOpenChange: (v: boolean) => void;
  onChanged: () => void;
}) {
  return (
    <Sheet open={!!subject} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        {subject && (
          <ManageContent key={subject.id} subject={subject} onChanged={onChanged} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ManageContent({
  subject,
  onChanged,
}: {
  subject: Subject;
  onChanged: () => void;
}) {
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    Promise.all([
      subjectsApi.students(subject.id).catch(() => [] as EnrolledStudent[]),
      studentsApi.list(subject.class_id).catch(() => [] as Student[]),
    ])
      .then(([en, cls]) => {
        setEnrolled(en);
        setClassStudents(cls);
      })
      .finally(() => setLoading(false));
  }, [subject.id, subject.class_id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const enrolledIds = new Set(enrolled.map((e) => e.id));
  const notEnrolled = classStudents.filter((s) => !enrolledIds.has(s.id));

  async function add(studentId: number) {
    try {
      await subjectsApi.enroll(subject.id, studentId);
      reload();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Элсүүлж чадсангүй");
    }
  }

  async function removeOne(studentId: number) {
    try {
      await subjectsApi.unenroll(subject.id, studentId);
      reload();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Хасаж чадсангүй");
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-primary" />
          {subject.name}
        </SheetTitle>
        <SheetDescription>Элссэн сурагчид · {enrolled.length}</SheetDescription>
      </SheetHeader>

      <div className="scrollbar-slim flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
        ) : (
          <>
            {/* Enrolled */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Элссэн ({enrolled.length})
              </p>
              {enrolled.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Сурагч элсээгүй байна
                </p>
              ) : (
                <div className="space-y-1.5">
                  {enrolled.map((s) => (
                    <div
                      key={s.id}
                      className="group flex items-center gap-3 rounded-lg border p-2.5"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                        {s.user?.first_name?.[0] ?? s.first_name?.[0] ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {studentDisplayName(s)}
                        </p>
                        <p className="text-xs text-muted-foreground">{s.student_code}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => removeOne(s.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Not enrolled — add */}
            {notEnrolled.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Элсүүлэх боломжтой ({notEnrolled.length})
                </p>
                <div className="space-y-1.5">
                  {notEnrolled.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => add(s.id)}
                      className="flex w-full items-center gap-3 rounded-lg border border-dashed p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {s.user?.first_name?.[0] ?? s.first_name?.[0] ?? s.student_code?.[0] ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {studentDisplayName(s)}
                        </p>
                        <p className="text-xs text-muted-foreground">{s.student_code ?? "—"}</p>
                      </div>
                      <UserPlus className="h-4 w-4 shrink-0 text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {enrolled.length === 0 && notEnrolled.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10">
                <GraduationCap className="h-9 w-9 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Ангид сурагч алга</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
