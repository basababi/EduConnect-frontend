"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  FileText,
  CheckCircle2,
  Clock,
  Upload,
  Paperclip,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import {
  api,
  submissionsApi,
  studentsApi,
  uploadFile,
  type Assignment,
  type Submission,
} from "@/lib/api";

export function StudentSubmissions() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<Assignment | null>(null);

  const load = useCallback(async () => {
    const [mineRes, meRes] = await Promise.allSettled([
      submissionsApi.mine(),
      studentsApi.me(),
    ]);
    if (mineRes.status === "fulfilled") setSubs(mineRes.value);

    // Сурагчийн ангийг олж даалгаврыг татах
    if (meRes.status === "fulfilled" && meRes.value.class_id) {
      const asgn = await api
        .get<Assignment[]>(`/assignments/class/${meRes.value.class_id}`)
        .catch(() => [] as Assignment[]);
      setAssignments(asgn);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const subFor = (assignmentId: number) =>
    subs.find((s) => s.assignment_id === assignmentId);

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Даалгавар</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Даалгавраа илгээж, дүнгээ хянаарай
        </p>
      </div>

      {assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map((a) => {
            const sub = subFor(a.id);
            return (
              <Card key={a.id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.subject} · Дуусах: {new Date(a.due_date).toLocaleDateString("mn-MN")}
                    </p>
                  </div>
                  <SubmissionStatus sub={sub} overdue={a.is_overdue} />
                  {!sub && (
                    <Button
                      size="sm"
                      variant={a.is_overdue ? "outline" : "amber"}
                      onClick={() => setTarget(a)}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Илгээх
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : subs.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Миний илгээлтүүд</p>
          {subs.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Даалгавар #{s.assignment_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.submitted_at).toLocaleDateString("mn-MN")}
                  </p>
                </div>
                <SubmissionStatus sub={s} overdue={false} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Даалгавар алга байна</p>
            <p className="text-xs text-muted-foreground/70">
              Багш даалгавар нэмбэл энд харагдана
            </p>
          </CardContent>
        </Card>
      )}

      {target && (
        <SubmitDialog
          key={target.id}
          assignment={target}
          onClose={() => setTarget(null)}
          onSubmitted={load}
        />
      )}
    </div>
  );
}

function SubmissionStatus({
  sub,
  overdue,
}: {
  sub: Submission | undefined;
  overdue: boolean;
}) {
  if (sub?.status === "graded") {
    return (
      <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700">
        <Award className="h-3 w-3" />
        {sub.score != null ? `${sub.score} оноо` : "Дүгнэгдсэн"}
      </Badge>
    );
  }
  if (sub) {
    return (
      <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700">
        <CheckCircle2 className="h-3 w-3" />
        Илгээсэн
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className={`gap-1 ${overdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
    >
      <Clock className="h-3 w-3" />
      {overdue ? "Хугацаа хэтэрсэн" : "Илгээгээгүй"}
    </Badge>
  );
}

function SubmitDialog({
  assignment,
  onClose,
  onSubmitted,
}: {
  assignment: Assignment;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !file) {
      toast.error("Хариу эсвэл файл оруулна уу");
      return;
    }
    setSubmitting(true);
    try {
      let fileId: number | undefined;
      if (file) {
        const meta = await uploadFile("/files", file);
        fileId = meta.id;
      }
      await submissionsApi.submit(assignment.id, {
        text_answer: text.trim() || undefined,
        file_id: fileId,
      });
      toast.success("Даалгавар илгээгдлээ");
      onSubmitted();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Илгээж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Даалгавар илгээх</DialogTitle>
          <DialogDescription>{assignment.title}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sub-text">Хариу</Label>
            <Textarea
              id="sub-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Хариугаа энд бичнэ үү..."
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-file">Файл хавсаргах (заавал биш)</Label>
            <label
              htmlFor="sub-file"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <Paperclip className="h-4 w-4" />
              {file ? file.name : "Файл сонгох"}
            </label>
            <Input
              id="sub-file"
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={submitting}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Болих
            </Button>
            <Button type="submit" variant="success" disabled={submitting}>
              {submitting ? "Илгээж байна..." : "Илгээх"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
