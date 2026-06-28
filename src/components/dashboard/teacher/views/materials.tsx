"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  FolderOpen,
  Plus,
  FileText,
  Download,
  Trash2,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import {
  classesApi,
  materialsApi,
  subjectsApi,
  uploadFile,
  downloadFile,
  type ClassRoom,
  type Material,
  type Subject,
} from "@/lib/api";

function fmtSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function TeacherMaterials() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingMats, setLoadingMats] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      classesApi.list().catch(() => [] as ClassRoom[]),
      subjectsApi.mine().catch(() => [] as Subject[]),
    ]).then(([cls, subs]) => {
      setClasses(cls);
      setAllSubjects(subs);
      if (cls.length) setClassId(String(cls[0].id));
      setLoadingClasses(false);
    });
  }, []);

  const classSubjects = allSubjects.filter((s) => String(s.class_id) === classId);

  const load = useCallback(() => {
    if (!classId) return;
    setLoadingMats(true);
    materialsApi
      .listForClass(Number(classId))
      .then(setMaterials)
      .catch(() => setMaterials([]))
      .finally(() => setLoadingMats(false));
  }, [classId]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number) {
    if (!confirm("Энэ материалыг устгах уу?")) return;
    try {
      await materialsApi.remove(id);
      toast.success("Устгагдлаа");
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Устгаж чадсангүй");
    }
  }

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Хичээлийн материал</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Сурагчдад зориулсан файл, материал байршуулах
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
              <Plus className="h-4 w-4" />
              Материал нэмэх
            </Button>
          )}
        </div>
      </div>

      {loadingClasses ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : classes.length === 0 ? (
        <EmptyCard text="Танд хариуцсан анги алга" />
      ) : loadingMats ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <EmptyCard text="Материал алга. Эхний материалаа нэмээрэй." />
      ) : (
        <div className="space-y-3">
          {materials.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{m.title}</p>
                    <span className="rounded-full bg-amber/10 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      {m.subject}
                    </span>
                  </div>
                  {m.description && (
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    {m.file_name ?? "Файл"} · {fmtSize(m.file_size)} ·{" "}
                    {new Date(m.created_at).toLocaleDateString("mn-MN")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      downloadFile(m.file_id, m.file_name ?? undefined).catch((e) =>
                        toast.error(e instanceof Error ? e.message : "Татаж чадсангүй"),
                      )
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                    Татах
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => remove(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {classId && (
        <UploadDialog
          key={`${classId}-${addOpen}`}
          open={addOpen}
          onOpenChange={setAddOpen}
          classId={Number(classId)}
          subjects={classSubjects}
          onSaved={load}
        />
      )}
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
        <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

function UploadDialog({
  open,
  onOpenChange,
  classId,
  subjects,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classId: number;
  subjects: Subject[];
  onSaved: () => void;
}) {
  const [subject, setSubject] = useState(subjects[0]?.name ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject) {
      toast.error("Хичээлээ сонгоно уу");
      return;
    }
    if (!file) {
      toast.error("Файл сонгоно уу");
      return;
    }
    setSubmitting(true);
    try {
      const meta = await uploadFile("/files", file);
      await materialsApi.create({
        class_id: classId,
        subject,
        title: title.trim(),
        description: description.trim() || undefined,
        file_id: meta.id,
        file_name: meta.original_name,
        file_size: meta.size,
      });
      toast.success("Материал нэмэгдлээ");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Хичээлийн материал нэмэх</DialogTitle>
          <DialogDescription>
            Сонгосон ангийн сурагчид энэ файлыг харах боломжтой болно.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Хичээл</Label>
            <Select
              value={subject}
              onValueChange={setSubject}
              disabled={submitting || subjects.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={subjects.length === 0 ? "Хичээл алга" : "Сонгох"} />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {subjects.length === 0 && (
              <p className="text-xs text-amber-600">
                Энэ ангид хичээл үүсгээгүй байна. &quot;Миний хичээлүүд&quot;-ээс үүсгэнэ үү.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mat-title">Гарчиг</Label>
            <Input
              id="mat-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Бүлэг 3 — Лекцийн тэмдэглэл"
              required
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mat-desc">Тайлбар (заавал биш)</Label>
            <Textarea
              id="mat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mat-file">Файл</Label>
            <label
              htmlFor="mat-file"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <Paperclip className="h-4 w-4" />
              {file ? file.name : "Файл сонгох (PDF, Word, зураг)"}
            </label>
            <Input
              id="mat-file"
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
              {submitting ? "Байршуулж байна..." : "Нэмэх"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
