"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { authApi, setAuth } from "@/lib/api";
import { PhoneCodeForm } from "@/components/landing/phone-code-form";

/**
 * Утсаар бүртгэл идэвхжүүлэх: төв "апп-д нэвтрэх эрх" нээхэд SMS-ээр код ирнэ (эсвэл
 * админ өөрөө өгнө) → утас + код + өөрийн нууц үг → шууд нэвтэрнэ.
 * SMS-ийн холбоос: /activate (дугаарыг `?phone=` гэж дамжуулж болно).
 */
function ActivateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";

  async function onDone(p: string, password: string) {
    const res = await authApi.login(p, password);
    setAuth(res.accessToken, res.refreshToken, res.user);
    toast.success(`Тавтай морил, ${res.user.first_name}!`);
    router.push("/");
  }

  return (
    <PhoneCodeForm purpose="activate" initialPhone={phone} startWithCode={!!phone} onDone={onDone} />
  );
}

export default function ActivatePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Бүртгэл идэвхжүүлэх</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Сургалтын төв танд нэвтрэх эрх нээсэн бол утасны дугаар, SMS-ээр ирсэн кодоо
              оруулаад өөрийн нууц үгээ тохируулна уу.
            </p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <Suspense fallback={null}>
            <ActivateInner />
          </Suspense>
        </div>
        <Link
          href="/"
          className="block text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Нүүр хуудас руу буцах
        </Link>
      </div>
    </div>
  );
}
