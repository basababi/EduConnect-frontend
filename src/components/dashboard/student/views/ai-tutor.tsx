"use client";

import { useEffect, useRef, useState } from "react";
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
  ChevronDown,
  Check,
  GraduationCap,
  ArrowLeft,
  Lightbulb,
  History,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  curriculumApi,
  aiApi,
  type CurriculumUnit,
  type AiAssessment,
  type AiLesson,
  type PracticeResult,
  type AiProgress,
  type AssessmentHistoryItem,
} from "@/lib/api";
import { MathText } from "@/lib/math";

type Stage = "select" | "loading" | "test" | "result" | "lesson";

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

const COUNTS = [5, 8, 12, 15, 20, 25];

export function StudentAITutor() {
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [count, setCount] = useState(8);
  const [stage, setStage] = useState<Stage>("select");
  const [assessment, setAssessment] = useState<AiAssessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [submitting, setSubmitting] = useState(false);
  const pasteBlocked = useRef(0);
  const blurEvents = useRef(0);

  // Тест үед цонх/таб орхилтыг тэмдэглэх (soft integrity)
  useEffect(() => {
    if (stage !== "test") return;
    const onBlur = () => (blurEvents.current += 1);
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [stage]);

  const onPasteBlock = (e: React.ClipboardEvent) => {
    e.preventDefault();
    pasteBlocked.current += 1;
    toast.error("Хуулж тавихыг хориглосон — гараар бичнэ үү");
  };
  const prevent = (e: React.SyntheticEvent) => e.preventDefault();

  // ── F3 · Хичээл ──
  const [lesson, setLesson] = useState<AiLesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [practiceAns, setPracticeAns] = useState<Record<string, number>>({});
  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null);

  async function openLesson(topicId: number) {
    setStage("lesson");
    setLesson(null);
    setLessonLoading(true);
    setPracticeAns({});
    setPracticeResult(null);
    try {
      setLesson(await aiApi.lesson(topicId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Хичээл ачаалж чадсангүй");
      setStage("result");
    } finally {
      setLessonLoading(false);
    }
  }

  async function checkPractice() {
    if (!lesson) return;
    const missing = lesson.practice.filter((p) => practiceAns[p.id] === undefined);
    if (missing.length) {
      toast.error(`${missing.length} дадлага хариулаагүй байна`);
      return;
    }
    try {
      setPracticeResult(await aiApi.practiceCheck(lesson.topic_id, practiceAns));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Шалгаж чадсангүй");
    }
  }

  // ── F2 · Ахиц ба түүх ──
  const [progress, setProgress] = useState<AiProgress | null>(null);
  const [hist, setHist] = useState<AssessmentHistoryItem[]>([]);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    aiApi.progress().then(setProgress).catch(() => {});
    aiApi.history().then(setHist).catch(() => {});
  }, [stage === "select"]);

  async function openPast(id: number) {
    try {
      const a = await aiApi.getOne(id);
      if (a.status !== "scored") {
        toast.error("Дуусаагүй шалгалт");
        return;
      }
      setAssessment(a);
      setStage("result");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Нээж чадсангүй");
    }
  }

  useEffect(() => {
    Promise.all([
      curriculumApi.tree("math", 11).catch(() => [] as CurriculumUnit[]),
      aiApi.status().catch(() => ({ available: false })),
    ]).then(([u, s]) => {
      setUnits(u);
      if (u[0]) setExpanded(new Set([u[0].id]));
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
    const missing = assessment.questions.filter((q) => {
      const v = answers[q.id];
      if (q.type === "open") return typeof v !== "string" || !v.trim();
      return v === undefined;
    });
    if (missing.length) {
      toast.error(`${missing.length} асуулт хариулаагүй байна`);
      return;
    }
    setSubmitting(true);
    try {
      const scored = await aiApi.submit(assessment.id, answers, {
        paste_blocked: pasteBlocked.current,
        blur_events: blurEvents.current,
      });
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
              {r.needs_review_count > 0 && (
                <p className="text-xs text-amber-600">
                  ⏳ {r.needs_review_count} нээлттэй хариу багшийн шалгалт хүлээж байна
                </p>
              )}
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
                {t.mastery < 60 && (
                  <button
                    onClick={() => openLesson(t.topic_id)}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    Энэ сэдвийг үзэх
                  </button>
                )}
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
              <MathText text={r.recommendations} />
            </div>
          </CardContent>
        </Card>

        {/* Асуулт тус бүрийн шалгалт */}
        <div className="space-y-3">
          <p className="font-semibold text-foreground">Хариултын дэлгэрэнгүй</p>
          {assessment.questions.map((q, i) => {
            const ans = assessment.answers?.[q.id];
            const grade = assessment.open_grades?.[q.id];
            const isCorrect =
              q.type === "mcq"
                ? ans === q.correct_index
                : (grade?.score ?? 0) >= 0.6;
            return (
              <Card key={q.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    )}
                    <p className="text-sm font-medium text-foreground">
                      {i + 1}. <MathText text={q.question} />
                      {q.type === "open" && (
                        <span className="ml-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                          Бичих
                        </span>
                      )}
                    </p>
                  </div>

                  {q.type === "mcq" ? (
                    <div className="ml-7 space-y-1">
                      {(q.options ?? []).map((opt, idx) => (
                        <div
                          key={idx}
                          className={`rounded-md px-2 py-1 text-sm ${
                            idx === q.correct_index
                              ? "bg-green-50 font-medium text-green-800"
                              : idx === ans
                                ? "bg-red-50 text-red-700 line-through"
                                : "text-muted-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}. <MathText text={opt} />
                        </div>
                      ))}
                      {q.explanation && (
                        <p className="pt-1 text-xs text-muted-foreground">
                          💡 <MathText text={q.explanation} />
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="ml-7 space-y-2 text-sm">
                      <div className="rounded-md bg-muted/40 p-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Таны хариулт
                          {grade ? ` · ${Math.round(grade.score * 100)}%` : ""}:
                        </p>
                        <p className="whitespace-pre-wrap text-foreground">
                          <MathText text={typeof ans === "string" ? ans : "—"} />
                        </p>
                      </div>
                      {grade?.feedback && (
                        <p className="text-xs text-muted-foreground">
                          💬 <MathText text={grade.feedback} />
                        </p>
                      )}
                      {q.final_answer && (
                        <p className="text-xs text-green-700">
                          ✓ Зөв хариу: <MathText text={q.final_answer} />
                        </p>
                      )}
                      {grade?.needs_review && (
                        <p className="text-xs text-amber-600">
                          ⏳ Багшийн шалгалт хүлээж байна
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ═══════════ ХИЧЭЭЛ ═══════════
  if (stage === "lesson") {
    return (
      <div className="animate-in-rise space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => setStage("result")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Хичээл</h1>
            <p className="text-sm text-muted-foreground">Сул сэдвээ засаж бататга</p>
          </div>
        </div>

        {lessonLoading || !lesson ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-20">
              <Sparkles className="h-10 w-10 animate-pulse text-primary" />
              <p className="text-sm font-medium text-foreground">AI хичээл бэлдэж байна...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="space-y-3 p-6">
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <Lightbulb className="h-4 w-4 text-amber" /> Тайлбар
                </p>
                <div className="text-sm leading-relaxed text-foreground">
                  <MathText text={lesson.explanation} />
                </div>
                {lesson.key_points.length > 0 && (
                  <ul className="space-y-1 rounded-lg bg-muted/30 p-3 text-sm">
                    {lesson.key_points.map((k, i) => (
                      <li key={i} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span><MathText text={k} /></span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {lesson.worked_examples.length > 0 && (
              <Card>
                <CardContent className="space-y-4 p-6">
                  <p className="font-semibold text-foreground">Бодсон жишээ</p>
                  {lesson.worked_examples.map((ex, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <p className="text-sm font-medium text-foreground">
                        <MathText text={ex.problem} />
                      </p>
                      <ol className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {ex.solution_steps.map((s, j) => (
                          <li key={j} className="flex gap-2">
                            <span className="text-primary">{j + 1}.</span>
                            <span><MathText text={s} /></span>
                          </li>
                        ))}
                      </ol>
                      <p className="mt-2 text-sm font-medium text-green-700">
                        Хариу: <MathText text={ex.answer} />
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {lesson.practice.length > 0 && (
              <Card>
                <CardContent className="space-y-4 p-6">
                  <p className="font-semibold text-foreground">Дадлага</p>
                  {lesson.practice.map((p, i) => {
                    const res = practiceResult?.results.find((r) => r.id === p.id);
                    return (
                      <div key={p.id} className="space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          {i + 1}. <MathText text={p.question} />
                        </p>
                        <div className="space-y-1.5">
                          {p.options.map((opt, idx) => {
                            const picked = practiceAns[p.id] === idx;
                            let cls = "hover:bg-muted/50";
                            if (res) {
                              if (idx === res.correct_index)
                                cls = "bg-green-50 text-green-800";
                              else if (idx === res.picked)
                                cls = "bg-red-50 text-red-700 line-through";
                              else cls = "text-muted-foreground";
                            } else if (picked) {
                              cls = "border-primary bg-primary/5 text-primary";
                            }
                            return (
                              <button
                                key={idx}
                                disabled={!!practiceResult}
                                onClick={() =>
                                  setPracticeAns((a) => ({ ...a, [p.id]: idx }))
                                }
                                className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left text-sm transition-colors ${cls}`}
                              >
                                <span className="text-xs">
                                  {String.fromCharCode(65 + idx)}.
                                </span>
                                <MathText text={opt} />
                              </button>
                            );
                          })}
                        </div>
                        {res?.explanation && (
                          <p className="text-xs text-muted-foreground">
                            💡 <MathText text={res.explanation} />
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {practiceResult ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary/5 p-3">
                      <span className="text-sm font-medium text-primary">
                        Дадлага: {practiceResult.correct}/{practiceResult.total} (
                        {practiceResult.percentage}%)
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setStage("result")}>
                        Үр дүн рүү буцах
                      </Button>
                    </div>
                  ) : (
                    <Button variant="amber" className="w-full" onClick={checkPractice}>
                      Дадлага шалгах
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
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
                {q.type === "open" && (
                  <Badge className="bg-primary/10 text-[10px] text-primary" variant="secondary">
                    ✍ Бичих
                  </Badge>
                )}
                <Badge className={`text-[10px] ${DIFF[q.difficulty]?.cls ?? ""}`} variant="secondary">
                  {DIFF[q.difficulty]?.label ?? q.difficulty}
                </Badge>
              </div>
              <p className="text-sm font-medium text-foreground">
                {i + 1}. <MathText text={q.question} />
              </p>
              {q.type === "mcq" ? (
                <div className="space-y-2">
                  {(q.options ?? []).map((opt, idx) => {
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
                        <MathText text={opt} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1">
                  <textarea
                    value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                    onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                    onPaste={onPasteBlock}
                    onCopy={prevent}
                    onCut={prevent}
                    onDrop={prevent}
                    onContextMenu={prevent}
                    rows={4}
                    placeholder="Хариултаа гараар бич. Математикийг $x^2$ хэлбэрээр бичиж болно."
                    className="w-full resize-y rounded-lg border p-3 text-sm focus:border-primary focus:outline-none"
                  />
                  <p className="text-[11px] text-amber-600">
                    ✍ Гараар бич — хуулж тавихыг хориглосон.
                  </p>
                </div>
              )}
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

      {progress && progress.total_assessments > 0 && (
        <Card>
          <CardContent className="p-4">
            <button
              onClick={() => setShowProgress((v) => !v)}
              className="flex w-full items-center justify-between gap-2"
            >
              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                Миний ахиц ба түүх
                <span className="text-xs font-normal text-muted-foreground">
                  ({progress.total_assessments} шалгалт · дундаж {progress.avg_score}%)
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${showProgress ? "rotate-180" : ""}`}
              />
            </button>
            {showProgress && (
              <div className="mt-4 space-y-4">
                {progress.topics.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Сэдвийн эзэмшилт (сулаас нь)
                    </p>
                    {progress.topics.slice(0, 6).map((t) => (
                      <div key={t.topic_id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground">{t.title}</span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            {t.mastery}%
                            {t.trend > 0 && (
                              <span className="text-green-600">↑{t.trend}</span>
                            )}
                            {t.trend < 0 && (
                              <span className="text-red-600">↓{Math.abs(t.trend)}</span>
                            )}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${t.mastery >= 80 ? "bg-green-500" : t.mastery >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${t.mastery}%` }}
                          />
                        </div>
                        {t.mastery < 60 && (
                          <button
                            onClick={() => openLesson(t.topic_id)}
                            className="text-[11px] font-medium text-primary hover:underline"
                          >
                            → хичээл үзэх
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {hist.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <History className="h-3.5 w-3.5" /> Сүүлийн шалгалтууд
                    </p>
                    {hist.slice(0, 5).map((h) => (
                      <button
                        key={h.id}
                        onClick={() => h.status === "scored" && openPast(h.id)}
                        className="flex w-full items-center justify-between rounded-lg border p-2 text-left text-xs hover:bg-muted/50"
                      >
                        <span className="text-muted-foreground">
                          {new Date(h.created_at).toLocaleDateString("mn-MN")} ·{" "}
                          {h.question_count} асуулт
                        </span>
                        <span className="font-medium text-foreground">
                          {h.status === "scored" ? `${h.score}%` : "дуусаагүй"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
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
            <div className="space-y-2">
              {units.map((u) => {
                const isOpen = expanded.has(u.id);
                const selCount = u.topics.filter((t) => selected.has(t.id)).length;
                return (
                  <div key={u.id} className="overflow-hidden rounded-xl border">
                    <button
                      onClick={() =>
                        setExpanded((prev) => {
                          const n = new Set(prev);
                          if (n.has(u.id)) n.delete(u.id);
                          else n.add(u.id);
                          return n;
                        })
                      }
                      className="flex w-full items-center justify-between gap-2 bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <span className="text-sm font-semibold text-foreground">{u.title}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        {selCount > 0 && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                            {selCount}
                          </span>
                        )}
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="flex flex-wrap gap-2 p-3">
                        {u.topics.map((t) => {
                          const on = selected.has(t.id);
                          return (
                            <button
                              key={t.id}
                              onClick={() => toggle(t.id)}
                              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                                on
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "bg-background text-muted-foreground hover:bg-accent"
                              }`}
                            >
                              {on && <Check className="h-3 w-3" />}
                              {t.title}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Асуултын тоо
              <span className="block text-[11px] text-muted-foreground/70">
                +2–3 бичих асуулт
              </span>
            </span>
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
