"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";

interface HeroProps {
  onLogin: () => void;
}

export function Hero({ onLogin }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/50">
      <div className="container relative mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" />
            Монголын сургуулиудад зориулсан нэгдсэн платформ
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground md:text-6xl md:leading-[1.1]">
            Сургуулийн удирдлага,<br className="hidden sm:block" /> нэг платформ.
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
            Ирц бүртгэл, дүнгийн журнал, эцэг эх-багш чат, мэдэгдэл — бүгдийг
            нэг системд. Цаасан хэрэггүй, хурдан, найдвартай.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={onLogin}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium shadow-sm"
            >
              Демо үзэх
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onLogin}
              className="border-border font-medium"
            >
              Нэвтрэх
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["Б", "С", "О", "Д"].map((initial, i) => (
                  <div
                    key={i}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium"
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <span>50+ сургууль</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span>15,000+ сурагч</span>
            <div className="h-4 w-px bg-border" />
            <span>99.9% uptime</span>
          </div>
        </div>

        {/* Product Preview */}
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
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  educonnect.mn/dashboard
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
                        <div className="h-full w-[94%] rounded-full bg-accent" />
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-card p-4">
                      <p className="text-xs text-muted-foreground">Дүнгийн дундаж</p>
                      <p className="mt-1 text-2xl font-semibold">85.4</p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                        <div className="h-full w-[85%] rounded-full bg-primary" />
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
                            {["Д", "М", "Л", "П", "Б", "Б", "Н"][i]}
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
                      {["Ирц бүртгэгдлээ", "Шинэ дүн орлоо", "Даалгавар нэмэгдлээ"].map((t) => (
                        <div key={t} className="flex items-center gap-2 text-xs">
                          <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card p-4">
                    <p className="mb-2 text-xs text-muted-foreground">Чат</p>
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