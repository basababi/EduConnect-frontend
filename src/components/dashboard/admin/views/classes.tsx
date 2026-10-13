"use client";

import { useCallback, useEffect, useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowRightLeft,
  BookOpen,
  CalendarRange,
  FileSpreadsheet,
  GraduationCap,
  MapPin,
  MoreVertical,
  Pause,
  Pencil,
  Phone,
  Play,
  Plus,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { ImportStudentsDialog } from "@/components/dashboard/admin/import-students-dialog";
import {
  EnrollDialog,
  StudentFormDialog,
  enrollableGroups,
} from "@/components/dashboard/admin/student-dialogs";
import { toast } from "sonner";
import {
  classesApi,
  coursesApi,
  enrollmentsApi,
  studentsApi,
  usersApi,
  studentDisplayName,
  type ClassRoom,
  type Course,
  type CreateClassDto,
  type Enrollment,
  type EnrollmentStatus,
  type GroupStatus,
  type Student,
  type User,
} from "@/lib/api";
import { formatDateRange, formatMoney, toIntOrUndefined } from "@/lib/format";
import { ENROLLMENT_STATUS_LABELS, GROUP_STATUS_LABELS } from "@/lib/terms";

const NONE = "none";

const GROUP_STATUS_CLS: Record<GroupStatus, string> = {
  planned: "bg-sky-100 text-sky-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-rose-100 text-rose-700",
};

const ENROLLMENT_STATUS_CLS: Record<EnrollmentStatus, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-sky-100 text-sky-700",
  dropped: "bg-muted text-muted-foreground",
};

const STATUS_FILTERS: Array<{ key: "current" | GroupStatus; label: string }> = [
  { key: "current", label: "Одоогийн" },
  { key: "completed", label: "Дууссан" },
  { key: "cancelled", label: "Цуцлагдсан" },
];

/** Бүлгүүд (backend: classes) — курсийн ээлж, багш, суудал, сурагчдын элсэлт */
export function AdminClasses() {
  const [groups, setGroups] = useState<ClassRoom[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"current" | GroupStatus>("current");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRoom | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      classesApi.list().catch(() => [] as ClassRoom[]),
      coursesApi.list().catch(() => [] as Course[]),
      usersApi.list("teacher").catch(() => [] as User[]),
    ])
      .then(([g, c, t]) => {
        setGroups(g);
        setCourses(c);
        setTeachers(t.filter((u) => u.is_active !== false));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = groups.filter((g) => {
    const matchStatus =
      statusFilter === "current"
        ? g.status === "active" || g.status === "planned"
        : g.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q || `${g.name} ${g.course?.name ?? ""}`.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const detail = groups.find((g) => g.id === detailId) ?? null;

  async function handleDelete(g: ClassRoom) {
    if (!confirm(`"${g.name}" бүлгийг устгах уу?`)) return;
    try {
      await classesApi.remove(g.id);
      toast.success("Бүлэг устгагдлаа");
      setGroups((prev) => prev.filter((x) => x.id !== g.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Устгаж чадсангүй");
    }
  }

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Бүлгүүд</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Нийт {groups.length} бүлэг ·{" "}
            {groups.reduce((n, g) => n + g.enrolled_count, 0)} сурагч суралцаж байна
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
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
            Бүлэг нэмэх
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Бүлэг, курс хайх..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-14">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Бүлэг олдсонгүй</p>
            {groups.length === 0 && (
              <p className="max-w-xs text-center text-xs text-muted-foreground/70">
                {courses.length === 0
                  ? "Эхлээд «Курсууд» цэсээс курсээ бүртгээд, дараа нь энд бүлэг нээнэ."
                  : "Эхний бүлгээ «Бүлэг нэмэх» товчоор үүсгээрэй."}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => {
            const full = g.capacity != null && g.enrolled_count >= g.capacity;
            return (
              <Card
                key={g.id}
                className="group cursor-pointer transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20"
                onClick={() => setDetailId(g.id)}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{g.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {g.course?.name ?? "Курс оноогоогүй"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Засах"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(g);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Устгах"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(g);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <GraduationCap className="h-3 w-3 shrink-0" />
                      {g.teacher
                        ? `${g.teacher.first_name} ${g.teacher.last_name}`
                        : "Багш оноогоогүй"}
                    </p>
                    {(g.start_date || g.end_date) && (
                      <p className="flex items-center gap-1.5">
                        <CalendarRange className="h-3 w-3 shrink-0" />
                        {formatDateRange(g.start_date, g.end_date)}
                      </p>
                    )}
                    {g.room && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {g.room}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
                        full ? "bg-rose-100 text-rose-700" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Users className="h-3 w-3" />
                      {g.enrolled_count}
                      {g.capacity != null ? `/${g.capacity}` : ""} сурагч
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {formatMoney(g.effective_price)}
                    </span>
                    <Badge variant="secondary" className={`text-xs ${GROUP_STATUS_CLS[g.status]}`}>
                      {GROUP_STATUS_LABELS[g.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <GroupDialog
        key={`${editing?.id ?? "new"}-${formOpen}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        courses={courses}
        teachers={teachers}
        onSaved={load}
      />

      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetailId(null)}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
          {detail && (
            <GroupDetail key={detail.id} group={detail} groups={groups} onChanged={load} />
          )}
        </SheetContent>
      </Sheet>

      <ImportStudentsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        classes={enrollableGroups(groups)}
        onImported={load}
      />
    </div>
  );
}

// ── Бүлэг үүсгэх/засах ──
function GroupDialog({
  open,
  onOpenChange,
  editing,
  courses,
  teachers,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: ClassRoom | null;
  courses: Course[];
  teachers: User[];
  onSaved: () => void;
}) {
  // key-remount-аар нээх бүрт props-оос шинээр эхлүүлнэ (effect-гүй)
  const [name, setName] = useState(editing?.name ?? "");
  const [courseId, setCourseId] = useState(editing?.course_id ? String(editing.course_id) : NONE);
  const [teacherId, setTeacherId] = useState(editing?.teacher_id ? String(editing.teacher_id) : NONE);
  const [startDate, setStartDate] = useState(editing?.start_date ?? "");
  const [endDate, setEndDate] = useState(editing?.end_date ?? "");
  const [capacity, setCapacity] = useState(editing?.capacity != null ? String(editing.capacity) : "");
  const [price, setPrice] = useState(editing?.price != null ? String(editing.price) : "");
  const [room, setRoom] = useState(editing?.room ?? "");
  const [status, setStatus] = useState<GroupStatus>(editing?.status ?? "active");
  const [submitting, setSubmitting] = useState(false);

  const course = courses.find((c) => String(c.id) === courseId);
  const closing =
    !!editing &&
    editing.status !== status &&
    (status === "completed" || status === "cancelled") &&
    editing.enrolled_count > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (startDate && endDate && endDate < startDate) {
      toast.error("Дуусах огноо эхлэх огнооноос өмнө байж болохгүй");
      return;
    }
    if (
      closing &&
      !confirm(
        `Бүлгийг "${GROUP_STATUS_LABELS[status]}" болгоход ${editing.enrolled_count} сурагчийн элсэлт хаагдана. Үргэлжлүүлэх үү?`,
      )
    )
      return;

    setSubmitting(true);
    // Засах үед хоосон болгосон талбарыг null-оор цэвэрлэнэ; үүсгэх үед орхино
    const blank = editing ? null : undefined;
    const dto: CreateClassDto = {
      name: name.trim(),
      course_id: courseId !== NONE ? Number(courseId) : blank,
      teacher_id: teacherId !== NONE ? Number(teacherId) : blank,
      start_date: startDate || blank,
      end_date: endDate || blank,
      capacity: toIntOrUndefined(capacity) ?? blank,
      price: toIntOrUndefined(price) ?? blank,
      room: room.trim() || blank,
      status,
    };
    try {
      if (editing) {
        await classesApi.update(editing.id, dto);
        toast.success("Бүлэг шинэчлэгдлээ");
      } else {
        await classesApi.create(dto);
        toast.success("Бүлэг үүслээ");
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Бүлэг засах" : "Шинэ бүлэг"}</DialogTitle>
          <DialogDescription>
            Бүлэг нь курсийн нэг ээлж — багш, хугацаа, суудлын тоотой.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gr-name">Бүлгийн нэр *</Label>
            <Input
              id="gr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ЭЕШ Математик — Орой (Да/Лх/Ба)"
              required
              minLength={2}
              disabled={submitting}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Курс</Label>
              <Select value={courseId} onValueChange={setCourseId} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Курсгүй</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Багш</Label>
              <Select value={teacherId} onValueChange={setTeacherId} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Оноогоогүй</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.first_name} {t.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="gr-start">Эхлэх огноо</Label>
              <Input id="gr-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gr-end">Дуусах огноо</Label>
              <Input id="gr-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={submitting} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="gr-cap">Суудал</Label>
              <Input
                id="gr-cap"
                inputMode="numeric"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Хязгааргүй"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gr-price">Үнэ (₮)</Label>
              <Input
                id="gr-price"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder={course ? String(course.default_price) : "0"}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gr-room">Өрөө</Label>
              <Input id="gr-room" value={room} onChange={(e) => setRoom(e.target.value)} disabled={submitting} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Үнийг хоосон орхивол курсийн үнийг ({formatMoney(course?.default_price ?? 0)}) дагана.
          </p>
          {editing && (
            <div className="space-y-2">
              <Label>Төлөв</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as GroupStatus)} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(GROUP_STATUS_LABELS) as GroupStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {GROUP_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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

// ── Бүлгийн дэлгэрэнгүй: элсэлтийн жагсаалт + үйлдлүүд ──
function GroupDetail({
  group,
  groups,
  onChanged,
}: {
  group: ClassRoom;
  groups: ClassRoom[];
  onChanged: () => void;
}) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [newStudentOpen, setNewStudentOpen] = useState(false);
  const [transferring, setTransferring] = useState<Enrollment | null>(null);

  const reload = useCallback(() => {
    Promise.all([
      enrollmentsApi.list({ classId: group.id }).catch(() => [] as Enrollment[]),
      studentsApi.list().catch(() => [] as Student[]),
    ])
      .then(([e, s]) => {
        setEnrollments(e);
        setStudents(s);
      })
      .finally(() => setLoading(false));
  }, [group.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const refresh = () => {
    reload();
    onChanged();
  };

  const live = enrollments.filter((e) => e.status === "active" || e.status === "paused");
  const past = enrollments.filter((e) => e.status === "completed" || e.status === "dropped");
  const canEnroll = group.status === "active" || group.status === "planned";

  async function setStatus(e: Enrollment, status: EnrollmentStatus, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    try {
      await enrollmentsApi.update(e.id, { status });
      toast.success(`Төлөв: ${ENROLLMENT_STATUS_LABELS[status]}`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Амжилтгүй");
    }
  }

  async function removeEnrollment(e: Enrollment) {
    if (!confirm("Энэ элсэлтийг бүрмөсөн устгах уу? (Андуурч элсүүлсэн үед)")) return;
    try {
      await enrollmentsApi.remove(e.id);
      toast.success("Элсэлт устгагдлаа");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Устгаж чадсангүй");
    }
  }

  const row = (e: Enrollment) => {
    const name = e.student ? studentDisplayName(e.student) : `#${e.student_id}`;
    const contact = e.student?.guardian_phone ?? e.student?.phone;
    const isLive = e.status === "active" || e.status === "paused";
    return (
      <div key={e.id} className="flex items-center gap-3 rounded-lg border p-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
          {name[0] ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {contact && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {contact}
              </span>
            )}
            <span className="tabular-nums">
              {formatMoney(e.final_price)}
              {e.discount ? ` (−${formatMoney(e.discount)})` : ""}
            </span>
          </p>
        </div>
        <Badge variant="secondary" className={`shrink-0 text-[11px] ${ENROLLMENT_STATUS_CLS[e.status]}`}>
          {ENROLLMENT_STATUS_LABELS[e.status]}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" title="Үйлдэл">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {e.status === "active" && (
              <DropdownMenuItem onClick={() => setStatus(e, "paused")}>
                <Pause className="mr-2 h-4 w-4" /> Түр чөлөө олгох
              </DropdownMenuItem>
            )}
            {e.status !== "active" && canEnroll && (
              <DropdownMenuItem onClick={() => setStatus(e, "active")}>
                <Play className="mr-2 h-4 w-4" /> Идэвхжүүлэх
              </DropdownMenuItem>
            )}
            {isLive && (
              <>
                <DropdownMenuItem onClick={() => setTransferring(e)}>
                  <ArrowRightLeft className="mr-2 h-4 w-4" /> Өөр бүлэгт шилжүүлэх
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatus(e, "dropped", `${name}-г энэ бүлгээс гаргах уу?`)}
                >
                  <UserMinus className="mr-2 h-4 w-4" /> Бүлгээс гаргах
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => removeEnrollment(e)}>
              <Trash2 className="mr-2 h-4 w-4" /> Элсэлтийг устгах
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 shrink-0 text-primary" />
          <span className="truncate">{group.name}</span>
        </SheetTitle>
        <SheetDescription>
          {[
            group.course?.name,
            group.teacher ? `${group.teacher.first_name} ${group.teacher.last_name}` : null,
            formatDateRange(group.start_date, group.end_date) || null,
            formatMoney(group.effective_price),
          ]
            .filter(Boolean)
            .join(" · ")}
        </SheetDescription>
      </SheetHeader>

      <div className="flex items-center justify-between gap-2 px-4">
        <p className="text-sm font-medium text-foreground">
          Сурагчид ({live.length}
          {group.capacity != null ? `/${group.capacity}` : ""})
        </p>
        {canEnroll && (
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setNewStudentOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Шинэ сурагч
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setEnrollOpen(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              Элсүүлэх
            </Button>
          </div>
        )}
      </div>

      <div className="scrollbar-slim flex-1 space-y-1.5 overflow-y-auto px-4 pb-4">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
        ) : live.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <GraduationCap className="h-9 w-9 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Энэ бүлэгт сурагч элсээгүй байна</p>
          </div>
        ) : (
          live.map(row)
        )}

        {past.length > 0 && (
          <>
            <button
              onClick={() => setShowPast((v) => !v)}
              className="mt-3 text-xs font-medium text-primary hover:underline"
            >
              {showPast ? "Гарсан/дүүргэснийг нуух" : `Гарсан/дүүргэсэн ${past.length} сурагчийг харах`}
            </button>
            {showPast && past.map(row)}
          </>
        )}
      </div>

      <EnrollDialog
        key={`enroll-${enrollOpen}`}
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        group={group}
        students={students}
        onSaved={refresh}
      />
      <StudentFormDialog
        key={`new-${newStudentOpen}`}
        open={newStudentOpen}
        onOpenChange={setNewStudentOpen}
        groups={[group]}
        defaultClassId={group.id}
        onSaved={refresh}
      />
      <TransferDialog
        key={`transfer-${transferring?.id ?? "none"}`}
        enrollment={transferring}
        targets={enrollableGroups(groups).filter((g) => g.id !== group.id)}
        onOpenChange={(v) => !v && setTransferring(null)}
        onDone={refresh}
      />
    </>
  );
}

function TransferDialog({
  enrollment,
  targets,
  onOpenChange,
  onDone,
}: {
  enrollment: Enrollment | null;
  targets: ClassRoom[];
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const [target, setTarget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!enrollment || !target) return;
    setSubmitting(true);
    try {
      await enrollmentsApi.transfer(enrollment.id, Number(target));
      toast.success("Шилжүүллээ");
      onDone();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Шилжүүлж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={!!enrollment} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Өөр бүлэгт шилжүүлэх</DialogTitle>
          <DialogDescription>
            {enrollment?.student ? studentDisplayName(enrollment.student) : ""} — одоогийн
            бүлгээс гарч, сонгосон бүлгийн үнээр элсэнэ.
          </DialogDescription>
        </DialogHeader>
        <Select value={target} onValueChange={setTarget} disabled={submitting}>
          <SelectTrigger>
            <SelectValue placeholder={targets.length ? "Шилжих бүлэг" : "Шилжих бүлэг алга"} />
          </SelectTrigger>
          <SelectContent>
            {targets.map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>
                {g.name} · {formatMoney(g.effective_price)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Болих
          </Button>
          <Button onClick={submit} disabled={submitting || !target}>
            {submitting ? "Шилжүүлж байна..." : "Шилжүүлэх"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
