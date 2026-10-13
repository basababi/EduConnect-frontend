"use client";

import { Building2, UserPlus, Users } from "lucide-react";

const STEPS = [
  {
    icon: Building2,
    title: "Төвөө бүртгүүл",
    desc: "Төвийн нэр, имэйлээ оруулаад хэдхэн минутад админ дансаа үүсгэнэ.",
  },
  {
    icon: Users,
    title: "Курс, бүлгээ нээ",
    desc: "Курсээ үнийн хамт бүртгэж, бүлэг нээгээд сурагчдаа гараар эсвэл Excel-ээс элсүүлнэ.",
  },
  {
    icon: UserPlus,
    title: "Багш нараа урь",
    desc: "Багш урилгын холбоосоор орж, ирц бүртгэл, даалгавраа шууд эхлүүлнэ.",
  },
];

/** Хэрхэн эхлэх — 3 алхам. (Өмнө энд байсан зохиомол сэтгэгдлүүдийг орлосон.) */
export function HowItWorks() {
  return (
    <section id="how" className="border-y border-border/50 bg-muted/30 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-amber">
            Хэрхэн эхлэх вэ
          </p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Гурван алхмаар ажиллаж эхэлнэ
          </h2>
        </div>

        <ol className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
            >
              <span className="absolute right-5 top-4 text-4xl font-bold tabular-nums text-muted-foreground/15">
                {i + 1}
              </span>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
