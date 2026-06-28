"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Megaphone, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { announcementsApi, getStoredUser, type Announcement } from "@/lib/api";

const ROLE_LABEL: Record<string, string> = {
  teacher: "Багш нар",
  parent: "Эцэг эх",
  student: "Сурагчид",
  admin: "Админ",
};

function audienceLabel(a: Announcement): string {
  if (a.target_type === "school") return "Бүх сургууль";
  if (a.target_type === "role") return ROLE_LABEL[a.target_role ?? ""] ?? "Бүлэг";
  if (a.target_type === "class") return "Анги";
  return "Бүгд";
}

export function AnnouncementsView() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const user = getStoredUser();
  const canCreate =
    user?.role === "admin" || user?.role === "super_admin" || user?.role === "teacher";

  const load = useCallback(() => {
    announcementsApi
      .list(50, 0)
      .then((res) => setItems(res.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function markRead(a: Announcement) {
    if (readIds.has(a.id)) return;
    setReadIds((prev) => new Set(prev).add(a.id));
    announcementsApi.markRead(a.id).catch(() => {});
  }

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Зарлал</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Сургуулийн мэдээ, зарлал</p>
        </div>
        {canCreate && (
          <Button variant="amber" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Зарлал нэмэх
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
            <Megaphone className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Зарлал алга байна</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card
              key={a.id}
              className="cursor-pointer transition-colors hover:bg-muted/30"
              onClick={() => markRead(a)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{a.title}</h3>
                      <Badge variant="secondary" className="text-[10px]">
                        {audienceLabel(a)}
                      </Badge>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {a.body}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground/70">
                      {new Date(a.publish_at ?? a.created_at).toLocaleDateString("mn-MN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {canCreate && <CreateDialog open={open} onOpenChange={setOpen} onCreated={load} />}
    </div>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("school");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function reset() {
    setTitle("");
    setBody("");
    setAudience("school");
    setDone(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // "school" = бүх сургууль; бусад нь role зорилт
    const payload =
      audience === "school"
        ? { title: title.trim(), body: body.trim(), target_type: "school" as const }
        : {
            title: title.trim(),
            body: body.trim(),
            target_type: "role" as const,
            target_role: audience,
          };
    try {
      await announcementsApi.create(payload);
      toast.success("Зарлал нийтлэгдлээ");
      onCreated();
      setDone(true);
      setTimeout(() => {
        onOpenChange(false);
        reset();
      }, 700);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Нийтэлж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Шинэ зарлал</DialogTitle>
          <DialogDescription>Сонгосон бүлэгт зарлал нийтэлнэ.</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="text-sm font-medium text-foreground">Амжилттай нийтлэгдлээ</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ann-title">Гарчиг</Label>
              <Input
                id="ann-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-body">Агуулга</Label>
              <Textarea
                id="ann-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Хэнд</Label>
              <Select value={audience} onValueChange={setAudience} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">Бүх сургууль</SelectItem>
                  <SelectItem value="teacher">Багш нар</SelectItem>
                  <SelectItem value="parent">Эцэг эх</SelectItem>
                  <SelectItem value="student">Сурагчид</SelectItem>
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
                {submitting ? "Нийтэлж байна..." : "Нийтлэх"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
