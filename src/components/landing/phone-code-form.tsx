"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Lock, MessageSquareText, Phone } from "lucide-react";
import { toast } from "sonner";
import { ApiError, authApi, type PhoneCodePurpose } from "@/lib/api";
import { formatPhone, normalizePhone } from "@/lib/phone";

/**
 * Утас → SMS код → шинэ нууц үг. Бүртгэл идэвхжүүлэх (activate) болон нууц үг
 * сэргээх (reset) хоёуланд. Амжилттай бол `onDone(phone, password)` — дуудагч шууд нэвтрүүлнэ.
 */
export function PhoneCodeForm({
  purpose,
  initialPhone = "",
  startWithCode = false,
  onDone,
}: {
  purpose: PhoneCodePurpose;
  initialPhone?: string;
  /** Урилгын SMS-д код аль хэдийн ирсэн (идэвхжүүлэх) — шууд код оруулах алхмаас эхэлнэ */
  startWithCode?: boolean;
  onDone: (phone: string, password: string) => Promise<void> | void;
}) {
  const [step, setStep] = useState<"phone" | "code">(
    startWithCode && normalizePhone(initialPhone) ? "code" : "phone",
  );
  const [phone, setPhone] = useState(() => formatPhone(initialPhone));
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const normalized = normalizePhone(phone);

  async function requestCode() {
    if (!normalized) {
      toast.error("Утасны дугаараа 8 оронтойгоор оруулна уу");
      return;
    }
    setBusy(true);
    try {
      const res = await authApi.sendPhoneCode(normalized, purpose);
      setDevCode(res.dev_code ?? null);
      setCooldown(60);
      setStep("code");
      toast.success("SMS код илгээлээ");
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        const retry = Number((err.body as { retry_after?: number } | undefined)?.retry_after);
        if (retry > 0 && retry <= 3600) setCooldown(retry);
        // Өмнө нь код авсан бол код оруулах алхам руу шилжинэ
        setStep("code");
      }
      toast.error(err instanceof Error ? err.message : "Код илгээж чадсангүй");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step === "phone") {
      await requestCode();
      return;
    }
    if (!normalized) {
      toast.error("Утасны дугаар буруу байна");
      setStep("phone");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error("SMS-ээр ирсэн 6 оронтой кодоо оруулна уу");
      return;
    }
    if (password.length < 8) {
      toast.error("Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой");
      return;
    }
    if (password !== confirm) {
      toast.error("Нууц үг таарахгүй байна");
      return;
    }
    setBusy(true);
    try {
      await authApi.confirmPhoneCode(normalized, purpose, code.trim(), password);
      await onDone(normalized, password);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Амжилтгүй");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pc-phone">Утасны дугаар</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="pc-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9911 2233"
            disabled={busy || step === "code"}
            className="pl-10"
            required
          />
        </div>
        {step === "code" && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setStep("phone")}
          >
            Дугаар солих
          </button>
        )}
      </div>

      {step === "code" && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pc-code">SMS код</Label>
              <button
                type="button"
                onClick={requestCode}
                disabled={busy || cooldown > 0}
                className="text-xs text-amber hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
              >
                {cooldown > 0 ? `Дахин авах (${cooldown}с)` : "Код дахин авах"}
              </button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="pc-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                disabled={busy}
                className="pl-10 tracking-[0.4em]"
                required
              />
            </div>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {normalized ? `${formatPhone(normalized)} дугаарт ирсэн кодыг оруулна уу.` : null}
              {purpose === "activate" && " Төвөөс өгсөн кодыг ч ашиглаж болно."}
            </p>
            {devCode && (
              <p className="rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground">
                Туршилтын орчин — код: <span className="font-mono font-semibold">{devCode}</span>
              </p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pc-pass">Шинэ нууц үг</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="pc-pass"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8+ тэмдэгт"
                  minLength={8}
                  disabled={busy}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pc-pass2">Давтах</Label>
              <Input
                id="pc-pass2"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={busy}
                required
              />
            </div>
          </div>
        </>
      )}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy
          ? "Түр хүлээнэ үү..."
          : step === "phone"
            ? "SMS код авах"
            : purpose === "activate"
              ? "Идэвхжүүлээд нэвтрэх"
              : "Нууц үг шинэчлээд нэвтрэх"}
      </Button>
      {step === "phone" && purpose === "activate" && (
        <button
          type="button"
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            if (!normalized) {
              toast.error("Эхлээд утасны дугаараа оруулна уу");
              return;
            }
            setStep("code");
          }}
        >
          SMS-ээр код аль хэдийн ирсэн
        </button>
      )}
    </form>
  );
}
