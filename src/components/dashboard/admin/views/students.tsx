"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileSpreadsheet,
  GraduationCap,
  MoreVertical,
  Pencil,
  Phone,
  Search,
  Smartphone,
  Trash2,
  UserPlus,
  UserRoundPlus,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { ImportStudentsDialog } from "@/components/dashboard/admin/import-students-dialog";
import {
  StudentInvoicesDialog,
  type FixedStudent,
} from "@/components/dashboard/admin/finance-dialogs";
import {
  EnrollDialog,
  StudentFormDialog,
  enrollableGroups,
} from "@/components/dashboard/admin/student-dialogs";
import { StudentAccessDialog } from "@/components/dashboard/admin/student-access-dialog";
import { formatPhone } from "@/lib/phone";
import {
  classesApi,
  studentsApi,
  studentDisplayName,
  type ClassRoom,
  type Student,
} from "@/lib/api";

type Filter = "all" | "enrolled" | "unassigned";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "Бүгд" },
  { key: "enrolled", label: "Суралцаж буй" },
  { key: "unassigned", label: "Бүлэггүй" },
];

/** Төвийн бүх сурагч — бүртгэх, холбоо барих мэдээлэл, бүлэгт элсүүлэх */
export function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [enrolling, setEnrolling] = useState<Student | null>(null);
  const [billingOf, setBillingOf] = useState<FixedStudent | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [accessOf, setAccessOf] = useState<FixedStudent | null>(null);

  const load = useCallback(() => {
    Promise.all([
      studentsApi.list().catch(() => [] as Student[]),
      classesApi.list().catch(() => [] as ClassRoom[]),
    ])
      .then(([s, g]) => {
        setStudents(s);
        setGroups(g);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const filtered = students.filter((s) => {
    const matchFilter =
      filter === "all" ||
      (filter === "enrolled" ? s.groups.length > 0 : s.groups.length === 0);
    const matchSearch =
      !q ||
      `${studentDisplayName(s)} ${s.student_code ?? ""} ${s.phone ?? ""} ${s.guardian_phone ?? ""} ${formatPhone(s.phone)} ${formatPhone(s.guardian_phone)}`
        .toLowerCase()
        .includes(q);
    return matchFilter && matchSearch;
  });

  async function deactivate(s: Student) {
    const groupNote =
      s.groups.length > 0 ? `\n${s.groups.length} бүлгийн элсэлт нь хаагдана.` : "";
    if (!confirm(`${studentDisplayName(s)}-г идэвхгүй болгох уу?${groupNote}`)) return;
    try {
      await studentsApi.remove(s.id);
      toast.success("Сурагч идэвхгүй боллоо");
      setStudents((prev) => prev.filter((x) => x.id !== s.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Амжилтгүй");
    }
  }

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Сурагчид</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Нийт {students.length} сурагч ·{" "}
            {students.filter((s) => s.groups.length === 0).length} бүлэггүй
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel импорт
          </Button>
          <Button
            variant="amber"
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Сурагч бүртгэх
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Нэр, код, утсаар хайх..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14">
              <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">Сурагч олдсонгүй</p>
              {students.length === 0 && (
                <p className="text-xs text-muted-foreground/70">
                  Сурагчаа нэг нэгээр нь бүртгэх эсвэл Excel файлаас импортлоорой
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((s) => {
                const name = studentDisplayName(s);
                return (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                      {name[0] ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                      <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        {s.student_code && <span>{s.student_code}</span>}
                        {(s.guardian_phone ?? s.phone) && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {s.guardian_phone
                              ? `${formatPhone(s.guardian_phone)}${s.guardian_name ? ` (${s.guardian_name})` : ""}`
                              : formatPhone(s.phone)}
                          </span>
                        )}
                        {s.user && (
                          <span
                            className="inline-flex items-center gap-1"
                            title={s.user.status === "invited" ? "Нэвтрэх эрх нээсэн, идэвхжүүлээгүй" : "Апп ашигладаг"}
                          >
                            <Smartphone className="h-3 w-3" />
                            {s.user.status === "invited" ? "Идэвхжүүлээгүй" : "Апп"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-1.5">
                      {s.groups.length === 0 ? (
                        <Badge variant="secondary" className="bg-muted text-xs text-muted-foreground">
                          Бүлэггүй
                        </Badge>
                      ) : (
                        s.groups.map((g) => (
                          <Badge
                            key={g.enrollment_id}
                            variant="secondary"
                            className={`max-w-48 truncate text-xs ${
                              g.status === "paused"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-primary/10 text-primary"
                            }`}
                            title={g.status === "paused" ? "Түр чөлөөтэй" : undefined}
                          >
                            {g.name}
                          </Badge>
                        ))
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" title="Үйлдэл" className="shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEnrolling(s)}>
                          <UserRoundPlus className="mr-2 h-4 w-4" /> Бүлэгт элсүүлэх
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setBillingOf({ id: s.id, name })}>
                          <Wallet className="mr-2 h-4 w-4" /> Төлбөр, нэхэмжлэх
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAccessOf({ id: s.id, name })}>
                          <Smartphone className="mr-2 h-4 w-4" /> Апп-д нэвтрэх эрх
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(s);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Мэдээлэл засах
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => deactivate(s)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Идэвхгүй болгох
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <StudentFormDialog
        key={`form-${editing?.id ?? "new"}-${formOpen}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        groups={groups}
        onSaved={load}
      />
      <EnrollDialog
        key={`enroll-${enrolling?.id ?? "none"}`}
        open={!!enrolling}
        onOpenChange={(v) => !v && setEnrolling(null)}
        student={enrolling}
        groups={groups.filter((g) => !enrolling?.groups.some((x) => x.class_id === g.id))}
        onSaved={load}
      />
      <ImportStudentsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        classes={enrollableGroups(groups)}
        onImported={load}
      />
      <StudentInvoicesDialog
        student={billingOf}
        onOpenChange={(v) => !v && setBillingOf(null)}
      />
      <StudentAccessDialog
        key={`access-${accessOf?.id ?? "none"}`}
        student={accessOf}
        onOpenChange={(v) => !v && setAccessOf(null)}
        onChanged={load}
      />
    </div>
  );
}
