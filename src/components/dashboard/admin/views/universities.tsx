"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  careerApi,
  type UniversityProgramAdmin,
  type ProgramInput,
} from "@/lib/api";

const EMPTY: ProgramInput = {
  university: "",
  program: "",
  city: "Улаанбаатар",
  ownership: "state",
  eyesh_subjects: [],
  cutoff_score: 400,
  field: "",
  tuition_range: "",
  status: "approved",
};

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10";

export function AdminUniversities() {
  const [list, setList] = useState<UniversityProgramAdmin[] | null>(null);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<ProgramInput>(EMPTY);
  const [subjectsText, setSubjectsText] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setList(await careerApi.adminPrograms());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ачаалж чадсангүй");
      setList([]);
    }
  }
  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setForm(EMPTY);
    setSubjectsText("");
    setEditing("new");
  }
  function openEdit(p: UniversityProgramAdmin) {
    const { id: _id, ...rest } = p;
    void _id;
    setForm(rest);
    setSubjectsText((p.eyesh_subjects ?? []).join(", "));
    setEditing(p.id);
  }
  function close() {
    setEditing(null);
  }

  async function save() {
    if (!form.university.trim() || !form.program.trim()) {
      toast.error("Сургууль ба хөтөлбөрийн нэр шаардлагатай");
      return;
    }
    const payload: ProgramInput = {
      ...form,
      eyesh_subjects: subjectsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      cutoff_score: Number(form.cutoff_score) || 0,
    };
    setSaving(true);
    try {
      if (editing === "new") {
        await careerApi.adminCreateProgram(payload);
        toast.success("Хөтөлбөр нэмэгдлээ");
      } else if (typeof editing === "number") {
        await careerApi.adminUpdateProgram(editing, payload);
        toast.success("Хадгаллаа");
      }
      close();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Хадгалж чадсангүй");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: UniversityProgramAdmin) {
    if (!confirm(`"${p.university} — ${p.program}"-г устгах уу?`)) return;
    try {
      await careerApi.adminDeleteProgram(p.id);
      toast.success("Устгалаа");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Устгаж чадсангүй");
    }
  }

  const set = <K extends keyof ProgramInput>(k: K, v: ProgramInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Их сургуулийн сан
            </h1>
            <p className="text-sm text-muted-foreground">
              Карьер модулийн ЭЕШ→сургууль тааруулахад ашиглагдана
            </p>
          </div>
        </div>
        {editing === null && (
          <Button variant="amber" className="gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Хөтөлбөр нэмэх
          </Button>
        )}
      </div>

      {/* Форм */}
      {editing !== null && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">
                {editing === "new" ? "Шинэ хөтөлбөр" : "Хөтөлбөр засах"}
              </p>
              <button onClick={close} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Сургууль *</label>
                <input
                  className={inputCls}
                  value={form.university}
                  onChange={(e) => set("university", e.target.value)}
                  placeholder="ж: ШУТИС"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Хөтөлбөр *</label>
                <input
                  className={inputCls}
                  value={form.program}
                  onChange={(e) => set("program", e.target.value)}
                  placeholder="ж: Программ хангамж"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Хот/Аймаг</label>
                <input
                  className={inputCls}
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Өмч</label>
                <select
                  className={inputCls}
                  value={form.ownership}
                  onChange={(e) =>
                    set("ownership", e.target.value as "state" | "private")
                  }
                >
                  <option value="state">Төрийн</option>
                  <option value="private">Хувийн</option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-muted-foreground">
                  ЭЕШ хичээлүүд (таслалаар)
                </label>
                <input
                  className={inputCls}
                  value={subjectsText}
                  onChange={(e) => setSubjectsText(e.target.value)}
                  placeholder="Математик, Физик"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Босго оноо (0–800)
                </label>
                <input
                  type="number"
                  min={0}
                  max={800}
                  className={inputCls}
                  value={form.cutoff_score}
                  onChange={(e) => set("cutoff_score", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Чиглэл (career категори)
                </label>
                <input
                  className={inputCls}
                  value={form.field ?? ""}
                  onChange={(e) => set("field", e.target.value)}
                  placeholder="ж: IT ба Дата"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Төлбөрийн муж (жилд)
                </label>
                <input
                  className={inputCls}
                  value={form.tuition_range ?? ""}
                  onChange={(e) => set("tuition_range", e.target.value)}
                  placeholder="ж: 3-4 сая"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="amber" onClick={save} disabled={saving}>
                {saving ? "Хадгалж байна..." : "Хадгалах"}
              </Button>
              <Button variant="outline" onClick={close}>
                Болих
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Жагсаалт */}
      {list === null ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-3">Сургууль / Хөтөлбөр</th>
                    <th className="p-3">ЭЕШ</th>
                    <th className="p-3">Босго</th>
                    <th className="p-3">Өмч</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="p-3">
                        <p className="font-medium text-foreground">
                          {p.university}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.program} · {p.city}
                          {p.field ? ` · ${p.field}` : ""}
                        </p>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {(p.eyesh_subjects ?? []).join(", ") || "—"}
                      </td>
                      <td className="p-3 font-medium text-foreground">
                        {p.cutoff_score}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {p.ownership === "state" ? "Төрийн" : "Хувийн"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => remove(p)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-sm text-muted-foreground"
                      >
                        Хөтөлбөр алга. "Хөтөлбөр нэмэх" дарж эхлүүлнэ үү.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
