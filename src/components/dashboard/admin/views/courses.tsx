"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { Archive, GraduationCap, Layers, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { coursesApi, type BillingType, type Course } from "@/lib/api";
import { formatMoney, toIntOrUndefined } from "@/lib/format";
import { BILLING_TYPE_LABELS } from "@/lib/terms";

/** Курсууд — төвийн каталог. Тодорхой ээлж, багш, хуваарь нь "Бүлгүүд" дээр. */
export function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  const load = useCallback(() => {
    coursesApi
      .list()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function archive(c: Course) {
    if (!confirm(`"${c.name}" курсийг архивлах уу?`)) return;
    try {
      await coursesApi.archive(c.id);
      toast.success("Курс архивлагдлаа");
      setCourses((prev) => prev.filter((x) => x.id !== c.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Архивлаж чадсангүй");
    }
  }

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Курсууд</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Төвийн сургалтын каталог. Курс бүрт нэг буюу хэд хэдэн бүлэг нээнэ.
          </p>
        </div>
        <Button
          variant="amber"
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Курс нэмэх
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-14">
            <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Курс алга</p>
            <p className="max-w-xs text-center text-xs text-muted-foreground/70">
              Эхлээд заадаг курсээ (жишээ нь «ЭЕШ Математик») үнийн хамт бүртгээд, дараа нь
              бүлэг нээнэ.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Card key={c.id} className="group transition-shadow hover:shadow-md">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{c.name}</p>
                    {c.category && (
                      <p className="text-xs text-muted-foreground">{c.category}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Засах"
                      onClick={() => {
                        setEditing(c);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Архивлах"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => archive(c)}
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-primary">
                    {formatMoney(c.default_price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {BILLING_TYPE_LABELS[c.billing_type]}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Layers className="h-3 w-3" />
                    {c.group_count ?? 0} бүлэг
                  </Badge>
                  {c.total_sessions ? (
                    <Badge variant="secondary" className="text-xs">
                      {c.total_sessions} хичээл
                    </Badge>
                  ) : null}
                  {c.duration_weeks ? (
                    <Badge variant="secondary" className="text-xs">
                      {c.duration_weeks} долоо хоног
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CourseDialog
        key={`${editing?.id ?? "new"}-${formOpen}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={load}
      />
    </div>
  );
}

function CourseDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Course | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [category, setCategory] = useState(editing?.category ?? "");
  const [price, setPrice] = useState(editing ? String(editing.default_price) : "");
  const [billing, setBilling] = useState<BillingType>(editing?.billing_type ?? "one_time");
  const [sessions, setSessions] = useState(editing?.total_sessions ? String(editing.total_sessions) : "");
  const [weeks, setWeeks] = useState(editing?.duration_weeks ? String(editing.duration_weeks) : "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const dto = {
      name: name.trim(),
      category: category.trim() || undefined,
      description: description.trim() || undefined,
      default_price: toIntOrUndefined(price) ?? 0,
      billing_type: billing,
      total_sessions: toIntOrUndefined(sessions),
      duration_weeks: toIntOrUndefined(weeks),
    };
    try {
      if (editing) {
        await coursesApi.update(editing.id, dto);
        toast.success("Курс шинэчлэгдлээ");
      } else {
        await coursesApi.create(dto);
        toast.success("Курс үүслээ");
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
          <DialogTitle>{editing ? "Курс засах" : "Шинэ курс"}</DialogTitle>
          <DialogDescription>
            Үнийг бүлэг, сурагч тус бүр дээр дараа нь өөрчилж болно.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="co-name">Курсийн нэр *</Label>
            <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ЭЕШ Математик" required minLength={2} disabled={submitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-cat">Ангилал</Label>
            <Input id="co-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="ЭЕШ бэлтгэл, Хэл, IT..." disabled={submitting} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="co-price">Үнэ (₮) *</Label>
              <Input
                id="co-price"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="180000"
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Төлбөрийн төрөл</Label>
              <Select value={billing} onValueChange={(v) => setBilling(v as BillingType)} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">{BILLING_TYPE_LABELS.one_time}</SelectItem>
                  <SelectItem value="monthly">{BILLING_TYPE_LABELS.monthly}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="co-sessions">Нийт хичээлийн тоо</Label>
              <Input id="co-sessions" inputMode="numeric" value={sessions} onChange={(e) => setSessions(e.target.value.replace(/[^0-9]/g, ""))} disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-weeks">Үргэлжлэх долоо хоног</Label>
              <Input id="co-weeks" inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value.replace(/[^0-9]/g, ""))} disabled={submitting} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-desc">Тайлбар</Label>
            <Textarea id="co-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} disabled={submitting} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
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
