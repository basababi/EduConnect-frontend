/** Мөнгөн дүн — бүхэл төгрөг: 180000 → "180,000₮" */
export function formatMoney(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `${Math.round(amount).toLocaleString("en-US")}₮`;
}

/** "YYYY-MM-DD" (эсвэл ISO) → "2026.11.01" */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-");
  return y && m && d ? `${y}.${m}.${d}` : value;
}

/** Хугацааны хүрээ: "2026.11.01 – 2027.01.31" (нэг тал нь хоосон байж болно) */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start && !end) return "";
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  return start ? `${formatDate(start)}-аас` : `${formatDate(end)} хүртэл`;
}

/** Нэхэмжлэх / баримтын дугаар: 123 → "№000123" */
export function formatDocNo(n: number | null | undefined): string {
  if (n == null) return "—";
  return `№${String(n).padStart(6, "0")}`;
}

/** Графикийн тэнхлэгт: 1250000 → "1.3 сая", 480000 → "480 мян", 900 → "900" */
export function formatCompactMoney(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    const v = amount / 1_000_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)} сая`;
  }
  if (abs >= 1_000) return `${Math.round(amount / 1_000)} мян`;
  return String(amount);
}

/** "2026-10" → "2026.10" */
export function formatMonth(month: string): string {
  return month.replace("-", ".");
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Хэрэглэгчийн төхөөрөмжийн өнөөдөр, "YYYY-MM-DD" (toISOString нь UTC тул өглөө өчигдөр болдог) */
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** "YYYY-MM-DD" дээр өдөр нэмнэ (сөрөг байж болно) */
export function addDaysLocal(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

/** "YYYY-MM-DD" дээр сар нэмж, тэр сарын 1-нийг буцаана (тайлангийн хугацааны сонголтод) */
export function monthStartLocal(date: string, monthOffset = 0): string {
  const [y, m] = date.split("-").map(Number);
  const dt = new Date(y, m - 1 + monthOffset, 1);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-01`;
}

/** Хоосон мөрийг undefined болгож, тоо руу хөрвүүлнэ (формын талбарт) */
export function toIntOrUndefined(value: string): number | undefined {
  const v = value.replace(/[^0-9]/g, "");
  return v === "" ? undefined : parseInt(v, 10);
}
