"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Building2, GraduationCap, HeartHandshake, UserRound } from "lucide-react";

// Зөвхөн системд БОДИТООР байгаа боломжийг бичнэ — хэрэгжээгүй зүйл амлахгүй.
const FEATURES = [
  {
    icon: Building2,
    title: "Төвийн удирдлага",
    desc: "Курс, бүлэг, багш, сурагчаа нэг дороос удирдана",
    points: ["Курс, бүлэг, суудлын хяналт", "Элсэлт, шилжүүлэлт, хөнгөлөлт", "Excel-ээс сурагч импортлох"],
  },
  {
    icon: GraduationCap,
    title: "Багш",
    desc: "Ирц авах, даалгавар өгөх, материал хуваалцах",
    points: ["Гар утсаар ирц бүртгэх", "Үнэлгээ, даалгавар", "Хичээлийн материал"],
  },
  {
    icon: HeartHandshake,
    title: "Эцэг эх",
    desc: "Хүүхдийнхээ ирц, ахицыг харж, багштай холбогдоно",
    points: ["Ирц, үнэлгээг харах", "Багштай шууд мессеж", "Зарлал, мэдээ"],
  },
  {
    icon: UserRound,
    title: "Сурагч",
    desc: "Хуваарь, даалгавар, материалаа нэг дороос",
    points: ["Хичээлийн хуваарь", "Даалгавар илгээх", "Утсанд суулгадаг апп"],
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-medium text-amber mb-3 tracking-wide uppercase">
            Боломжууд
          </p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Хүн бүрт өөрийн гэсэн портал
          </h2>
          <p className="mt-4 text-muted-foreground">
            Төвийн админ, багш, эцэг эх, сурагч тус бүр өөрт хэрэгтэй зүйлээ л харна
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="border-border/50 transition-all hover:border-border hover:shadow-md"
            >
              <CardContent className="pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10 text-amber mb-4">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feature.desc}</p>
                <ul className="mt-4 space-y-2">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-amber" />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
