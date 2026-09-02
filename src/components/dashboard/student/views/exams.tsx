"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Award,
  Target,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ListChecks,
  Users,
  Medal,
} from "lucide-react";
import { toast } from "sonner";
import {
  examApi,
  type ExamListItem,
  type ExamTake,
  type ExamMyResult,
  type ExamLeaderboard,
} from "@/lib/api";
import { MathText } from "@/lib/math";

type Stage = "list" | "loading" | "taking" | "result" | "leaderboard";

const DIFF: Record<string, { label: string; cls: string }> = {
  easy: { label: "Хялбар", cls: "bg-emerald-50 text-emerald-700" },
  medium: { label: "Дунд", cls: "bg-amber-50 text-amber-700" },
  hard: { label: "Хүнд", cls: "bg-rose-50 text-rose-700" },
};

export function StudentExams() {
  const [stage, setStage] = useState<Stage>("loading");
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [exam, setExam] = useState<ExamTake | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamMyResult | null>(null);
  const [board, setBoard] = useState<ExamLeaderboard | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    examApi
      .list()
      .then((e) => {
        setExams(e);
        setStage("list");
      })
      .catch(() => setStage("list"));
  }, []);

  async function reloadList() {
    try {
      setExams(await examApi.list());
    } catch {
      /* үл ойшоох */
    }
  }

  async function startExam(id: number) {
    setStage("loading");
    try {
      const e = await examApi.take(id);
      setExam(e);
      setAnswers({});
      setActiveId(id);
      setStage("taking");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Эхлүүлж чадсангүй");
      setStage("list");
    }
  }

  async function submit() {
    if (!exam) return;
    const missing = exam.questions.filter((q) => answers[q.id] === undefined);
    if (missing.length) {
      toast.error(`${missing.length} асуулт хариулаагүй байна`);
      return;
    }
    setSubmitting(true);
    try {
      await examApi.submit(exam.id, answers);
      const full = await examApi.myResult(exam.id);
      setResult(full);
      setStage("result");
      reloadList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Илгээж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  async function viewResult(id: number) {
    setStage("loading");
    try {
      setResult(await examApi.myResult(id));
      setActiveId(id);
      setStage("result");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Дүн ачаалж чадсангүй");
      setStage("list");
    }
  }

  async function openLeaderboard(id: number) {
    setStage("loading");
    try {
      setBoard(await examApi.leaderboard(id));
      setActiveId(id);
      setStage("leaderboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Чансаа ачаалж чадсангүй");
      setStage("result");
    }
  }

  const header = (title: string, subtitle: string, onBack?: () => void) => (
    <div className="flex items-center gap-3">
      {onBack ? (
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Trophy className="h-6 w-6" />
        </div>
      )}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );

  // ─────────── ЖАГСААЛТ ───────────
  if (stage === "loading") {
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {header("Нийтийн шалгалт", "Ачаалж байна...")}
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (stage === "list") {
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {header("Нийтийн шалгалт", "Бүх сургуулийн сурагчидтай өрсөлдөж, чансаагаа хар")}
        {exams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <Trophy className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Одоогоор нээлттэй шалгалт алга. Удахгүй зарлагдана.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {exams.map((e) => (
              <Card key={e.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{e.title}</p>
                      {e.status !== "open" && (
                        <Badge variant="secondary" className="text-[10px]">
                          Хаагдсан
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {e.grade}-р анги · {e.question_count} асуулт
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.attempted ? (
                      <>
                        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">
                          {e.my_score}%
                        </span>
                        <Button variant="outline" size="sm" onClick={() => viewResult(e.id)}>
                          Дүн харах
                        </Button>
                      </>
                    ) : e.status === "open" ? (
                      <Button variant="amber" size="sm" onClick={() => startExam(e.id)}>
                        Эхлүүлэх
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => openLeaderboard(e.id)}>
                        Чансаа
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─────────── ӨГӨХ ───────────
  if (stage === "taking" && exam) {
    const answered = Object.keys(answers).length;
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {header(exam.title, "Бүх асуултад хариулаад дуусга")}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border bg-background/95 p-3 backdrop-blur">
          <span className="text-sm text-muted-foreground">
            {answered}/{exam.questions.length} хариулсан
          </span>
          <Button variant="amber" onClick={submit} disabled={submitting} className="gap-2">
            {submitting ? "Илгээж байна..." : "Дуусгах"}
          </Button>
        </div>

        {exam.questions.map((q, i) => (
          <Card key={q.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">{q.topic_title}</span>
                <Badge className={`text-[10px] ${DIFF[q.difficulty]?.cls ?? ""}`} variant="secondary">
                  {DIFF[q.difficulty]?.label ?? q.difficulty}
                </Badge>
              </div>
              <p className="text-sm font-medium text-foreground">
                {i + 1}. <MathText text={q.question} />
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
                      <MathText text={opt} />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="amber" size="lg" onClick={submit} disabled={submitting} className="w-full">
          {submitting ? "Илгээж байна..." : "Шалгалт дуусгах"}
        </Button>
      </div>
    );
  }

  // ─────────── ҮР ДҮН ───────────
  if (stage === "result" && result) {
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {header("Дүн", result.title, () => setStage("list"))}

        {/* Оноо + чансаа */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Нийт оноо</p>
              <p className="text-4xl font-bold text-primary">{result.score}%</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.correct}/{result.total} зөв
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Medal className="h-4 w-4 text-amber-500" />
                Чансаа
              </p>
              <p className="text-4xl font-bold text-primary">#{result.rank}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.totalParticipants} оролцогчоос
              </p>
            </CardContent>
          </Card>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => activeId && openLeaderboard(activeId)}
        >
          <Trophy className="h-4 w-4" />
          Бүх чансаа харах
        </Button>

        {/* Алдаа / сул сэдэв */}
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <Target className="h-4 w-4 text-primary" />
              Сэдэв тус бүрийн гүйцэтгэл
            </p>
            {result.per_topic.map((t) => {
              const pct = t.total ? Math.round((t.correct / t.total) * 100) : 0;
              return (
                <div key={t.topic_id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{t.title}</span>
                    <span className="text-muted-foreground">
                      {t.correct}/{t.total}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Хариултын дэлгэрэнгүй */}
        <div className="space-y-3">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <ListChecks className="h-4 w-4 text-primary" />
            Хариултын дэлгэрэнгүй
          </p>
          {result.review.map((q, i) => {
            const isCorrect = q.my_answer === q.correct_index;
            return (
              <Card key={q.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                    )}
                    <p className="text-sm font-medium text-foreground">
                      {i + 1}. <MathText text={q.question} />
                    </p>
                  </div>
                  <div className="ml-7 space-y-1">
                    {q.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`rounded-md px-2 py-1 text-sm ${
                          idx === q.correct_index
                            ? "bg-emerald-50 font-medium text-emerald-800"
                            : idx === q.my_answer
                              ? "bg-rose-50 text-rose-700 line-through"
                              : "text-muted-foreground"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}. <MathText text={opt} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ─────────── ЧАНСАА ───────────
  if (stage === "leaderboard" && board) {
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {header("Чансаа", board.title, () =>
          activeId ? viewResult(activeId) : setStage("list"),
        )}
        <Card>
          <CardContent className="p-0">
            {board.rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Users className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Оролцогч алга</p>
              </div>
            ) : (
              <div className="divide-y">
                {board.rows.map((r) => (
                  <div key={r.rank} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        r.rank === 1
                          ? "bg-amber-100 text-amber-700"
                          : r.rank === 2
                            ? "bg-slate-100 text-slate-600"
                            : r.rank === 3
                              ? "bg-orange-100 text-orange-700"
                              : "text-muted-foreground"
                      }`}
                    >
                      {r.rank <= 3 ? <Award className="h-4 w-4" /> : r.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.school}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{r.score}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
