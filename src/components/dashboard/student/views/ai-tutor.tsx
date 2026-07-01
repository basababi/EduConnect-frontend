"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Brain,
  AlertTriangle,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import {
  curriculumApi,
  aiApi,
  type CurriculumUnit,
  type AiAssessment,
} from "@/lib/api";

type Stage = "select" | "loading" | "test" | "result";

const DIFF: Record<string, { label: string; cls: string }> = {
  easy: { label: "Хялбар", cls: "bg-green-100 text-green-700" },
  medium: { label: "Дунд", cls: "bg-amber-100 text-amber-700" },
  hard: { label: "Хүнд", cls: "bg-red-100 text-red-700" },
};

const LEVEL_BAR: Record<string, string> = {
  эзэмшсэн: "bg-green-500",
  хэсэгчилсэн: "bg-amber-500",
  эзэмшээгүй: "bg-red-500",
};

const COUNTS = [5, 8, 12, 15];

export function StudentAITutor() {
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [count, setCount] = useState(8);
  const [stage, setStage] = useState<Stage>("select");
  const [assessment, setAssessment] = useState<AiAssessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      curriculumApi.tree("math", 11).catch(() => [] as CurriculumUnit[]),
      aiApi.status().catch(() => ({ available: false })),
    ]).then(([u, s]) => {
      setUnits(u);
      setAiAvailable(s.available);
      setLoading(false);
    });
  }, []);

  function toggle(id: number) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else if (n.size < 6) n.add(id);
      else toast.error("Хамгийн ихдээ 6 сэдэв");
      return n;
    });
  }

  async function handleGenerate() {
    if (selected.size === 0) {
      toast.error("Дор хаяж нэг сэдэв сонго");
      return;
    }
    setStage("loading");
    try {
      const a = await aiApi.generate([...selected], count);
      setAssessment(a);
      setAnswers({});
      setStage("test");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Шалгалт үүсгэж чадсангүй");
      setStage("select");
    }
  }

  async function handleSubmit() {
    if (!assessment) return;
    const missing = assessment.questions.filter((q) => answers[q.id] === undefined);
    if (missing.length) {
      toast.error(`${missing.length} асуулт хариулаагүй байна`);
      return;
    }
    setSubmitting(true);
    try {
      const scored = await aiApi.submit(assessment.id, answers);
      setAssessment(scored);
      setStage("result");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Илгээж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStage("select");
    setAssessment(null);
    setAnswers({});
    setSelected(new Set());
  }

  // ── Толгой ──
  const header = (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Brain className="h-6 w-6" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-primary">Хичээлийн Дагуул</h1>
        <p className="text-sm text-muted-foreground">
          Математик 11 · Сэдэв сонгож мэдлэгээ шалгаарай
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {header}
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  // ═══════════ ҮР ДҮН ═══════════
  if (stage === "result" && assessment?.result) {
    const r = assessment.result;
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {header}

        {/* Оноо */}
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="text-sm text-muted-foreground">Нийт үнэлгээ</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">{r.percentage}%</span>
                <span className="rounded-lg bg-primary/10 px-3 py-1 text-xl font-bold text-primary">
                  {r.grade}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {r.correct}/{r.total} зөв хариулт
              </p>
            </div>
            <Button variant="outline" className="gap-2" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              Шинэ шалгалт
            </Button>
          </CardContent>
        </Card>

        {/* Дэд ур чадвар (эзэмшилт) */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <Target className="h-4 w-4 text-primary" />
              Сэдэв тус бүрийн эзэмшилт
            </p>
            {r.per_topic.map((t) => (
              <div key={t.topic_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{t.title}</span>
                  <span className="text-muted-foreground">
                    {t.correct}/{t.total} · {t.level}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${LEVEL_BAR[t.level] ?? "bg-primary"}`}
                    style={{ width: `${t.mastery}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Gap + зөвлөмж */}
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber" />
              Юун дээр анхаарах вэ
            </p>
            {r.gaps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {r.gaps.map((g) => (
                  <Badge key={g} className="bg-red-100 text-red-700" variant="secondary">
                    {g}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-green-700">Сул сэдэв алга — сайн байна! 🎉</p>
            )}
            <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
              {r.recommendations}
            </div>
          </CardContent>
        </Card>

        {/* Асуулт тус бүрийн шалгалт */}
        <div className="space-y-3">
          <p className="font-semibold text-foreground">Хариултын дэлгэрэнгүй</p>
          {assessment.questions.map((q, i) => {
            const picked = assessment.answers?.[q.id];
            const correct = picked === q.correct_index;
            return (
              <Card key={q.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start gap-2">
                    {correct ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    )}
                    <p className="text-sm font-medium text-foreground">
                      {i + 1}. {q.question}
                    </p>
                  </div>
                  <div className="ml-7 space-y-1">
                    {q.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`rounded-md px-2 py-1 text-sm ${
                          idx === q.correct_index
                            ? "bg-green-50 font-medium text-green-800"
                            : idx === picked
                              ? "bg-red-50 text-red-700 line-through"
                              : "text-muted-foreground"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}. {opt}
                      </div>
                    ))}
                    {q.explanation && (
                      <p className="pt-1 text-xs text-muted-foreground">
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ═══════════ ТЕСТ БӨГЛӨХ ═══════════
  if (stage === "test" && assessment) {
    const answered = Object.keys(answers).length;
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {header}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border bg-background/95 p-3 backdrop-blur">
          <span className="text-sm text-muted-foreground">
            {answered}/{assessment.questions.length} хариулсан
          </span>
          <Button
            variant="amber"
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-2"
          >
            {submitting ? "Үнэлж байна..." : "Дуусгах"}
          </Button>
        </div>

        {assessment.questions.map((q, i) => (
          <Card key={q.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">{q.topic_title}</span>
                <Badge className={`text-[10px] ${DIFF[q.difficulty]?.cls ?? ""}`} variant="secondary">
                  {DIFF[q.difficulty]?.label ?? q.difficulty}
                </Badge>
              </div>
              <p className="text-sm font-medium text-foreground">
                {i + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, idx) => {
                  const active = answers[q.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setAnswers((p) => ({ ...p, [q.id]: idx }))}
                      className={`flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors ${
                        active
                          ? "border-primary bg-primary/5 font-medium text-primary"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                          active ? "border-primary bg-primary text-primary-foreground" : ""
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="amber"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full gap-2"
        >
          {submitting ? "Үнэлж байна..." : "Шалгалт дуусгах"}
        </Button>
      </div>
    );
  }

  // ═══════════ АЧААЛЖ БАЙНА ═══════════
  if (stage === "loading") {
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {header}
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-20">
            <Sparkles className="h-10 w-10 animate-pulse text-primary" />
            <p className="text-sm font-medium text-foreground">
              AI шалгалт бэлдэж байна...
            </p>
            <p className="text-xs text-muted-foreground">
              Сонгосон сэдвүүдэд тохирсон асуулт зохиож байна (~10-20 секунд)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════ СЭДЭВ СОНГОХ ═══════════
  return (
    <div className="animate-in-rise space-y-6 p-6">
      {header}

      {!aiAvailable && (
        <div className="flex items-start gap-3 rounded-xl border border-amber/30 bg-amber/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
          <p className="text-sm text-foreground">
            AI одоогоор тохируулагдаагүй байна (GEMINI_API_KEY). Админтай холбогдоно уу.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-foreground">Шалгуулах сэдвээ сонго (1–6)</p>
            <span className="text-sm text-muted-foreground">{selected.size} сонгосон</span>
          </div>

          {units.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Хөтөлбөрийн сэдэв алга</p>
            </div>
          ) : (
            <div className="space-y-4">
              {units.map((u) => (
                <div key={u.id}>
                  <p className="mb-2 text-sm font-semibold text-foreground">{u.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {u.topics.map((t) => {
                      const on = selected.has(t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggle(t.id)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            on
                              ? "border-primary bg-primary text-primary-foreground"
                              : "bg-muted/40 text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {t.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Асуултын тоо:</span>
            <div className="flex gap-1.5">
              {COUNTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  className={`h-8 w-10 rounded-lg text-sm font-medium transition-colors ${
                    count === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <Button
            variant="amber"
            size="lg"
            className="gap-2"
            disabled={selected.size === 0 || !aiAvailable}
            onClick={handleGenerate}
          >
            <Sparkles className="h-4 w-4" />
            Шалгалт эхлүүлэх
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
