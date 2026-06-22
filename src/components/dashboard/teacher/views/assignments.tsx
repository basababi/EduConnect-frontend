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
import { Plus, Search, Clock, AlertCircle, CheckCircle2, Eye } from "lucide-react";
import { api, type ClassRoom, type Assignment } from "@/lib/api";
import { toast } from "sonner";

const SUBJECTS = ["Математик", "Монгол хэл", "Англи хэл", "Байгаль", "Түүх"];

export function TeacherAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const [form, setForm] = useState({
    class_id: "",
    title: "",
    description: "",
    subject: "Математик",
    due_date: "",
  });

  useEffect(() => {
    Promise.all([
      api.get<Assignment[]>("/assignments/my").catch(() => []),
      api.get<ClassRoom[]>("/classes").catch(() => []),
    ]).then(([a, c]) => {
      setAssignments(a);
      setClasses(c);
      setLoading(false);
    });
  }, []);

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
      setForm({ class_id: "", title: "", description: "", subject: "Математик", due_date: "" });
      const fresh = await api.get<Assignment[]>("/assignments/my");
      setAssignments(fresh);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Үүсгэж чадсангүй");
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
            <Button className="bg-accent hover:bg-accent/90">
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
                  onValueChange={(v) => setForm({ ...form, class_id: v })}
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
                  >
                    <SelectTrigger>
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
                <Button variant="outline" size="sm">
                  <Eye className="mr-1 h-4 w-4" />
                  Харах
                </Button>
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
    </div>
  );
}