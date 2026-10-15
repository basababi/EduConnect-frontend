"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Circle, Rocket, X } from "lucide-react";
import { onboardingApi, type OnboardingProgress, type OnboardingStepKey } from "@/lib/api";
import type { AdminView } from "@/components/dashboard/admin/admin-shell";

const STEPS: Record<OnboardingStepKey, { title: string; hint: string; view: AdminView }> = {
  course: { title: "Курс үүсгэх", hint: "Нэр, үнэ, нэг удаагийн эсвэл сарын төлбөр", view: "courses" },
  group: { title: "Бүлэг нээх", hint: "Курсийн бүлэг, багш, эхлэх/дуусах огноо", view: "classes" },
  schedule: {
    title: "Бүлгийн хуваарь тавих",
    hint: "Долоо хоногийн өдөр, цаг — хичээлүүд автоматаар үүснэ",
    view: "classes",
  },
  students: { title: "Сурагч бүртгэх", hint: "Нэг нэгээр эсвэл Excel-ээс импортлох", view: "students" },
  enrollment: {
    title: "Сурагчийг бүлэгт элсүүлэх",
    hint: "Элсүүлэхэд нэхэмжлэх автоматаар гарна",
    view: "students",
  },
  payment: { title: "Анхны төлбөрөө бүртгэх", hint: "Бэлэн, шилжүүлэг, карт; баримт хэвлэнэ", view: "finance" },
  attendance: {
    title: "Анхны хичээлийн ирц авах",
    hint: "Багш утаснаасаа эсвэл та бүлгийн хичээлээс",
    view: "classes",
  },
  app_access: {
    title: "Эцэг эх, сурагчдад апп нээх",
    hint: "Утсаар нэвтрэнэ — имэйл шаардлагагүй",
    view: "students",
  },
};

const hiddenKey = (schoolId: number) => `educonnect:onboarding-hidden:${schoolId}`;

function readHidden(schoolId: number): boolean {
  try {
    return localStorage.getItem(hiddenKey(schoolId)) === "1";
  } catch {
    return false;
  }
}

/**
 * Эхлүүлэх хөтөч: шинэ төвийн админд пилотын "амжилтын гинж"-ийн алхмуудыг дарааллаар нь
 * харуулна. Явцыг серверээс (бодит өгөгдлөөс) тооцдог; бүх заавал алхам дуусахад алга болно.
 */
export function OnboardingChecklist({
  schoolId,
  onNavigate,
}: {
  schoolId: number;
  onNavigate: (view: AdminView) => void;
}) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [hidden, setHidden] = useState(() => readHidden(schoolId));

  useEffect(() => {
    if (hidden) return;
    onboardingApi
      .progress()
      .then(setProgress)
      .catch(() => setProgress(null));
  }, [hidden]);

  if (hidden || !progress || progress.ready) return null;

  const next = progress.steps.find((s) => !s.done && !s.optional);
  const pct = Math.round((progress.completed / progress.total) * 100);

  function hide() {
    try {
      localStorage.setItem(hiddenKey(schoolId), "1");
    } catch {
      /* хувийн цонх г.м — зөвхөн энэ удаад нууна */
    }
    setHidden(true);
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Төвөө эхлүүлэх</h2>
              <p className="text-sm text-muted-foreground">
                {progress.completed}/{progress.total} алхам · бүгдийг хийснээр төвийн өдөр тутмын
                ажил системд бүрэн орно
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" title="Хөтчийг нуух" onClick={hide}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.completed}
          aria-label="Эхлүүлэх алхмуудын явц"
        >
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>

        <ol className="grid gap-1.5 sm:grid-cols-2">
          {progress.steps.map((s, i) => {
            const meta = STEPS[s.key];
            const isNext = next?.key === s.key;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => onNavigate(meta.view)}
                  className={`flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/60 ${
                    isNext ? "border-primary/50 bg-primary/5" : "border-transparent"
                  }`}
                >
                  {s.done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="Хийсэн" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-label="Хийгээгүй" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-medium ${
                        s.done ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {i + 1}. {meta.title}
                      {s.optional && <span className="font-normal text-muted-foreground"> (заавал биш)</span>}
                    </span>
                    {!s.done && <span className="block text-xs text-muted-foreground">{meta.hint}</span>}
                  </span>
                  {isNext && <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
