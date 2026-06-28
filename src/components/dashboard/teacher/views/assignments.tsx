"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Clock,
  AlertCircle,
  CheckCircle2,
  Eye,
  Award,
  FileText,
  Trash2,
  Paperclip,
} from "lucide-react";
import {
  api,
  submissionsApi,
  subjectsApi,
  downloadFile,
  type ClassRoom,
  type Assignment,
  type Submission,
  type Subject,
} from "@/lib/api";
import { toast } from "sonner";

export function TeacherAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [viewing, setViewing] = useState<Assignment | null>(null);

  const [form, setForm] = useState({
    class_id: "",
    title: "",
    description: "",
    subject: "",
    due_date: "",
  });

  useEffect(() => {
    Promise.all([
      api.get<Assignment[]>("/assignments/my").catch(() => []),
      api.get<ClassRoom[]>("/classes").catch(() => []),
      subjectsApi.mine().catch(() => [] as Subject[]),
    ]).then(([a, c, s]) => {
      setAssignments(a);
      setClasses(c);
      setAllSubjects(s);
      setLoading(false);
    });
  }, []);

  // Диалогт сонгосон ангийн хичээлүүд
  const formSubjects = allSubjects.filter(
    (s) => String(s.class_id) === form.class_id,
  );

  const filtered = assignments.filter((a) => {
    const matchClass = selectedClass === "all" || a.class_id.toString() === selectedClass;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchSearch;
  });

  const stats = {
    total: assignments.length,
    overdue: assignments.filter((a) => a.is_overdue).length,
    active: assignments.filter((a) => a.status === "active").length,
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.class_id || !form.subject) {
      toast.error("Анги болон хичээлээ сонгоно уу");
      return;
    }
    try {
      await api.post("/assignments", {
        class_id: parseInt(form.class_id),
        title: form.title,
        description: form.description,
        subject: form.subject,
        due_date: form.due_date,
        status: "active",
      });
      toast.success("Даалгавар үүслээ");
      setAddOpen(false);
      setForm({ class_id: "", title: "", description: "", subject: "", due_date: "" });
      const fresh = await api.get<Assignment[]>("/assignments/my");
      setAssignments(fresh);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Үүсгэж чадсангүй");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Энэ даалгаврыг устгах уу?")) return;
    try {
      await api.delete(`/assignments/${id}`);
      toast.success("Даалгавар устгагдлаа");
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Устгаж чадсангүй");
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
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="mt-1 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүх анги</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Label className="text-xs">Хайх</Label>
            <Search className="absolute left-3 top-8 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Даалгавар хайх..."
              className="mt-1 w-56 pl-9"
            />
          </div>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="amber">
              <Plus className="mr-2 h-4 w-4" />
              Даалгавар үүсгэх
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Шинэ даалгавар</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <Label>Анги</Label>
                <Select
                  value={form.class_id}
                  onValueChange={(v) => setForm({ ...form, class_id: v, subject: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Сонгох" />
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
                <Label>Гарчиг</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Тайлбар</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Хичээл</Label>
                  <Select
                    value={form.subject}
                    onValueChange={(v) => setForm({ ...form, subject: v })}
                    disabled={!form.class_id || formSubjects.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !form.class_id
                            ? "Эхлээд анги"
                            : formSubjects.length === 0
                              ? "Хичээл алга"
                              : "Сонгох"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {formSubjects.map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Дуусах хугацаа</Label>
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) =>
                      setForm({ ...form, due_date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Үүсгэх
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Нийт даалгавар</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Идэвхтэй</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Хугацаа дууссан</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Assignments list */}
      <div className="space-y-3">
        {filtered.map((a) => (
          <Card key={a.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{a.title}</h3>
                    {a.is_overdue ? (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Хугацаа дууссан
                      </Badge>
                    ) : a.days_until_due <= 3 ? (
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                        <Clock className="mr-1 h-3 w-3" />
                        {a.days_until_due} хоног үлдсэн
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Идэвхтэй
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {a.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium">{a.subject}</span>
                    <span>•</span>
                    <span>{a.class?.name ?? "—"}</span>
                    <span>•</span>
                    <span>Дуусах: {new Date(a.due_date).toLocaleDateString("mn-MN")}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => setViewing(a)}>
                    <Eye className="mr-1 h-4 w-4" />
                    Илгээлт
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(a.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Одоогоор даалгавар алга
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          {viewing && <SubmissionsPanel key={viewing.id} assignment={viewing} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SubmissionsPanel({ assignment }: { assignment: Assignment }) {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    submissionsApi
      .forAssignment(assignment.id)
      .then(setSubs)
      .catch(() => setSubs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {assignment.title}
        </SheetTitle>
        <SheetDescription>
          {assignment.subject} · {subs.length} илгээлт
        </SheetDescription>
      </SheetHeader>

      <div className="scrollbar-slim flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
        ) : subs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <FileText className="h-9 w-9 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Илгээлт алга байна</p>
          </div>
        ) : (
          subs.map((s) => <SubmissionRow key={s.id} sub={s} onGraded={reload} />)
        )}
      </div>
    </>
  );
}

function SubmissionRow({ sub, onGraded }: { sub: Submission; onGraded: () => void }) {
  const [score, setScore] = useState(sub.score != null ? String(sub.score) : "");
  const [feedback, setFeedback] = useState(sub.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const name = sub.student?.user
    ? `${sub.student.user.first_name} ${sub.student.user.last_name}`
    : sub.student?.student_code ?? `Сурагч #${sub.student_id}`;

  async function grade() {
    if (!score) {
      toast.error("Оноо оруулна уу");
      return;
    }
    setSaving(true);
    try {
      await submissionsApi.grade(sub.id, {
        score: Number(score),
        feedback: feedback.trim() || undefined,
      });
      toast.success("Дүгнэгдлээ");
      onGraded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Дүгнэж чадсангүй");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{name}</p>
        {sub.status === "graded" && (
          <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700">
            <Award className="h-3 w-3" />
            {sub.score}
          </Badge>
        )}
      </div>
      {sub.text_answer && (
        <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
          {sub.text_answer}
        </p>
      )}
      {sub.file_id && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            downloadFile(sub.file_id!, sub.file?.original_name).catch((e) =>
              toast.error(e instanceof Error ? e.message : "Татаж чадсангүй"),
            )
          }
        >
          <Paperclip className="h-3.5 w-3.5" />
          Хавсаргасан файл татах
        </Button>
      )}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="Оноо"
          className="w-20"
          disabled={saving}
        />
        <Input
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Сэтгэгдэл (заавал биш)"
          disabled={saving}
        />
        <Button size="sm" variant="success" onClick={grade} disabled={saving}>
          {saving ? "..." : "Дүгнэх"}
        </Button>
      </div>
    </div>
  );
}