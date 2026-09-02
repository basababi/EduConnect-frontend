"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Plus, Users, X, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { examApi, type ExamAdminItem } from "@/lib/api";

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10";

const GRADES = [5, 6, 7, 8, 9, 10, 11, 12];

export function AdminExams() {
  const [list, setList] = useState<ExamAdminItem[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState(11);
  const [count, setCount] = useState(20);

  async function load() {
    try {
      setList(await examApi.manage());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ачаалж чадсангүй");
      setList([]);
    }
  }
  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setTitle(`Математик ${grade}-р анги — сарын шалгалт`);
    setCreating(true);
  }

  async function create() {
    if (!title.trim()) {
      toast.error("Гарчиг оруулна уу");
      return;
    }
    setSaving(true);
    try {
      await examApi.create({ subject: "math", grade, title: title.trim(), count });
      toast.success("Шалгалт үүслээ");
      setCreating(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Үүсгэж чадсангүй");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(exam: ExamAdminItem) {
    const next = exam.status === "open" ? "closed" : "open";
    try {
      await examApi.setStatus(exam.id, next);
      toast.success(next === "open" ? "Нээгдлээ" : "Хаагдлаа");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Өөрчилж чадсангүй");
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5A623] text-[#1B2B4B]">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1B2B4B]">Нийтийн шалгалт</h1>
            <p className="text-sm text-muted-foreground">
              Бүх сургуулийн сурагчид оролцох сорил үүсгэх
            </p>
          </div>
        </div>
        <Button onClick={openNew} className="gap-2 bg-[#1B2B4B] hover:bg-[#1B2B4B]/90">
          <Plus className="h-4 w-4" />
          Шалгалт үүсгэх
        </Button>
      </div>

      {creating && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">Шинэ шалгалт</p>
              <Button variant="ghost" size="icon-sm" onClick={() => setCreating(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Гарчиг
                </label>
                <input
                  className={inputCls}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Математик 11 — сарын шалгалт"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Анги
                </label>
                <select
                  className={inputCls}
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}-р анги
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Асуултын тоо (5–50)
                </label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  className={inputCls}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Асуултууд нь хичээлийн сангаас санамсаргүй сонгогдож, бүх сурагчид ижил
              асуулт хүлээн авна (шударга чансаа).
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreating(false)}>
                Болих
              </Button>
              <Button
                onClick={create}
                disabled={saving}
                className="bg-[#F5A623] text-[#1B2B4B] hover:bg-[#F5A623]/90"
              >
                {saving ? "Үүсгэж байна..." : "Үүсгэх"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {list === null ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Шалгалт алга. Эхний шалгалтаа үүсгэнэ үү.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{e.title}</p>
                    <Badge
                      variant="secondary"
                      className={
                        e.status === "open"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }
                    >
                      {e.status === "open" ? "Нээлттэй" : "Хаалттай"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {e.grade}-р анги · {e.question_count} асуулт
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {e.participants} оролцогч
                    </span>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toggle(e)} className="gap-2">
                  {e.status === "open" ? (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Хаах
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3.5 w-3.5" />
                      Нээх
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
