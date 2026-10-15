"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, GraduationCap, XCircle } from "lucide-react";
import { authApi } from "@/lib/api";

/** Имэйлээр ирсэн баталгаажуулах холбоос: /verify-email?token=… */
function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // Токен нэг удаагийн — React-ийн давхар effect хоёр удаа илгээхээс сэргийлнэ
    if (started.current) return;
    started.current = true;
    const run = token
      ? authApi.confirmEmailVerification(token)
      : Promise.reject(new Error("Холбоос буруу байна"));
    run
      .then((r) => setState({ ok: true, message: r.message }))
      .catch((e) =>
        setState({ ok: false, message: e instanceof Error ? e.message : "Баталгаажуулж чадсангүй" }),
      );
  }, [token]);

  if (!state) {
    return <p className="text-center text-sm text-muted-foreground">Шалгаж байна...</p>;
  }
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-xl border p-8 text-center ${
        state.ok ? "border-green-200 bg-green-50" : "border-rose-200 bg-rose-50"
      }`}
    >
      {state.ok ? (
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      ) : (
        <XCircle className="h-10 w-10 text-rose-600" />
      )}
      <p className="text-sm font-medium text-foreground">{state.message}</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Имэйл баталгаажуулалт</h1>
        </div>
        <Suspense fallback={null}>
          <VerifyInner />
        </Suspense>
        <Link
          href="/"
          className="block text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Нүүр хуудас руу
        </Link>
      </div>
    </div>
  );
}
