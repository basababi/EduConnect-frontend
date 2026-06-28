"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, AlertCircle } from "lucide-react";
import { API_BASE, setAuth, type User } from "@/lib/api";

function GoogleSuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    if (!accessToken || !refreshToken) {
      setError(true);
      return;
    }
    // Токеноор хэрэглэгчийн мэдээллийг авч хадгална
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("me failed");
        return r.json();
      })
      .then((user: User) => {
        setAuth(accessToken, refreshToken, user);
        router.replace("/");
      })
      .catch(() => setError(true));
  }, [params, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <GraduationCap className="h-6 w-6" />
      </div>
      {error ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.
          </p>
          <button
            onClick={() => router.replace("/")}
            className="text-sm font-medium text-primary hover:underline"
          >
            Нүүр хуудас руу
          </button>
        </div>
      ) : (
        <p className="animate-pulse text-sm text-muted-foreground">Нэвтэрч байна...</p>
      )}
    </div>
  );
}

export default function GoogleSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="animate-pulse text-sm text-muted-foreground">Ачааллаж байна...</p>
        </div>
      }
    >
      <GoogleSuccessInner />
    </Suspense>
  );
}
