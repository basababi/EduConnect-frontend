"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check, Sparkles } from "lucide-react";

interface HeroProps {
  onLogin: () => void;
  onRegister: () => void;
}

const HIGHLIGHTS = ["Үнэгүй туршилтаар эхэлнэ", "Утсанд апп болгон суулгана", "Бүрэн монгол хэл дээр"];

export function Hero({ onLogin, onRegister }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/50">
      <div className="container relative mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-amber" />
            Сургалтын төвүүдэд зориулсан удирдлагын платформ
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground md:text-6xl md:leading-[1.1]">
            Сургалтын төвөө<br className="hidden sm:block" /> нэг дороос удирд.
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
            Бүлэг, сурагч, ирц, даалгавар, эцэг эхтэй харилцах харилцаа — бүгд нэг
            системд. Excel, дэвтэр, чатын бүлэг хооронд сэлгэх шаардлагагүй.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="amber"
              onClick={onRegister}
              className="font-medium shadow-sm"
            >
              Төвөө бүртгүүлэх
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onLogin}
              className="border-primary font-medium text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Нэвтрэх
            </Button>
          </div>

          {/* Гол давуу тал — баталгаажаагүй тоо, сэтгэгдэл тавихгүй */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {HIGHLIGHTS.map((h) => (
              <span key={h} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-amber" />
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* Product Preview (жишээ дэлгэц) */}
        <div className="mx-auto mt-16 max-w-5xl">
          <Card className="overflow-hidden border-border/50 shadow-2xl shadow-primary/5">
            <CardContent className="p-0">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                  <div className="h-3 w-3 rounded-full bg-green-400/80" />
                </div>
                <div className="mx-auto flex items-center gap-2 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-amber" />
                  Жишээ дэлгэц
                </div>
              </div>
              {/* Dashboard preview */}
              <div className="grid gap-4 bg-muted/20 p-4 sm:grid-cols-3 sm:p-6">
                <div className="space-y-3 sm:col-span-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border/50 bg-card p-4">
                      <p className="text-xs text-muted-foreground">Өнөөдрийн ирц</p>
                      <p className="mt-1 text-2xl font-semibold">94%</p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                        <div className="h-full w-[94%] rounded-full bg-amber" />
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-card p-4">
                      <p className="text-xs text-muted-foreground">Идэвхтэй бүлэг</p>
                      <p className="mt-1 text-2xl font-semibold">12</p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                        <div className="h-full w-[75%] rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card p-4">
                    <p className="mb-3 text-xs text-muted-foreground">7 хоногийн ирц</p>
                    <div className="flex h-20 items-end justify-between gap-1.5">
                      {[88, 92, 95, 90, 94, 87, 94].map((v, i) => (
                        <div key={i} className="flex flex-1 flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t bg-primary/80"
                            style={{ height: `${v}%` }}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"][i]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg border border-border/50 bg-card p-4">
                    <p className="mb-2 text-xs text-muted-foreground">Шинэ мэдэгдэл</p>
                    <div className="space-y-2">
                      {["Ирц бүртгэгдлээ", "Шинэ сурагч элслээ", "Даалгавар нэмэгдлээ"].map((t) => (
                        <div key={t} className="flex items-center gap-2 text-xs">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber" />
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card p-4">
                    <p className="mb-2 text-xs text-muted-foreground">Мессеж</p>
                    <div className="space-y-2">
                      <div className="ml-auto w-fit rounded-lg bg-primary px-2.5 py-1 text-xs text-primary-foreground">
                        Сайн байна уу?
                      </div>
                      <div className="w-fit rounded-lg bg-muted px-2.5 py-1 text-xs">
                        Сайн, тавтай морил!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
