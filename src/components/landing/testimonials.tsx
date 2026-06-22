"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Д. Мөнхбат",
    role: "Захирал, 1-р сургууль",
    initials: "ДМ",
    quote: "Ирц бүртгэлийн ажил 30 минутаас 30 секунд болсон. Багш нар маш сэтгэл ханамжтай байна.",
  },
  {
    name: "Б. Саруул",
    role: "Багш, 5-р сургууль",
    initials: "БС",
    quote: "Эцэг эхтэй харилцах боломжтой болсноор харилцаа маш сайжирлаа. Хүүхдийн ирц сайжирсан.",
  },
  {
    name: "З. Болор",
    role: "Эцэг эх",
    initials: "ЗБ",
    quote: "Хүүхдийнхээ дүнг гар утсандаа харж байна. Багштай шууд чатлах боломжтой.",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-medium text-accent mb-3 tracking-wide uppercase">
            Хэрэглэгчийн сэтгэгдэл
          </p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Сургуулиуд юу гэж хэлдэг вэ?
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}