"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, GraduationCap, MessageSquare, Users } from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Сургуулийн удирдлага",
    desc: "Хэрэглэгч, анги, багшийн мэдээллийг нэг дор удирдах",
    points: ["Multi-tenant тусгаарлалт", "RBAC эрхийн хяналт", "Статистик тайлан"],
  },
  {
    icon: GraduationCap,
    title: "Багш",
    desc: "Ирц бүртгэх, дүн оруулах, даалгавар үүсгэх",
    points: ["30 секундэд ирц", "Дундаж автоматаар", "Файл хавсралт"],
  },
  {
    icon: BookOpen,
    title: "Эцэг эх",
    desc: "Хүүхдийн ирц, дүн харах, багштай чат хийх",
    points: ["Real-time мэдэгдэл", "SMS fallback", "Ажлын цагийн хязгаар"],
  },
  {
    icon: MessageSquare,
    title: "Сурагч",
    desc: "Хуваарь, даалгавар, өөрийн дүн харах",
    points: ["To-Do жагсаалт", "Хугацаа сануулга", "Хичээлийн хуваарь"],
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-medium text-accent mb-3 tracking-wide uppercase">
            Бүх талуудын хэрэгцээ
          </p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Хэн бүхэнд зориулсан шийдэл
          </h2>
          <p className="mt-4 text-muted-foreground">
            Сургуулийн бүх талуудын хэрэгцээг нэг платформд нэгтгэв
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="border-border/50 transition-all hover:border-border hover:shadow-md"
            >
              <CardContent className="pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent mb-4">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feature.desc}</p>
                <ul className="mt-4 space-y-2">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-accent" />
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