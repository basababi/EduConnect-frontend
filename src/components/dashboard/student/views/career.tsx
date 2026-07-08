"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Sparkles,
  Compass,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  GraduationCap,
  Banknote,
  Eye,
  ChevronLeft,
  ChevronRight,
  Target,
  MessageSquareText,
  Send,
  Loader2,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import {
  careerApi,
  type CareerQuestionnaire,
  type CareerRecommendations,
  type CareerDiscover,
  type CareerItem,
  type RiasecVector,
  type CoachMessage,
} from "@/lib/api";

type Stage = "loading" | "intro" | "quiz" | "scoring" | "results";

const DIM_LABEL: Record<keyof RiasecVector, string> = {
  R: "Практик / Техник",
  I: "Судлаач",
  A: "Бүтээлч",
  S: "Нийгмийн / Туслах",
  E: "Санаачлагч / Удирдах",
  C: "Зохион байгуулалттай",
};

const PAGE_SIZE = 6;

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "өсөж") return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
  if (trend === "буурч") return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

const COACH_SUGGESTIONS = [
  "Миний дүнгээр ямар мэргэжил тохирох вэ?",
  "Юугаа сайжруулах хэрэгтэй вэ?",
  "Их сургуульд бэлдэхэд юунаас эхлэх вэ?",
];

/** Карьерын зөвлөхтэй чат — сурагчийн бодит дүн/профайлд тулгуурлана */
function CoachChat() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string = input) {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput("");
    const next: CoachMessage[] = [...messages, { role: "user", content: msg }];
    setMessages(next);
    setLoading(true);
    try {
      const { reply } = await careerApi.coach(next);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            e instanceof Error ? e.message : "Алдаа гарлаа. Дахин оролдоно уу.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-[62vh] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-2.5">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="mb-1 flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                <p className="text-sm font-semibold text-foreground">
                  Сайн уу! Би чиний карьерын зөвлөх.
                </p>
              </div>
              <p className="pl-6 text-xs text-muted-foreground">
                Чиний сонирхол, бодит хичээлийн дүнд тулгуурлан мэргэжил сонгох,
                юугаа сайжруулахад чинь тусална. Асуултаа бич.
              </p>
            </div>
            {COACH_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full rounded-xl border border-border bg-card px-4 py-2.5 text-left text-sm text-foreground transition hover:border-primary/30 hover:bg-muted/40"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm border border-border bg-muted/50 text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="rounded-2xl rounded-bl-sm border border-border bg-muted/50 px-4 py-3">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-card/60 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Асуултаа бич..."
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
            rows={1}
            disabled={loading}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Зөвлөх — чиглүүлэгч, шийдвэр биш. Бодит дүнд тулгуурлана.
        </p>
      </div>
    </div>
  );
}

export function StudentCareer() {
  const [stage, setStage] = useState<Stage>("loading");
  const [quiz, setQuiz] = useState<CareerQuestionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [page, setPage] = useState(0);
  const [recs, setRecs] = useState<CareerRecommendations | null>(null);
  const [discover, setDiscover] = useState<CareerDiscover | null>(null);
  const [detail, setDetail] = useState<CareerItem | null>(null);
  const [tab, setTab] = useState<"guide" | "coach">("guide");

  useEffect(() => {
    careerApi
      .profile()
      .then((p) => {
        if (p.has_profile) {
          loadResults();
        } else {
          setStage("intro");
        }
      })
      .catch(() => setStage("intro"));
  }, []);

  async function loadResults() {
    try {
      const [r, d] = await Promise.all([
        careerApi.recommendations(),
        careerApi.discover().catch(() => null),
      ]);
      setRecs(r);
      setDiscover(d);
      setStage("results");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ачаалж чадсангүй");
      setStage("intro");
    }
  }

  async function startQuiz() {
    setStage("loading");
    try {
      const q = await careerApi.questionnaire();
      setQuiz(q);
      setAnswers({});
      setPage(0);
      setStage("quiz");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Асуулга ачаалж чадсангүй");
      setStage("intro");
    }
  }

  async function submitQuiz() {
    if (!quiz) return;
    const missing = quiz.items.filter((it) => !answers[it.id]);
    if (missing.length > 0) {
      toast.error(`${missing.length} асуулт хариулаагүй байна`);
      return;
    }
    setStage("scoring");
    try {
      await careerApi.submit(answers);
      await loadResults();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Илгээж чадсангүй");
      setStage("quiz");
    }
  }

  const header = (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Briefcase className="h-6 w-6" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-primary">Карьер Зөвлөгөө</h1>
        <p className="text-sm text-muted-foreground">
          Сонирхол + бодит дүнд суурилсан мэргэжлийн чиг баримжаа
        </p>
      </div>
    </div>
  );

  // ═══════════ LOADING / SCORING ═══════════
  if (stage === "loading" || stage === "scoring") {
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {header}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-20">
            <Sparkles className="h-10 w-10 animate-pulse text-primary" />
            <p className="text-sm font-medium text-foreground">
              {stage === "scoring"
                ? "Профайл тооцож, тохирох чиглэлүүдийг олж байна..."
                : "Ачаалж байна..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════ INTRO ═══════════
  if (stage === "intro") {
    return (
      <div className="animate-in-rise space-y-6 p-6">
        {header}
        <Card>
          <CardContent className="space-y-5 p-8">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">
                Өөрт тохирох мэргэжлээ нээцгээе
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                36 асуулттай сонирхлын асуулга бөглөхөд <b>5–7 минут</b> зарцуулна.
                Систем таны хариултыг <b>бодит хичээлийн дүнтэй</b> хослуулан танд
                тохирох чиглэлүүдийг задаргаатай санал болгоно. Энэ бол шийдвэр биш —
                <b> чиг баримжаа</b>: сонголтоо өргөжүүлж, мэдээлэлтэй шийдвэр гаргахад
                чинь тусална.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Compass className="h-4 w-4 shrink-0 text-primary" />
                Сонирхлын 6 хэмжээст профайл (RIASEC загварт суурилсан)
              </li>
              <li className="flex items-center gap-2">
                <Target className="h-4 w-4 shrink-0 text-primary" />
                Тохирол = сонирхол 50% + бодит чадвар 35% + зах зээлийн эрэлт 15%
              </li>
              <li className="flex items-center gap-2">
                <Eye className="h-4 w-4 shrink-0 text-primary" />
                Танил бус гэхдээ эрэлттэй мэргэжлүүдийг нээж таниулна
              </li>
            </ul>
            <Button variant="amber" size="lg" className="gap-2" onClick={startQuiz}>
              <Sparkles className="h-4 w-4" />
              Асуулга эхлүүлэх
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════ QUIZ ═══════════
  if (stage === "quiz" && quiz) {
    const totalPages = Math.ceil(quiz.items.length / PAGE_SIZE);
    const pageItems = quiz.items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const answered = Object.keys(answers).length;
    const pageDone = pageItems.every((it) => answers[it.id]);

    return (
      <div className="animate-in-rise space-y-6 p-6">
        {header}
        <div className="sticky top-0 z-10 rounded-xl border bg-background/95 p-3 backdrop-blur">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Хуудас {page + 1}/{totalPages} · {answered}/{quiz.items.length} хариулсан
            </span>
            <span className="text-xs text-muted-foreground">
              Хэр их таалагдахаа сонго
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(answered / quiz.items.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          {pageItems.map((it, idx) => (
            <Card key={it.id}>
              <CardContent className="space-y-3 p-4">
                <p className="text-sm font-medium text-foreground">
                  {page * PAGE_SIZE + idx + 1}. {it.text}
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {quiz.likert.map((label, li) => {
                    const val = li + 1;
                    const on = answers[it.id] === val;
                    return (
                      <button
                        key={val}
                        onClick={() => setAnswers((a) => ({ ...a, [it.id]: val }))}
                        title={label}
                        className={`rounded-lg border px-1 py-2 text-[11px] font-medium transition-colors ${
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Өмнөх
          </Button>
          {page < totalPages - 1 ? (
            <Button
              variant="amber"
              className="gap-1.5"
              disabled={!pageDone}
              onClick={() => {
                setPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Дараах
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="amber"
              className="gap-1.5"
              disabled={answered < quiz.items.length}
              onClick={submitQuiz}
            >
              <Sparkles className="h-4 w-4" />
              Дуусгах
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ═══════════ RESULTS ═══════════
  if (stage === "results" && recs) {
    const dims = (Object.keys(DIM_LABEL) as (keyof RiasecVector)[])
      .map((d) => ({ d, v: Math.round((recs.riasec?.[d] ?? 0) * 100) }))
      .sort((a, b) => b.v - a.v);

    return (
      <div className="animate-in-rise space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {header}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={startQuiz}>
            <RotateCcw className="h-3.5 w-3.5" />
            Дахин бөглөх
          </Button>
        </div>

        {/* Таб сонголт */}
        <div className="flex gap-1 rounded-xl border bg-muted/40 p-1">
          <button
            onClick={() => setTab("guide")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === "guide"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Compass className="h-4 w-4" />
            Миний чиглэл
          </button>
          <button
            onClick={() => setTab("coach")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === "coach"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquareText className="h-4 w-4" />
            Зөвлөхтэй чатлах
          </button>
        </div>

        {tab === "coach" ? (
          <CoachChat />
        ) : (
        <div className="space-y-6">
        {/* Сонирхлын профайл */}
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <Compass className="h-4 w-4 text-primary" />
              Миний сонирхлын профайл
            </p>
            {dims.map(({ d, v }) => (
              <div key={d} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{DIM_LABEL[d]}</span>
                  <span className="text-muted-foreground">{v}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${v}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI narrative */}
        {recs.narrative && (
          <Card>
            <CardContent className="p-6">
              <p className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-amber" />
                Зөвлөхийн тайлбар
              </p>
              <p className="text-sm leading-relaxed text-foreground">{recs.narrative}</p>
            </CardContent>
          </Card>
        )}

        {/* Тохирох чиглэлүүд */}
        <div className="space-y-3">
          <p className="font-semibold text-foreground">
            Танд тохирох чиглэлүүд ({recs.items.length})
          </p>
          {recs.items.map((item) => (
            <Card
              key={item.career_id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setDetail(detail?.id === item.career.id ? null : item.career)}
            >
              <CardContent className="space-y-2.5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{item.career.name}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {item.career.category}
                    </Badge>
                    {item.career.is_lesser_known && (
                      <Badge className="bg-purple-100 text-[10px] text-purple-700" variant="secondary">
                        <Eye className="mr-1 h-3 w-3" />
                        Танил бус
                      </Badge>
                    )}
                  </div>
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">
                    {item.match}%
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Сонирхол {item.interest}%</span>
                  <span>Чадвар {item.academic}%</span>
                  <span className="inline-flex items-center gap-1">
                    Эрэлт {item.demand}% <TrendIcon trend={item.career.demand_trend} />
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.career.description}
                </p>

                {detail?.id === item.career.id && (
                  <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
                    {item.career.eyesh_subjects?.length ? (
                      <p className="flex flex-wrap items-center gap-1.5">
                        <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">ЭЕШ:</span>
                        {item.career.eyesh_subjects.map((e) => (
                          <Badge key={e.subject} variant="secondary" className="text-[10px]">
                            {e.subject} ~{e.min_score}
                          </Badge>
                        ))}
                      </p>
                    ) : null}
                    {item.career.salary_range && (
                      <p className="flex items-center gap-1.5 text-muted-foreground">
                        <Banknote className="h-4 w-4 shrink-0 text-green-600" />
                        Цалингийн муж: {item.career.salary_range}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/70">
                      Босго оноо, цалин нь ойролцоо баримжаа — жил бүр өөрчлөгдөнө.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Нээлт */}
        {discover?.week_pick && (
          <Card>
            <CardContent className="space-y-3 p-6">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <Eye className="h-4 w-4 text-purple-600" />
                Энэ 7 хоногийн мэргэжил
              </p>
              <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{discover.week_pick.name}</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {discover.week_pick.category}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    Эрэлт {discover.week_pick.demand_score}/10{" "}
                    <TrendIcon trend={discover.week_pick.demand_trend} />
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {discover.week_pick.description}
                </p>
              </div>
              {discover.suggestions.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Танд ойр байж болох өөр танил бус чиглэлүүд:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {discover.suggestions.map((c) => (
                      <Badge key={c.id} variant="secondary" className="text-xs">
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>
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
