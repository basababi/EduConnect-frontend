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

/** Хоосон мөрийг undefined болгож, тоо руу хөрвүүлнэ (формын талбарт) */
export function toIntOrUndefined(value: string): number | undefined {
  const v = value.replace(/[^0-9]/g, "");
  return v === "" ? undefined : parseInt(v, 10);
}
