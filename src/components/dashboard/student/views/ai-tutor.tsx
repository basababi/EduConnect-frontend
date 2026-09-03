"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Circle,
  Brain,
  AlertTriangle,
  Target,
  ChevronRight,
  ArrowLeft,
  Lightbulb,
  Check,
  GraduationCap,
  Clock,
  HelpCircle,
  PenLine,
  Lock,
  MessageSquare,
  BookOpenText,
  PlaySquare,
  Sigma,
  Atom,
  FlaskConical,
  Dna,
  Languages,
  Globe,
  Landmark,
  Users,
  BookText,
  Flame,
  Award,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  curriculumApi,
  aiApi,
  type CurriculumUnit,
  type CurriculumTopic,
  type CurriculumCatalogEntry,
  type AiAssessment,
  type AiLesson,
  type PracticeResult,
  type AiProgress,
  type AssessmentHistoryItem,
} from "@/lib/api";
import { MathText } from "@/lib/math";

// ─────────────── Тогтмолууд ───────────────
type Stage =
  | "catalog"
  | "subject"
  | "topic"
  | "loading"
  | "test"
  | "result"
  | "lesson";

const DIFF: Record<string, { label: string; cls: string }> = {
  easy: { label: "Хялбар", cls: "bg-emerald-50 text-emerald-700" },
  medium: { label: "Дунд", cls: "bg-amber-50 text-amber-700" },
  hard: { label: "Хүнд", cls: "bg-rose-50 text-rose-700" },
};

const GRADES = [5, 6, 7, 8, 9, 10, 11, 12];

// Хичээлийн жагсаалт — lucide шугаман icon, тансаг өнгөний өнгөлөг
const SUBJECTS: {
  key: string;
  label: string;
  icon: LucideIcon;
  tint: string;
}[] = [
  { key: "math", label: "Математик", icon: Sigma, tint: "bg-indigo-50 text-indigo-600" },
  { key: "physics", label: "Физик", icon: Atom, tint: "bg-sky-50 text-sky-600" },
  { key: "chemistry", label: "Хими", icon: FlaskConical, tint: "bg-teal-50 text-teal-600" },
  { key: "biology", label: "Биологи", icon: Dna, tint: "bg-emerald-50 text-emerald-600" },
  { key: "mongolian", label: "Монгол хэл", icon: BookText, tint: "bg-rose-50 text-rose-600" },
  { key: "english", label: "Англи хэл", icon: Languages, tint: "bg-amber-50 text-amber-600" },
  { key: "geography", label: "Газарзүй", icon: Globe, tint: "bg-cyan-50 text-cyan-600" },
  { key: "history", label: "Түүх", icon: Landmark, tint: "bg-orange-50 text-orange-600" },
  { key: "social", label: "Нийгэм", icon: Users, tint: "bg-violet-50 text-violet-600" },
];

// Текстийн (математик БУС) LaTeX-ийг цэвэрлэнэ. Математик орчны командыг хөндөхгүй.
const TEXT_ENVS =
  "center|flushleft|flushright|itemize|enumerate|figure|table|quote|sffamily|small|large|Large|huge|Huge|minipage|description|abstract";

function cleanText(s: string): string {
  return (
    s
      .replace(/<!--[\s\S]*?-->/g, "") // HTML коммент (х.N тэмдэглэл)
      .replace(/^[ \t]*%.*$/gm, "") // LaTeX коммент (зураг/sidebar тэмдэглэл)
      .replace(/%[ \t]*$/gm, "") // мөр төгсгөлийн % (line-continuation)
      .replace(
        /\\(fbox|framebox|colorbox|parbox|makebox|mbox)\s*(\[[^\]]*\])?\s*(\{[^{}]*\})?\s*\{?/g,
        "",
      ) // хайрцаг команд
      .replace(/\\(sub){0,2}section\*?\{([^}]*)\}/g, "\n$2\n") // гарчиг → текст
      .replace(
        /\\(textbf|textit|emph|underline|textsf|texttt|textrm|text)\{([^}]*)\}/g,
        "$2",
      )
      .replace(new RegExp(`\\\\begin\\{(?:${TEXT_ENVS})\\}(\\[[^\\]]*\\])?`, "g"), "\n")
      .replace(new RegExp(`\\\\end\\{(?:${TEXT_ENVS})\\}`, "g"), "\n")
      .replace(/\\begin\{tabular\}\{[^}]*\}/g, "\n")
      .replace(/\\end\{tabular\}/g, "\n")
      .replace(/\\hline/g, "")
      .replace(/\\item\s*/g, "\n• ")
      .replace(/&/g, "   ") // хүснэгтийн нүд (математик бус хэсэгт аюулгүй)
      .replace(/\\\\/g, "\n") // мөр таслал
      .replace(/\\includegraphics(\[[^\]]*\])?\{[^}]*\}/g, "")
      .replace(
        /\\(noindent|vspace\*?|hspace\*?|hfill|vfill|raggedright|raggedleft|newpage|clearpage|smallskip|medskip|bigskip|centering|par|dotfill|maketitle|tableofcontents)\b(\{[^}]*\}|\[[^\]]*\])?/g,
        "",
      )
      .replace(/\\(put|rotatebox|setlength|renewcommand)\s*(\([^)]*\))?\s*(\{[^}]*\})?\s*(\{[^}]*\})?/g, "")
      .replace(/^[ \t]*[{}]+[ \t]*$/gm, "") // зөвхөн хаалттай мөр
      .replace(/[ \t]{2,}/g, " ")
  );
}

/**
 * Сурах бичгийн түүхий LaTeX-ийг уншихад ойлгомжтой болгоно.
 * Математик хэсгийг ($...$, $$...$$, \[...\], \(...\)) ХЭВЭЭР үлдээж, зөвхөн текстийг
 * цэвэрлэнэ → KaTeX математикийг зөв рендэрлэнэ.
 */
function cleanContent(raw: string): string {
  const mathRe =
    /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;
  const parts = raw.split(mathRe);
  return parts
    .map((p, i) => (i % 2 === 1 ? p : cleanText(p)))
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function StudentAITutor() {
  // ── Каталог / навигаци ──
  const [catalog, setCatalog] = useState<CurriculumCatalogEntry[]>([]);
  const [grade, setGrade] = useState(11);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [activeTopic, setActiveTopic] = useState<CurriculumTopic | null>(null);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [topicLoading, setTopicLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [stage, setStage] = useState<Stage>("catalog");

  // ── Шалгалт ──
  const [assessment, setAssessment] = useState<AiAssessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [explains, setExplains] = useState<Record<string, string>>({});
  const [whyLoading, setWhyLoading] = useState<string | null>(null);
  // ── P1 · Шатласан сэжүүр (дасгал бодох үед — хариу биш) ──
  const [hints, setHints] = useState<Record<string, string[]>>({});
  const [hintLoading, setHintLoading] = useState<string | null>(null);

  // ── Шударга байдал (F7) ──
  const pasteBlocked = useRef(0);
  const blurEvents = useRef(0);
  useEffect(() => {
    const onBlur = () => (blurEvents.current += 1);
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);
  const onPasteBlock = (e: React.ClipboardEvent) => {
    e.preventDefault();
    pasteBlocked.current += 1;
    toast.error("Хариултаа гараар бичнэ үү");
  };
  const prevent = (e: React.SyntheticEvent) => e.preventDefault();

  // ── Хичээл (F3) ──
  const [lesson, setLesson] = useState<AiLesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [practiceAns, setPracticeAns] = useState<Record<string, number>>({});
  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null);

  // ── Ахиц ба түүх (F2) ──
  const [progress, setProgress] = useState<AiProgress | null>(null);
  const [hist, setHist] = useState<AssessmentHistoryItem[]>([]);

  const masteryByTopic = useMemo(() => {
    const m = new Map<number, number>();
    for (const t of progress?.topics ?? []) m.set(t.topic_id, t.mastery);
    return m;
  }, [progress]);

  // ── Эхний ачаалал: каталог + AI төлөв + ахиц ──
  useEffect(() => {
    Promise.all([
      curriculumApi.catalog().catch(() => [] as CurriculumCatalogEntry[]),
      aiApi.status().catch(() => ({ available: false })),
    ]).then(([cat, s]) => {
      setCatalog(cat);
      setAiAvailable(s.available);
      setLoading(false);
    });
    aiApi.progress().then(setProgress).catch(() => {});
    aiApi.history().then(setHist).catch(() => {});
  }, []);

  function refreshProgress() {
    aiApi.progress().then(setProgress).catch(() => {});
    aiApi.history().then(setHist).catch(() => {});
  }

  // ── Навигаци ──
  async function openSubject(subjectKey: string, g: number) {
    setActiveSubject(subjectKey);
    setSubjectLoading(true);
    setStage("subject");
    try {
      setUnits(await curriculumApi.tree(subjectKey, g));
    } catch {
      setUnits([]);
    } finally {
      setSubjectLoading(false);
    }
  }

  async function openTopic(topicId: number) {
    setTopicLoading(true);
    setStage("topic");
    try {
      setActiveTopic(await curriculumApi.topic(topicId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Сэдэв ачаалж чадсангүй");
      setStage("subject");
    } finally {
      setTopicLoading(false);
    }
  }

  // ── Дасгал (шалгалт) ──
  async function startPractice(topicIds: number[]) {
    if (topicIds.length === 0) return;
    if (!aiAvailable) {
      toast.error("AI одоогоор идэвхгүй байна");
      return;
    }
    const back = stage;
    setStage("loading");
    try {
      const a = await aiApi.generate(topicIds.slice(0, 6), 8, undefined, "auto");
      setAssessment(a);
      setAnswers({});
      setExplains({});
      setHints({});
      setStage("test");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Дасгал үүсгэж чадсангүй");
      setStage(back);
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
      refreshProgress();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Илгээж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Хичээл (AI) ──
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
      setStage(activeTopic ? "topic" : "subject");
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

  async function askWhy(qId: string) {
    if (!assessment || explains[qId]) return;
    setWhyLoading(qId);
    try {
      const r = await aiApi.explain(assessment.id, qId);
      setExplains((e) => ({ ...e, [qId]: r.explanation }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Тайлбар авч чадсангүй");
    } finally {
      setWhyLoading(null);
    }
  }

  /** P1 · Дараагийн түвшний сэжүүр авах (1→2→3, хариу гардаггүй) */
  async function requestHint(qId: string) {
    if (!assessment) return;
    const current = hints[qId] ?? [];
    const nextLevel = current.length + 1;
    if (nextLevel > 3 || hintLoading) return;
    setHintLoading(qId);
    try {
      const r = await aiApi.hint(assessment.id, qId, nextLevel);
      setHints((h) => ({ ...h, [qId]: [...current, r.hint] }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Сэжүүр авч чадсангүй");
    } finally {
      setHintLoading(null);
    }
  }

  function backToCatalog() {
    setStage("catalog");
    setActiveSubject(null);
    setActiveTopic(null);
    setAssessment(null);
    setAnswers({});
    setHints({});
  }

  // ─────────────── ЕРӨНХИЙ ТОЛГОЙ ───────────────
  const pageHeader = (title: string, subtitle: string, onBack?: () => void) => (
    <div className="flex items-center gap-3">
      {onBack ? (
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Brain className="h-6 w-6" />
        </div>
      )}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );

  const subjectMeta = (key: string) =>
    SUBJECTS.find((s) => s.key === key) ?? SUBJECTS[0];

  // ─────────────── ACHAALЖ БАЙНА ───────────────
  if (loading) {
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {pageHeader("Хичээлийн Дагуул", "Ачаалж байна...")}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // ① КАТАЛОГ — хичээл сонгох
  // ═══════════════════════════════════════════════════════
  if (stage === "catalog") {
    const gradeCounts = (subjectKey: string) =>
      catalog
        .find((c) => c.subject === subjectKey)
        ?.grades.find((g) => g.grade === grade) ?? null;

    return (
      <div className="animate-in-rise space-y-6 p-6">
        {pageHeader("Хичээлийн Дагуул", "Хичээлээ сонгож, сэдэв сэдвээр нь суралцаарай")}

        {!aiAvailable && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              AI туслах одоогоор идэвхгүй байна. Сэдэв, хичээлийг үзэж болно; дасгал үүсгэхэд
              админ AI-г тохируулах шаардлагатай.
            </p>
          </div>
        )}

        {/* Ахицын тойм */}
        {progress && progress.total_assessments > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              Дундаж {progress.avg_score}%
            </span>
            {progress.streak > 1 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm">
                <Flame className="h-4 w-4 text-amber-500" />
                {progress.streak} өдөр дараалан
              </span>
            )}
            {progress.mastered > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm">
                <Award className="h-4 w-4 text-emerald-600" />
                {progress.mastered} сэдэв эзэмшсэн
              </span>
            )}
          </div>
        )}

        {/* Анги сонголт */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Анги:</span>
          {GRADES.map((g) => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                grade === g
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Хичээлийн grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {SUBJECTS.map((s) => {
            const Icon = s.icon;
            const counts = gradeCounts(s.key);
            const available = !!counts && counts.topics > 0;
            return (
              <button
                key={s.key}
                disabled={!available}
                onClick={() => available && openSubject(s.key, grade)}
                className={`group flex flex-col items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all ${
                  available
                    ? "hover:border-primary/30 hover:shadow-md"
                    : "cursor-not-allowed opacity-55"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.tint}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{s.label}</p>
                  {available ? (
                    <p className="text-xs text-muted-foreground">
                      {grade}-р анги · {counts!.topics} сэдэв
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/70">Удахгүй</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // ② ХИЧЭЭЛ — сэдвүүд (номын гарчиг)
  // ═══════════════════════════════════════════════════════
  if (stage === "subject") {
    const meta = subjectMeta(activeSubject ?? "math");
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {pageHeader(`${meta.label} · ${grade}-р анги`, "Бүлэг → сэдвээ сонгоно уу", backToCatalog)}

        {subjectLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : units.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <BookOpenText className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Энэ ангид сэдэв бэлдэгдээгүй байна</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {units.map((u) => (
              <div key={u.id}>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">{u.title}</h2>
                  <span className="text-xs text-muted-foreground">
                    {u.topics.length} сэдэв
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border bg-card">
                  {u.topics.map((t, idx) => {
                    const mastery = masteryByTopic.get(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => openTopic(t.id)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${
                          idx > 0 ? "border-t" : ""
                        }`}
                      >
                        <span className="shrink-0">
                          {mastery === undefined ? (
                            <Circle className="h-4 w-4 text-muted-foreground/40" />
                          ) : mastery >= 80 ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <span className="text-xs font-semibold text-amber-600">
                              {mastery}%
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                          {t.title}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // ③ СЭДЭВ — дэлгэрэнгүй
  // ═══════════════════════════════════════════════════════
  if (stage === "topic") {
    const meta = subjectMeta(activeSubject ?? "math");
    const t = activeTopic;
    const mastery = t ? masteryByTopic.get(t.id) : undefined;
    const cleaned = t?.content ? cleanContent(t.content) : "";

    return (
      <div className="animate-in-rise space-y-6 p-6">
        {pageHeader(meta.label, `${grade}-р анги`, () => setStage("subject"))}

        {topicLoading || !t ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : (
          <>
            {/* Гарчиг + эзэмшилт */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    className={`text-[10px] ${DIFF[t.difficulty]?.cls ?? ""}`}
                    variant="secondary"
                  >
                    {DIFF[t.difficulty]?.label ?? t.difficulty}
                  </Badge>
                  {mastery !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      Эзэмшилт {mastery}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Видео зай (удахгүй) */}
            <div className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/20 px-5 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <PlaySquare className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Видео хичээл</p>
                <p className="text-xs text-muted-foreground">Удахгүй нэмэгдэнэ</p>
              </div>
            </div>

            {/* Суралцахуйн зорилт / гол ойлголт / томьёо (байвал) */}
            {(t.learning_objectives?.length ||
              t.key_concepts?.length ||
              t.formulas?.length) && (
              <Card>
                <CardContent className="space-y-4 p-6">
                  {t.learning_objectives && t.learning_objectives.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Target className="h-4 w-4 text-primary" />
                        Суралцахуйн зорилт
                      </p>
                      <ul className="space-y-1.5">
                        {t.learning_objectives.map((o, i) => (
                          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            <span>
                              <MathText text={o} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {t.key_concepts && t.key_concepts.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-foreground">
                        Гол ойлголт
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {t.key_concepts.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {t.formulas && t.formulas.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-foreground">Томьёо</p>
                      <div className="space-y-2">
                        {t.formulas.map((f, i) => (
                          <div key={i} className="rounded-lg border bg-muted/20 p-3">
                            <MathText text={`$${f.latex}$`} />
                            {f.description && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {f.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Сурах бичгийн агуулга */}
            {cleaned && (
              <Card>
                <CardContent className="space-y-2 p-6">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <BookOpenText className="h-4 w-4 text-primary" />
                    Сурах бичгийн агуулга
                  </p>
                  <div className="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    <MathText text={cleaned.slice(0, 4000)} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Гол үйлдэл */}
            <div className="sticky bottom-4 flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm sm:flex-row">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 gap-2"
                onClick={() => openLesson(t.id)}
              >
                <GraduationCap className="h-4 w-4" />
                Хичээл унших
              </Button>
              <Button
                variant="amber"
                size="lg"
                className="flex-1 gap-2"
                disabled={!aiAvailable}
                onClick={() => startPractice([t.id])}
              >
                <PenLine className="h-4 w-4" />
                Дасгал ажиллах
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // АЧААЛЖ БАЙНА (дасгал үүсгэх)
  // ═══════════════════════════════════════════════════════
  if (stage === "loading") {
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {pageHeader("Дасгал бэлдэж байна", "Хэдхэн хормын дараа...")}
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-20">
            <Sparkles className="h-10 w-10 animate-pulse text-primary" />
            <p className="text-sm font-medium text-foreground">Дасгал бэлдэж байна...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // ДАСГАЛ БӨГЛӨХ
  // ═══════════════════════════════════════════════════════
  if (stage === "test" && assessment) {
    const answered = Object.keys(answers).length;
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {pageHeader("Дасгал", "Хариултаа бөглөнө үү")}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border bg-background/95 p-3 backdrop-blur">
          <span className="text-sm text-muted-foreground">
            {answered}/{assessment.questions.length} хариулсан
          </span>
          <Button variant="amber" onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? "Үнэлж байна..." : "Дуусгах"}
          </Button>
        </div>

        {assessment.questions.map((q, i) => (
          <Card key={q.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">{q.topic_title}</span>
                {q.type === "open" && (
                  <Badge
                    className="inline-flex items-center gap-1 bg-primary/10 text-[10px] text-primary"
                    variant="secondary"
                  >
                    <PenLine className="h-3 w-3" />
                    Бичих
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
                  <p className="inline-flex items-center gap-1 text-[11px] text-amber-600">
                    <Lock className="h-3 w-3" />
                    Гараар бич — хуулж тавих хориотой.
                  </p>
                </div>
              )}

              {/* P1 · Шатласан сэжүүр — хариу өгөхгүй, өөрөө бодоход тусална */}
              <div className="space-y-2 border-t border-dashed pt-3">
                {(hints[q.id] ?? []).map((h, hi) => (
                  <div
                    key={hi}
                    className="flex gap-2 rounded-lg bg-amber-50 p-2.5 text-sm text-amber-900"
                  >
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div>
                      <span className="mr-1 text-xs font-semibold text-amber-600">
                        Сэжүүр {hi + 1}:
                      </span>
                      <MathText text={h} />
                    </div>
                  </div>
                ))}
                {(hints[q.id]?.length ?? 0) < 3 ? (
                  <button
                    onClick={() => requestHint(q.id)}
                    disabled={hintLoading === q.id}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 disabled:opacity-50"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    {hintLoading === q.id
                      ? "Сэжүүр бэлдэж байна..."
                      : (hints[q.id]?.length ?? 0) === 0
                        ? "Сэжүүр авах (хариу өгөхгүй)"
                        : `Дараагийн сэжүүр (${(hints[q.id]?.length ?? 0) + 1}/3)`}
                  </button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Бүх сэжүүр дууслаа — одоо өөрөө бодоод үзээрэй.
                  </p>
                )}
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
          {submitting ? "Үнэлж байна..." : "Дасгал дуусгах"}
        </Button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // ҮР ДҮН
  // ═══════════════════════════════════════════════════════
  if (stage === "result" && assessment?.result) {
    const r = assessment.result;
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {pageHeader("Дүн", "Хийсэн ажлын үнэлгээ", () =>
          setStage(activeTopic ? "topic" : "catalog"),
        )}

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
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600">
                  <Clock className="h-3 w-3" />
                  {r.needs_review_count} нээлттэй хариу багшийн шалгалт хүлээж байна
                </p>
              )}
            </div>
            <Button variant="outline" className="gap-2" onClick={backToCatalog}>
              <BookOpenText className="h-4 w-4" />
              Хичээл рүү
            </Button>
          </CardContent>
        </Card>

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
                    className={`h-full rounded-full ${
                      t.mastery >= 80
                        ? "bg-emerald-500"
                        : t.mastery >= 50
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
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

        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber" />
              Юун дээр анхаарах вэ
            </p>
            {r.gaps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {r.gaps.map((g) => (
                  <Badge key={g} className="bg-rose-50 text-rose-700" variant="secondary">
                    {g}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-700">Сул сэдэв алга — сайн байна.</p>
            )}
            <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
              <MathText text={r.recommendations} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="font-semibold text-foreground">Хариултын дэлгэрэнгүй</p>
          {assessment.questions.map((q, i) => {
            const ans = assessment.answers?.[q.id];
            const grade = assessment.open_grades?.[q.id];
            const isCorrect =
              q.type === "mcq" ? ans === q.correct_index : (grade?.score ?? 0) >= 0.6;
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
                              ? "bg-emerald-50 font-medium text-emerald-800"
                              : idx === ans
                                ? "bg-rose-50 text-rose-700 line-through"
                                : "text-muted-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}. <MathText text={opt} />
                        </div>
                      ))}
                      {q.explanation && (
                        <p className="flex items-start gap-1 pt-1 text-xs text-muted-foreground">
                          <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                          <span>
                            <MathText text={q.explanation} />
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="ml-7 space-y-2 text-sm">
                      <div className="rounded-md bg-muted/40 p-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Таны хариулт{grade ? ` · ${Math.round(grade.score * 100)}%` : ""}:
                        </p>
                        <p className="whitespace-pre-wrap text-foreground">
                          <MathText text={typeof ans === "string" ? ans : "—"} />
                        </p>
                      </div>
                      {grade?.feedback && (
                        <p className="flex items-start gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
                          <span>
                            <MathText text={grade.feedback} />
                          </span>
                        </p>
                      )}
                      {q.final_answer && (
                        <p className="flex items-center gap-1 text-xs text-emerald-700">
                          <Check className="h-3 w-3 shrink-0" />
                          <span>
                            Зөв хариу: <MathText text={q.final_answer} />
                          </span>
                        </p>
                      )}
                      {grade?.needs_review && (
                        <p className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <Clock className="h-3 w-3" />
                          Багшийн шалгалт хүлээж байна
                        </p>
                      )}
                    </div>
                  )}

                  <div className="ml-7">
                    {explains[q.id] ? (
                      <div className="rounded-lg bg-sky-50 p-2.5 text-xs leading-relaxed text-foreground">
                        <p className="mb-1 flex items-center gap-1 font-medium text-sky-700">
                          <HelpCircle className="h-3.5 w-3.5" />
                          Дэлгэрэнгүй тайлбар
                        </p>
                        <MathText text={explains[q.id]} />
                      </div>
                    ) : (
                      <button
                        onClick={() => askWhy(q.id)}
                        disabled={whyLoading === q.id}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        {whyLoading === q.id ? "Тайлбарлаж байна..." : "Яагаад? Дэлгэрэнгүй тайлбар"}
                      </button>
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

  // ═══════════════════════════════════════════════════════
  // ХИЧЭЭЛ (AI)
  // ═══════════════════════════════════════════════════════
  if (stage === "lesson") {
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {pageHeader("Хичээл", "Сул сэдвээ засаж бататга", () =>
          setStage(assessment?.result ? "result" : activeTopic ? "topic" : "subject"),
        )}

        {lessonLoading || !lesson ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-20">
              <Sparkles className="h-10 w-10 animate-pulse text-primary" />
              <p className="text-sm font-medium text-foreground">Хичээл бэлдэж байна...</p>
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
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                          <MathText text={k} />
                        </span>
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
                            <span>
                              <MathText text={s} />
                            </span>
                          </li>
                        ))}
                      </ol>
                      <p className="mt-2 text-sm font-medium text-emerald-700">
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
                              if (idx === res.correct_index) cls = "bg-emerald-50 text-emerald-800";
                              else if (idx === res.picked) cls = "bg-rose-50 text-rose-700 line-through";
                              else cls = "text-muted-foreground";
                            } else if (picked) {
                              cls = "border-primary bg-primary/5 text-primary";
                            }
                            return (
                              <button
                                key={idx}
                                disabled={!!practiceResult}
                                onClick={() => setPracticeAns((a) => ({ ...a, [p.id]: idx }))}
                                className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left text-sm transition-colors ${cls}`}
                              >
                                <span className="text-xs">{String.fromCharCode(65 + idx)}.</span>
                                <MathText text={opt} />
                              </button>
                            );
                          })}
                        </div>
                        {res?.explanation && (
                          <p className="flex items-start gap-1 text-xs text-muted-foreground">
                            <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                            <span>
                              <MathText text={res.explanation} />
                            </span>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setStage(activeTopic ? "topic" : assessment?.result ? "result" : "subject")
                        }
                      >
                        Буцах
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

  return (
    <div className="p-6">
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
