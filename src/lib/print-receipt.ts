import type { PaymentReceipt } from "@/lib/api";
import { formatDate, formatDocNo, formatMoney } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/terms";

const CSS = `
  @page { size: A5 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: #111;
    font: 12px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  .center { text-align: center; }
  .name { font-size: 16px; font-weight: 700; }
  .muted { color: #555; }
  .title {
    margin: 14px 0 10px;
    padding: 6px 0;
    border-top: 1px solid #111;
    border-bottom: 1px solid #111;
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }
  .row { display: flex; justify-content: space-between; gap: 16px; padding: 2px 0; }
  .row > span:first-child { color: #555; flex-shrink: 0; }
  .row > span:last-child { text-align: right; }
  .amount {
    margin: 10px 0;
    padding: 8px 0;
    border-top: 1px dashed #999;
    border-bottom: 1px dashed #999;
    font-size: 15px;
    font-weight: 700;
  }
  .voided { margin-top: 8px; padding: 4px 6px; border: 1px solid #111; font-weight: 700; }
  .sign { margin-top: 28px; display: flex; justify-content: space-between; gap: 24px; }
  .sign > div { flex: 1; padding-top: 4px; border-top: 1px solid #999; color: #555; }
  .foot { margin-top: 16px; font-size: 10px; color: #777; }
`;

/**
 * Төлбөрийн баримтыг хэвлэнэ.
 *
 * Нуугдмал iframe ашигладаг: шинэ цонх (popup) нээхгүй тул popup blocker саад болохгүй,
 * мөн баримтыг серверээс татсаны дараа (async) ч ажиллана.
 * Бүх утгыг `textContent`-оор оруулна — сурагчийн нэр, тэмдэглэл зэрэг хэрэглэгчийн
 * оруулсан текст HTML болж ажиллах боломжгүй.
 */
export function printReceipt(r: PaymentReceipt): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.tabIndex = -1;
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write('<!doctype html><html lang="mn"><head><meta charset="utf-8"></head><body></body></html>');
  doc.close();

  const isRefund = r.kind === "refund";
  doc.title = `${isRefund ? "Буцаалт" : "Баримт"} ${formatDocNo(r.receipt_no)}`;
  const style = doc.createElement("style");
  style.textContent = CSS;
  doc.head.appendChild(style);

  const el = (tag: string, className: string | null, text?: string) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const row = (label: string, value: string, className = "row") => {
    const node = el("div", className);
    node.append(el("span", null, label), el("span", null, value));
    return node;
  };

  const body = doc.body;
  body.append(el("div", "center name", r.center.name));
  const contact = [r.center.address, r.center.phone ? `Утас: ${r.center.phone}` : null]
    .filter(Boolean)
    .join(" · ");
  if (contact) body.append(el("div", "center muted", contact));

  const title = el("div", "title");
  title.append(
    el("span", null, isRefund ? "БУЦААЛТЫН БАРИМТ" : "ТӨЛБӨРИЙН БАРИМТ"),
    el("span", null, formatDocNo(r.receipt_no)),
  );
  body.append(title);

  const s = r.invoice.student;
  const studentName = s
    ? [s.last_name, s.first_name].filter(Boolean).join(" ") || s.student_code || "—"
    : "—";
  body.append(
    row("Огноо", formatDate(r.paid_on)),
    row("Сурагч", s?.student_code ? `${studentName} (${s.student_code})` : studentName),
    row("Нэхэмжлэх", `${formatDocNo(r.invoice.number)} — ${r.invoice.description}`),
    row(isRefund ? "Буцаасан дүн" : "Төлсөн дүн", formatMoney(r.amount), "row amount"),
    row("Төлбөрийн хэлбэр", PAYMENT_METHOD_LABELS[r.method]),
  );
  if (r.reference) body.append(row("Гүйлгээний утга", r.reference));
  if (isRefund && r.note) body.append(row("Шалтгаан", r.note));
  body.append(
    row("Нэхэмжлэхийн дүн", formatMoney(r.invoice.total)),
    row("Нийт төлсөн", formatMoney(r.invoice.paid_amount)),
    row("Одоогийн үлдэгдэл", formatMoney(r.invoice.balance)),
  );
  if (r.status === "voided") {
    body.append(el("div", "voided", `ЦУЦЛАГДСАН: ${r.void_reason ?? ""}`));
  }

  const sign = el("div", "sign");
  sign.append(
    el("div", null, `Хүлээн авсан: ${r.received_by_name ?? ""}`),
    el("div", null, isRefund ? "Хүлээн авсан (сурагч/асран хамгаалагч)" : "Төлсөн"),
  );
  body.append(sign);
  body.append(
    el(
      "div",
      "foot",
      "Төвийн дотоод баримт. НӨАТ-ын баримт (e-barimt) биш.",
    ),
  );

  let removed = false;
  const cleanup = () => {
    if (removed) return;
    removed = true;
    iframe.remove();
  };
  win.addEventListener("afterprint", cleanup);
  // afterprint ирэхгүй хөтөч дээр iframe үүрд үлдэхгүй
  window.setTimeout(cleanup, 5 * 60_000);

  win.focus();
  win.print();
}
