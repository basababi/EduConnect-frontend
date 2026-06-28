"use client";

import { Briefcase, Sparkles, Bot, ArrowRight } from "lucide-react";

export function StudentCareer() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Briefcase className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-primary">Карьер Зөвлөгөө</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Дүн, сонирхол дээр үндэслэн тохирох мэргэжил, их сургуулийн зам зөвлөдөг
          AI хэрэгсэл — одоогоор хөгжүүлэлтийн шатанд байна.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-amber/30 bg-amber/5 px-4 py-2.5 text-sm font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-amber" />
          Удахгүй нэвтрэх боломжтой болно
        </div>
        <div className="mt-8 rounded-xl border bg-muted/30 p-4 text-left">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bot className="h-4 w-4 text-primary" />
            Одоо ашиглах боломжтой
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Зүүн цэсний <strong>&quot;AI Туслах&quot;</strong> хэсгээр карьерийн талаар
            бодит AI-аас зөвлөгөө асууж болно.
            <ArrowRight className="ml-1 inline h-3 w-3" />
          </p>
        </div>
      </div>
    </div>
  );
}
