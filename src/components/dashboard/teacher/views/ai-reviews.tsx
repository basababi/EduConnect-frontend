"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardCheck,
  CheckCircle2,
  Database,
  BarChart3,
  Check,
  X,
  AlertTriangle,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import {
  aiApi,
  aiTeacherApi,
  classesApi,
  type ReviewItem,
  type BankQuestion,
  type BankStats,
  type ClassGaps,
  type ClassRoom,
} from "@/lib/api";
import { MathText } from "@/lib/math";

const SCORES = [
  { v: 0, label: "Буруу (0%)", cls: "bg-red-500" },
  { v: 0.5, label: "Хагас (50%)", cls: "bg-amber-500" },
  { v: 1, label: "Зөв (100%)", cls: "bg-green-500" },
];

export function TeacherAiReviews() {
  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ClipboardCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary">AI шалгалт</h1>
          <p className="text-sm text-muted-foreground">
            Хариу засах · асуултын нөөц · ангийн дүн шинжилгээ
          </p>
        </div>
      </div>

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">Гар засвар</TabsTrigger>
          <TabsTrigger value="bank">Асуултын нөөц</TabsTrigger>
          <TabsTrigger value="class">Ангийн дүн шинжилгээ</TabsTrigger>
        </TabsList>
        <TabsContent value="reviews">
          <ReviewsTab />
        </TabsContent>
        <TabsContent value="bank">
          <BankTab />
        </TabsContent>
        <TabsContent value="class">
          <ClassTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────── ГАР ЗАСВАР ───────────────
function ReviewsTab() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    aiApi
      .reviews()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const keyOf = (it: ReviewItem) => `${it.assessment_id}-${it.question_id}`;

  async function save(it: ReviewItem, score: number) {
    const k = keyOf(it);
    setSaving(k);
    try {
      await aiApi.overrideReview(it.assessment_id, it.question_id, score, feedback[k]);
      toast.success("Оноо шинэчлэгдлээ");
      setItems((p) => p.filter((x) => keyOf(x) !== k));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Хадгалж чадсангүй");
    } finally {
      setSaving(null);
    }
  }

  if (loading)
    return (
      <div className="space-y-3 pt-4">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );

  if (items.length === 0)
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center gap-2 py-16">
          <CheckCircle2 className="h-10 w-10 text-green-500/50" />
          <p className="text-sm font-medium text-foreground">Шалгах хариулт алга</p>
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-4 pt-4">
      {items.map((it) => {
        const k = keyOf(it);
        return (
          <Card key={k}>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                  {it.topic_title}
                </span>
                <span>Сурагч #{it.student_id}</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                <MathText text={it.question} />
              </p>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Сурагчийн хариулт:
                </p>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  <MathText text={it.student_answer || "—"} />
                </p>
              </div>
              {it.correct_answer && (
                <p className="flex items-center gap-1 text-xs text-green-700">
                  <Check className="h-3 w-3 shrink-0" />
                  <span>
                    Зөв хариу: <MathText text={it.correct_answer} />
                  </span>
                </p>
              )}
              <div className="flex items-start gap-1.5 rounded-lg border border-amber/30 bg-amber/5 p-2 text-xs text-muted-foreground">
                <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>
                  AI санал: {Math.round(it.ai_score * 100)}% —{" "}
                  <MathText text={it.ai_feedback} />
                </span>
              </div>
              <Input
                value={feedback[k] ?? ""}
                onChange={(e) => setFeedback((f) => ({ ...f, [k]: e.target.value }))}
                placeholder="Нэмэлт тайлбар (заавал биш)"
                className="text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {SCORES.map((s) => (
                  <Button
                    key={s.v}
                    variant="outline"
                    size="sm"
                    disabled={saving === k}
                    onClick={() => save(it, s.v)}
                    className="gap-1.5"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${s.cls}`} />
                    {s.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────── АСУУЛТЫН НӨӨЦ ───────────────
const STATUSES = [
  { v: "draft", label: "Хүлээгдэж буй" },
  { v: "approved", label: "Батлагдсан" },
  { v: "rejected", label: "Цуцлагдсан" },
];

function BankTab() {
  const [status, setStatus] = useState("draft");
  const [items, setItems] = useState<BankQuestion[]>([]);
  const [stats, setStats] = useState<BankStats | null>(null);
  const [loading, setLoading] = useState(true);

  function load(s: string) {
    setLoading(true);
    aiTeacherApi
      .bankList({ status: s })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(status);
    aiTeacherApi.bankStats().then(setStats).catch(() => {});
  }, [status]);

  async function review(id: number, action: "approve" | "reject") {
    try {
      await aiTeacherApi.bankReview(id, action);
      toast.success(action === "approve" ? "Батлагдлаа" : "Цуцлагдлаа");
      setItems((p) => p.filter((x) => x.id !== id));
      aiTeacherApi.bankStats().then(setStats).catch(() => {});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Амжилтгүй");
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Database className="h-4 w-4 text-primary" />
        {stats && (
          <span className="text-xs text-muted-foreground">
            {stats.draft} хүлээгдэж · {stats.approved} батлагдсан ·{" "}
            {stats.rejected} цуцлагдсан
          </span>
        )}
        <div className="ml-auto flex gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s.v}
              onClick={() => setStatus(s.v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                status === s.v
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Асуулт алга
          </CardContent>
        </Card>
      ) : (
        items.map((q) => (
          <Card key={q.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">{q.topic_title}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {q.type === "open" ? "Нээлттэй" : "Сонголттой"}
                </Badge>
                <span>{q.difficulty}</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                <MathText text={q.question} />
              </p>
              {q.type === "mcq" ? (
                <div className="space-y-0.5">
                  {(q.options ?? []).map((o, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1 text-sm ${idx === q.correct_index ? "font-medium text-green-700" : "text-muted-foreground"}`}
                    >
                      <span>
                        {String.fromCharCode(65 + idx)}. <MathText text={o} />
                      </span>
                      {idx === q.correct_index && <Check className="h-3.5 w-3.5" />}
                    </div>
                  ))}
                </div>
              ) : (
                q.rubric && (
                  <p className="text-xs text-green-700">
                    Зөв хариу: <MathText text={q.rubric.final_answer} />
                  </p>
                )
              )}
              {status === "draft" && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-green-700"
                    onClick={() => review(q.id, "approve")}
                  >
                    <Check className="h-3.5 w-3.5" /> Батлах
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-destructive"
                    onClick={() => review(q.id, "reject")}
                  >
                    <X className="h-3.5 w-3.5" /> Цуцлах
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ─────────────── АНГИЙН ДҮН ШИНЖИЛГЭЭ ───────────────
function ClassTab() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [data, setData] = useState<ClassGaps | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    classesApi
      .list()
      .then((c) => {
        setClasses(c);
        if (c[0]) setClassId(String(c[0].id));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    aiTeacherApi
      .classGaps(Number(classId))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [classId]);

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-4 w-4 text-primary" />
        {classes.length > 0 && (
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Анги" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : !data || data.tested_count === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Энэ ангид AI шалгалт өгсөн сурагч алга
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              {data.student_count} сурагчаас <b>{data.tested_count}</b> шалгалт өгсөн
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="font-semibold text-foreground">Сэдвийн эзэмшилт (сулаас нь)</p>
              {data.topics.map((t) => (
                <div key={t.topic_id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{t.title}</span>
                    <span className="text-muted-foreground">
                      {t.avg_mastery}% · {t.weak_count} сул
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${t.avg_mastery >= 80 ? "bg-green-500" : t.avg_mastery >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${t.avg_mastery}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {data.at_risk.length > 0 && (
            <Card>
              <CardContent className="space-y-2 p-5">
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Анхаарах сурагчид
                </p>
                {data.at_risk.map((s) => (
                  <div
                    key={s.student_id}
                    className="flex items-center justify-between rounded-lg border p-2 text-sm"
                  >
                    <span className="text-foreground">{s.name}</span>
                    <span className="font-medium text-red-600">
                      {s.avg_score}% ({s.attempts})
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
