"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import {
  enrollmentsApi,
  studentsApi,
  studentDisplayName,
  type ClassRoom,
  type Student,
} from "@/lib/api";
import { formatMoney, toIntOrUndefined } from "@/lib/format";

const NONE = "none";

/** Элсүүлж болох бүлгүүд: устгаагүй, дуусаагүй/цуцлагдаагүй */
export function enrollableGroups(groups: ClassRoom[]): ClassRoom[] {
  return groups.filter((g) => g.is_active && (g.status === "active" || g.status === "planned"));
}

function seatsLabel(g: ClassRoom): string {
  return g.capacity ? `${g.enrolled_count}/${g.capacity}` : `${g.enrolled_count}`;
}

/* ──────────────────────────────────────────────
   Сурагч бүртгэх / засах
   Нээх бүрт `key`-ээр remount хийж props-оос эхлүүлнэ (effect-гүй).
   ────────────────────────────────────────────── */
export function StudentFormDialog({
  open,
  onOpenChange,
  editing,
  groups = [],
  defaultClassId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Student | null;
  /** Шинээр бүртгэхдээ шууд элсүүлэх боломжтой бүлгүүд */
  groups?: ClassRoom[];
  defaultClassId?: number;
  onSaved: (s: Student) => void;
}) {
  const [lastName, setLastName] = useState(editing?.last_name ?? "");
  const [firstName, setFirstName] = useState(editing?.first_name ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [guardianName, setGuardianName] = useState(editing?.guardian_name ?? "");
  const [guardianPhone, setGuardianPhone] = useState(editing?.guardian_phone ?? "");
  const [code, setCode] = useState(editing?.student_code ?? "");
  const [dob, setDob] = useState(editing?.date_of_birth?.slice(0, 10) ?? "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [classId, setClassId] = useState<string>(defaultClassId ? String(defaultClassId) : NONE);
  const [submitting, setSubmitting] = useState(false);

  const options = enrollableGroups(groups);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() && !lastName.trim()) {
      toast.error("Сурагчийн овог эсвэл нэрийг оруулна уу");
      return;
    }
    setSubmitting(true);
    // Засах үед хоосон болгосон талбарыг null-оор цэвэрлэнэ; үүсгэх үед орхино
    const blank = editing ? null : undefined;
    const dto = {
      last_name: lastName.trim() || blank,
      first_name: firstName.trim() || blank,
      phone: phone.trim() || blank,
      guardian_name: guardianName.trim() || blank,
      guardian_phone: guardianPhone.trim() || blank,
      student_code: code.trim() || blank,
      date_of_birth: dob || blank,
      note: note.trim() || blank,
    };
    try {
      const saved = editing
        ? await studentsApi.update(editing.id, dto)
        : await studentsApi.create({
            ...dto,
            class_id: classId !== NONE ? Number(classId) : undefined,
          });
      toast.success(editing ? "Сурагчийн мэдээлэл шинэчлэгдлээ" : "Сурагч бүртгэгдлээ");
      onSaved(saved);
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
          <DialogTitle>{editing ? "Сурагчийн мэдээлэл засах" : "Сурагч бүртгэх"}</DialogTitle>
          <DialogDescription>
            Нэвтрэх данс шаардлагагүй — холбоо барих мэдээллийг л бүртгэнэ.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sf-ln">Овог</Label>
              <Input id="sf-ln" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sf-fn">Нэр *</Label>
              <Input id="sf-fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={submitting} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sf-phone">Сурагчийн утас</Label>
              <Input id="sf-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="99112233" disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sf-dob">Төрсөн огноо</Label>
              <Input id="sf-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} disabled={submitting} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sf-gn">Асран хамгаалагчийн нэр</Label>
              <Input id="sf-gn" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sf-gp">Асран хамгаалагчийн утас</Label>
              <Input id="sf-gp" inputMode="tel" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="88112233" disabled={submitting} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sf-code">Сурагчийн код</Label>
              <Input id="sf-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ST-0001" disabled={submitting} />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label>Элсүүлэх бүлэг</Label>
                <Select value={classId} onValueChange={setClassId} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Одоохондоо үгүй</SelectItem>
                    {options.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name} ({seatsLabel(g)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-note">Тэмдэглэл</Label>
            <Textarea id="sf-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} disabled={submitting} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Болих
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Хадгалж байна..." : editing ? "Хадгалах" : "Бүртгэх"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────────
   Бүлэгт элсүүлэх
   `student` эсвэл `group`-ийн аль нэгийг урьдчилан өгнө; нөгөөг нь энд сонгоно.
   ────────────────────────────────────────────── */
export function EnrollDialog({
  open,
  onOpenChange,
  student,
  group,
  students = [],
  groups = [],
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student?: Student | null;
  group?: ClassRoom | null;
  students?: Student[];
  groups?: ClassRoom[];
  onSaved: () => void;
}) {
  const [studentId, setStudentId] = useState<string>(student ? String(student.id) : "");
  const [classId, setClassId] = useState<string>(group ? String(group.id) : "");
  const [discount, setDiscount] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const groupOptions = enrollableGroups(groups);
  const selectedGroup = group ?? groups.find((g) => String(g.id) === classId) ?? null;
  const price = selectedGroup?.effective_price ?? 0;
  const discountValue = toIntOrUndefined(discount) ?? 0;

  // Аль хэдийн тухайн бүлэгт байгаа сурагчийг сонголтоос хасна
  const studentOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => !selectedGroup || !s.groups.some((g) => g.class_id === selectedGroup.id))
      .filter(
        (s) =>
          !q ||
          `${studentDisplayName(s)} ${s.student_code ?? ""} ${s.phone ?? ""}`
            .toLowerCase()
            .includes(q),
      )
      .slice(0, 50);
  }, [students, selectedGroup, search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || !classId) {
      toast.error("Сурагч болон бүлгээ сонгоно уу");
      return;
    }
    if (discountValue > price) {
      toast.error("Хөнгөлөлт үнээс их байж болохгүй");
      return;
    }
    setSubmitting(true);
    try {
      await enrollmentsApi.enroll({
        student_id: Number(studentId),
        class_id: Number(classId),
        discount: discountValue || undefined,
        note: note.trim() || undefined,
      });
      toast.success("Элсүүллээ");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Элсүүлж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Бүлэгт элсүүлэх</DialogTitle>
          <DialogDescription>
            {student ? studentDisplayName(student) : group ? group.name : "Сурагч, бүлгээ сонгоно уу"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!student && (
            <div className="space-y-2">
              <Label>Сурагч</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Нэр, код, утсаар хайх..."
                disabled={submitting}
              />
              <Select value={studentId} onValueChange={setStudentId} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue placeholder={studentOptions.length ? "Сурагч сонгох" : "Тохирох сурагч алга"} />
                </SelectTrigger>
                <SelectContent>
                  {studentOptions.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {studentDisplayName(s)}
                      {s.student_code ? ` · ${s.student_code}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!group && (
            <div className="space-y-2">
              <Label>Бүлэг</Label>
              <Select value={classId} onValueChange={setClassId} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue placeholder={groupOptions.length ? "Бүлэг сонгох" : "Элсүүлэх бүлэг алга"} />
                </SelectTrigger>
                <SelectContent>
                  {groupOptions.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name} ({seatsLabel(g)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedGroup && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Бүлгийн үнэ</span>
                <span className="font-medium">{formatMoney(price)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="en-discount" className="text-sm font-normal text-muted-foreground">
                  Хөнгөлөлт (₮)
                </Label>
                <Input
                  id="en-discount"
                  inputMode="numeric"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  className="h-8 w-32 text-right"
                  disabled={submitting}
                />
              </div>
              <div className="flex items-center justify-between border-t pt-2 text-sm">
                <span className="font-medium text-foreground">Төлөх дүн</span>
                <span className="font-bold text-primary">
                  {formatMoney(Math.max(0, price - discountValue))}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="en-note">Тэмдэглэл (заавал биш)</Label>
            <Input id="en-note" value={note} onChange={(e) => setNote(e.target.value)} disabled={submitting} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Болих
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Элсүүлж байна..." : "Элсүүлэх"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
