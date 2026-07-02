"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { aiApi, type ReviewItem } from "@/lib/api";
import { MathText } from "@/lib/math";

const SCORES = [
  { v: 0, label: "Буруу (0%)", cls: "bg-red-500" },
  { v: 0.5, label: "Хагас (50%)", cls: "bg-amber-500" },
  { v: 1, label: "Зөв (100%)", cls: "bg-green-500" },
];

export function TeacherAiReviews() {
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
      setItems((prev) => prev.filter((x) => keyOf(x) !== k));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Хадгалж чадсангүй");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ClipboardCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary">AI шалгалт — гар засвар</h1>
          <p className="text-sm text-muted-foreground">
            AI итгэлгүй байгаа нээлттэй хариултуудыг та эцэслэн үнэлнэ
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16">
            <CheckCircle2 className="h-10 w-10 text-green-500/50" />
            <p className="text-sm font-medium text-foreground">
              Шалгах хариулт алга
            </p>
            <p className="text-xs text-muted-foreground">
              Багшийн засвар хүлээж буй нээлттэй хариулт байхгүй байна.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
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
                    <span>{new Date(it.created_at).toLocaleDateString("mn-MN")}</span>
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
                    <p className="text-xs text-green-700">
                      ✓ Зөв хариу: <MathText text={it.correct_answer} />
                    </p>
                  )}

                  <div className="rounded-lg border border-amber/30 bg-amber/5 p-2 text-xs text-muted-foreground">
                    🤖 AI санал: {Math.round(it.ai_score * 100)}% —{" "}
                    <MathText text={it.ai_feedback} />
                  </div>

                  <Input
                    value={feedback[k] ?? ""}
                    onChange={(e) =>
                      setFeedback((f) => ({ ...f, [k]: e.target.value }))
                    }
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
      )}
    </div>
  );
}
