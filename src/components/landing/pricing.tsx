"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check } from "lucide-react";

// Үнийн загвар эцэслэгдээгүй (СУРГАЛТЫН-ТӨВ-ТӨЛӨВЛӨГӨӨ.md §7, асуулт 4) тул зохиомол
// үнэ тавихгүй. Шийдвэр гармагц энэ хэсгийг бодит багцаар солино.
const INCLUDED = [
  "Курс, бүлэг, элсэлт, сурагчийн бүртгэл",
  "Ирц, даалгавар, хичээлийн материал",
  "Багш, эцэг эх, сурагчийн портал",
  "Мессеж, зарлал, мэдэгдэл",
  "Утсанд суулгадаг апп",
];

interface PricingProps {
  onRegister: () => void;
}

export function Pricing({ onRegister }: PricingProps) {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-amber">
            Үнийн санал
          </p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Үнэгүй туршилтаар эхэл
          </h2>
          <p className="mt-4 text-muted-foreground">
            Төвөө бүртгүүлээд шууд ашиглаж эхэлнэ. Төвийн хэмжээнд тохирсон үнийн
            саналыг бид тантай холбогдож өгнө.
          </p>
        </div>

        <Card className="mx-auto max-w-xl border-amber shadow-lg ring-1 ring-amber">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground">Туршилтын хугацаанд багтсан</h3>
            <ul className="mt-5 space-y-3">
              {INCLUDED.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="amber" className="mt-6 w-full font-medium" onClick={onRegister}>
              Төвөө бүртгүүлэх
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
