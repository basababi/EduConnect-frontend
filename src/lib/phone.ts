/**
 * Утасны дугаар — backend-ийн `common/utils/phone.ts`-тэй ижил дүрэм.
 * Хэрэглэгч "9911-2233", "+976 9911 2233" г.м-ээр бичсэн ч нэг дугаар.
 */

/** `+976XXXXXXXX` болгоно; танихгүй бол null */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed || !/^[+\d\s().-]+$/.test(trimmed)) return null;
  const plus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");
  if (!plus && digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("976")) digits = digits.slice(3);
  else if (plus) return null;
  if (digits.length !== 8 || digits.startsWith("0")) return null;
  return `+976${digits}`;
}

/** Харуулах хэлбэр: `+97699112233` → `9911 2233`. Танихгүй утгыг хэвээр буцаана. */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const e164 = normalizePhone(raw);
  if (!e164) return raw;
  const local = e164.slice(4);
  return `${local.slice(0, 4)} ${local.slice(4)}`;
}

/** Нэвтрэх талбарт: `@`-гүй бөгөөд утас мэт бол true */
export function looksLikePhone(value: string): boolean {
  const v = value.trim();
  return !!v && !v.includes("@") && /^[+\d\s().-]+$/.test(v);
}
