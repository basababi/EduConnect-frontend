"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "0₮",
    period: "сард",
    desc: "Жижиг сургуулиудад үнэгүй",
    features: ["50 сурагч хүртэл", "1 анги", "Ирц бүртгэл", "Email дэмжлэг"],
    cta: "Эхлэх",
    popular: false,
  },
  {
    name: "Basic",
    price: "00,000₮",
    period: "сард",
    desc: "Дунд хэмжээний сургуулиуд",
    features: ["500 сурагч хүртэл", "Хязгааргүй анги", "Бүх модуль", "Phone дэмжлэг", "ESIS синк"],
    cta: "Сонгох",
    popular: true,
  },
  {
    name: "Premium",
    price: "000,000₮",
    period: "сард",
    desc: "Том сургуулиудад",
    features: ["Хязгааргүй сурагч", "AI тайлан", "Priority дэмжлэг", "API access", "Custom branding"],
    cta: "Холбогдох",
    popular: false,
  },
];

interface PricingProps {
  onLogin: () => void;
}

export function Pricing({ onLogin }: PricingProps) {
  return (
    <section id="pricing" className="bg-muted/30 py-20 md:py-28 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-medium text-amber mb-3 tracking-wide uppercase">
            Үнийн санал
          </p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Сургуулийн хэмжээнд тохирсон
          </h2>
          <p className="mt-4 text-muted-foreground">
            Сургуулийн хэмжээнд тохирсон гүйцэтгэл
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-border/50 transition-all hover:shadow-md ${
                plan.popular ? "border-amber shadow-lg ring-1 ring-amber" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-amber px-3 py-1 text-xs font-medium text-amber-foreground shadow-sm">
                    Алдартай
                  </span>
                </div>
              )}
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/ {plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full font-medium ${
                    plan.popular
                      ? ""
                      : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  }`}
                  variant={plan.popular ? "amber" : "outline"}
                  onClick={onLogin}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}