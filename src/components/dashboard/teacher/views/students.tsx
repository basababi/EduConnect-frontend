"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, UserPlus, Search, GraduationCap, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  classesApi,
  studentsApi,
  studentDisplayName,
  type ClassRoom,
  type Student,
} from "@/lib/api";

export function TeacherStudents() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    classesApi
      .list()
      .then((cls) => {
        setClasses(cls);
        if (cls.length) setClassId(String(cls[0].id));
      })
      .catch(() => setClasses([]))
      .finally(() => setLoadingClasses(false));
  }, []);

  const loadStudents = useCallback(() => {
    if (!classId) return;
    setLoadingStudents(true);
    studentsApi
      .list(Number(classId))
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [classId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filtered = students.filter((s) => {
    if (!search) return true;
    const name = s.user ? `${s.user.first_name} ${s.user.last_name}` : "";
    return `${name} ${s.student_code ?? ""}`.toLowerCase().includes(search.toLowerCase());
  });

  async function removeStudent(s: Student) {
    if (!confirm("Энэ сурагчийг устгах уу?")) return;
    try {
      await studentsApi.remove(s.id);
      toast.success("Сурагч устгагдлаа");
      setStudents((prev) => prev.filter((x) => x.id !== s.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Устгаж чадсангүй");
    }
  }

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Сурагчид</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ангийн сурагчдыг харах, нэмэх
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!loadingClasses && classes.length > 0 && (
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Анги" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {classId && (
            <Button variant="amber" className="gap-2" onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Сурагч нэмэх
            </Button>
          )}
        </div>
      </div>

      {loadingClasses ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Танд хариуцсан анги алга</p>
            <p className="text-xs text-muted-foreground/70">
              Сургуулийн админ танд анги хуваарилна
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Сурагч хайх..."
              className="pl-9"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingStudents ? (
                <div className="space-y-2 p-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-14">
                  <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Сурагч олдсонгүй</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filtered.map((s) => (
                    <div
                      key={s.id}
                      className="group flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                        {s.user?.first_name?.[0] ?? s.first_name?.[0] ?? s.student_code?.[0] ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {studentDisplayName(s)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.student_code ?? "—"}
                          {s.date_of_birth
                            ? ` · ${new Date(s.date_of_birth).toLocaleDateString("mn-MN")}`
                            : ""}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() =>
                          window.open(`/report-card/${s.id}`, "_blank")
                        }
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Дүнгийн хуудас
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => removeStudent(s)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {classId && (
        <AddStudentDialog
          key={`${classId}-${addOpen}`}
          open={addOpen}
          onOpenChange={setAddOpen}
          classId={Number(classId)}
          onSaved={loadStudents}
        />
      )}
    </div>
  );
}

function AddStudentDialog({
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
            Сурагчийн бүртгэл үүснэ. Нэвтрэх дансыг админ урилгаар холбоно.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ts-code">Сурагчийн код (заавал биш)</Label>
            <Input
              id="ts-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="STU-2025-031"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ts-dob">Төрсөн огноо (заавал биш)</Label>
            <Input
              id="ts-dob"
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
