"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Pill } from "@/components/ui/dashboard-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleDashed,
  Clock,
  HandCoins,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Printer,
  ReceiptText,
  RotateCcw,
  Undo2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  invoicesApi,
  newIdempotencyKey,
  paymentsApi,
  studentDisplayName,
  type Invoice,
  type ManualPaymentMethod,
  type Payment,
  type PaymentReceipt,
  type Student,
} from "@/lib/api";
import {
  addDaysLocal,
  formatDate,
  formatDateRange,
  formatDocNo,
  formatMoney,
  toIntOrUndefined,
  todayLocal,
} from "@/lib/format";
import { INVOICE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/terms";
import { printReceipt } from "@/lib/print-receipt";

const MANUAL_METHODS: ManualPaymentMethod[] = ["cash", "transfer", "card"];
const NONE = "none";

const errorMessage = (e: unknown, fallback: string) =>
  e instanceof Error ? e.message : fallback;

export function invoiceStudentName(inv: Pick<Invoice, "student" | "student_id">): string {
  return inv.student ? studentDisplayName(inv.student) : `#${inv.student_id}`;
}

/* ──────────────────────────────────────────────
   Төлөв — өнгө дангаараа утга зөөхгүй: үргэлж дүрс + үгтэй
   ────────────────────────────────────────────── */
export function InvoiceStatusBadge({
  invoice,
}: {
  invoice: Pick<Invoice, "status" | "is_overdue" | "days_overdue">;
}) {
  if (invoice.is_overdue) {
    return (
      <Pill tone="rose" icon={AlertTriangle}>
        Хугацаа хэтэрсэн · {invoice.days_overdue} хоног
      </Pill>
    );
  }
  switch (invoice.status) {
    case "paid":
      return (
        <Pill tone="emerald" icon={CheckCircle2}>
          {INVOICE_STATUS_LABELS.paid}
        </Pill>
      );
    case "partially_paid":
      return (
        <Pill tone="navy" icon={CircleDashed}>
          {INVOICE_STATUS_LABELS.partially_paid}
        </Pill>
      );
    case "void":
      return (
        <Pill tone="slate" icon={Ban}>
          {INVOICE_STATUS_LABELS.void}
        </Pill>
      );
    default:
      return (
        <Pill tone="amber" icon={Clock}>
          {INVOICE_STATUS_LABELS.issued}
        </Pill>
      );
  }
}

function MethodSelect({
  value,
  onChange,
  disabled,
}: {
  value: ManualPaymentMethod;
  onChange: (v: ManualPaymentMethod) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as ManualPaymentMethod)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MANUAL_METHODS.map((m) => (
          <SelectItem key={m} value={m}>
            {PAYMENT_METHOD_LABELS[m]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Мөнгөн дүнгийн талбар: зөвхөн цифр; доор нь уншихад хялбар хэлбэрээр давтана */
function AmountField({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
}) {
  const parsed = toIntOrUndefined(value);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder="0"
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        className="tabular-nums"
      />
      <p className="h-4 text-xs text-muted-foreground">
        {parsed !== undefined ? formatMoney(parsed) : ""}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={strong ? "font-medium text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
      <span
        className={`tabular-nums ${strong ? "font-bold text-foreground" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Төлбөр бүртгэх
   ────────────────────────────────────────────── */
export function PaymentDialog({
  invoice,
  onOpenChange,
  onSaved,
}: {
  /** null = хаалттай */
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (receipt: PaymentReceipt) => void;
}) {
  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        {invoice && (
          <PaymentForm
            invoice={invoice}
            onCancel={() => onOpenChange(false)}
            onSaved={(r) => {
              onSaved(r);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({
  invoice,
  onCancel,
  onSaved,
}: {
  invoice: Invoice;
  onCancel: () => void;
  onSaved: (receipt: PaymentReceipt) => void;
}) {
  const [today] = useState(todayLocal);
  const [amount, setAmount] = useState(String(invoice.balance));
  const [method, setMethod] = useState<ManualPaymentMethod>("cash");
  const [paidOn, setPaidOn] = useState(today);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Цонх нээгдэх бүрт нэг түлхүүр: давхар товшилт, дахин оролдлого нэг л төлбөр үүсгэнэ
  const [idempotencyKey] = useState(newIdempotencyKey);

  const value = toIntOrUndefined(amount) ?? 0;
  const tooMuch = value > invoice.balance;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value < 1) {
      toast.error("Төлсөн дүнг оруулна уу");
      return;
    }
    if (tooMuch) {
      toast.error(`Төлөх дүн үлдэгдлээс (${formatMoney(invoice.balance)}) их байна`);
      return;
    }
    setSubmitting(true);
    try {
      const receipt = await invoicesApi.addPayment(
        invoice.id,
        {
          amount: value,
          method,
          // Өнөөдөр бол серверийн "өнөөдөр"-ийг ашиглуулна (цагийн бүсийн зөрүүнээс сэргийлнэ)
          paid_on: paidOn !== today ? paidOn : undefined,
          reference: reference.trim() || undefined,
          note: note.trim() || undefined,
        },
        idempotencyKey,
      );
      toast.success(`${formatMoney(receipt.amount)} төлбөр бүртгэгдлээ`, {
        action: { label: "Баримт хэвлэх", onClick: () => printReceipt(receipt) },
      });
      onSaved(receipt);
    } catch (err) {
      toast.error(errorMessage(err, "Төлбөр бүртгэж чадсангүй"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Төлбөр бүртгэх</DialogTitle>
        <DialogDescription>
          {invoiceStudentName(invoice)} · {formatDocNo(invoice.number)}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
          <p className="truncate text-sm font-medium text-foreground">{invoice.description}</p>
          <SummaryRow label="Төлөх дүн" value={formatMoney(invoice.total)} />
          <SummaryRow label="Өмнө төлсөн" value={formatMoney(invoice.paid_amount)} />
          <div className="border-t pt-1.5">
            <SummaryRow label="Үлдэгдэл" value={formatMoney(invoice.balance)} strong />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <AmountField
            id="pay-amount"
            label="Төлсөн дүн (₮) *"
            value={amount}
            onChange={setAmount}
            disabled={submitting}
            required
            autoFocus
          />
          <div className="space-y-2">
            <Label>Төлбөрийн хэлбэр</Label>
            <MethodSelect value={method} onChange={setMethod} disabled={submitting} />
          </div>
        </div>
        {value > 0 && (
          <p
            className={`-mt-2 text-xs ${tooMuch ? "font-medium text-destructive" : "text-muted-foreground"}`}
          >
            {tooMuch
              ? `Үлдэгдлээс ${formatMoney(value - invoice.balance)} илүү байна`
              : value === invoice.balance
                ? "Нэхэмжлэх бүрэн төлөгдөнө"
                : `Төлсний дараах үлдэгдэл: ${formatMoney(invoice.balance - value)}`}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="pay-date">Төлсөн өдөр</Label>
            <Input
              id="pay-date"
              type="date"
              value={paidOn}
              max={today}
              onChange={(e) => setPaidOn(e.target.value || today)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-ref">Гүйлгээний утга</Label>
            <Input
              id="pay-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Заавал биш"
              maxLength={100}
              disabled={submitting}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pay-note">Тэмдэглэл</Label>
          <Input
            id="pay-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Заавал биш"
            maxLength={300}
            disabled={submitting}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Болих
          </Button>
          <Button type="submit" disabled={submitting || value < 1 || tooMuch}>
            {submitting ? "Бүртгэж байна..." : "Төлбөр бүртгэх"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

/* ──────────────────────────────────────────────
   Буцаалт — мөнгийг бодитоор буцааж олгосныг бүртгэнэ
   ────────────────────────────────────────────── */
function RefundDialog({
  target,
  invoice,
  onOpenChange,
  onDone,
}: {
  target: { payment: Payment; refundable: number } | null;
  invoice: Invoice;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        {target && (
          <RefundForm
            payment={target.payment}
            refundable={target.refundable}
            invoice={invoice}
            onCancel={() => onOpenChange(false)}
            onDone={() => {
              onDone();
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RefundForm({
  payment,
  refundable,
  invoice,
  onCancel,
  onDone,
}: {
  payment: Payment;
  refundable: number;
  invoice: Invoice;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [today] = useState(todayLocal);
  const [amount, setAmount] = useState(String(refundable));
  const [method, setMethod] = useState<ManualPaymentMethod>(
    payment.method === "qpay" ? "transfer" : payment.method,
  );
  const [paidOn, setPaidOn] = useState(today);
  const [reason, setReason] = useState("");
  const [closeInvoice, setCloseInvoice] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey] = useState(newIdempotencyKey);

  const value = toIntOrUndefined(amount) ?? 0;
  const tooMuch = value > refundable;
  const keptAfter = invoice.paid_amount - value; // төвд үлдэх мөнгө

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value < 1 || tooMuch) {
      toast.error(`Буцаах дүн 1–${formatMoney(refundable)} хооронд байна`);
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("Буцаалтын шалтгааныг бичнэ үү");
      return;
    }
    setSubmitting(true);
    try {
      const receipt = await paymentsApi.refund(
        payment.id,
        {
          amount: value,
          method,
          paid_on: paidOn !== today ? paidOn : undefined,
          reason: reason.trim(),
          close_invoice: closeInvoice,
        },
        idempotencyKey,
      );
      toast.success(`${formatMoney(receipt.amount)} буцаалт бүртгэгдлээ`, {
        action: { label: "Баримт хэвлэх", onClick: () => printReceipt(receipt) },
      });
      onDone();
    } catch (err) {
      toast.error(errorMessage(err, "Буцаалт бүртгэж чадсангүй"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Буцаалт бүртгэх</DialogTitle>
        <DialogDescription>
          {formatDate(payment.paid_on)}-нд төлсөн {formatMoney(payment.amount)} төлбөрөөс
          (баримт {formatDocNo(payment.receipt_no)}). Буцаах боломжтой:{" "}
          {formatMoney(refundable)}.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <AmountField
            id="refund-amount"
            label="Буцаах дүн (₮) *"
            value={amount}
            onChange={setAmount}
            disabled={submitting}
            required
            autoFocus
          />
          <div className="space-y-2">
            <Label>Буцаасан хэлбэр</Label>
            <MethodSelect value={method} onChange={setMethod} disabled={submitting} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="refund-date">Буцаасан өдөр</Label>
          <Input
            id="refund-date"
            type="date"
            value={paidOn}
            min={payment.paid_on}
            max={today}
            onChange={(e) => setPaidOn(e.target.value || today)}
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refund-reason">Шалтгаан *</Label>
          <Textarea
            id="refund-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Жишээ: Курсээс гарсан, 2 долоо хоног суралцсан"
            rows={2}
            maxLength={300}
            required
            disabled={submitting}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-3">
          <input
            type="checkbox"
            checked={closeInvoice}
            onChange={(e) => setCloseInvoice(e.target.checked)}
            disabled={submitting}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">Нэхэмжлэхийг хаах</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {value < 1 || tooMuch
                ? "Сурагч цааш төлөхгүй бол сонгоно (курсээс гарсан г.м)."
                : closeInvoice
                  ? keptAfter > 0
                    ? `Төлөх дүн ${formatMoney(keptAfter)} болж, үлдэгдэл 0 болно — сурагч цааш төлөхгүй.`
                    : "Мөнгө бүгд буцаагдах тул нэхэмжлэх хүчингүй болно."
                  : `Нэхэмжлэх хэвээр: буцаасан дүн дахин авлага болно (үлдэгдэл ${formatMoney(
                      invoice.balance + value,
                    )}).`}
            </span>
          </span>
        </label>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Болих
          </Button>
          <Button
            type="submit"
            variant="destructive-solid"
            disabled={submitting || value < 1 || tooMuch}
          >
            {submitting ? "Бүртгэж байна..." : "Буцаалт бүртгэх"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

/* ──────────────────────────────────────────────
   Шалтгаан асуух (хүчингүй болгох, цуцлах) — хэн, яагаад гэдэг нь audit-д үлдэнэ
   ────────────────────────────────────────────── */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (reason: string) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open && (
          <ReasonForm
            title={title}
            description={description}
            confirmLabel={confirmLabel}
            onCancel={() => onOpenChange(false)}
            onConfirm={async (reason) => {
              await onConfirm(reason);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReasonForm({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 3) {
      toast.error("Шалтгааныг бичнэ үү");
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      toast.error(errorMessage(err, "Амжилтгүй"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reason-text">Шалтгаан *</Label>
          <Textarea
            id="reason-text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={300}
            required
            autoFocus
            disabled={submitting}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Болих
          </Button>
          <Button type="submit" variant="destructive-solid" disabled={submitting}>
            {submitting ? "Түр хүлээнэ үү..." : confirmLabel}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

/* ──────────────────────────────────────────────
   Нэхэмжлэх гаргах (гараар) / засах
   ────────────────────────────────────────────── */
export interface FixedStudent {
  id: number;
  name: string;
  /** Өгвөл нэхэмжлэх энэ элсэлтэд холбогдоно (курсийн орлогын тайланд орно) */
  enrollmentId?: number;
}

export function InvoiceFormDialog({
  open,
  onOpenChange,
  editing,
  students = [],
  fixedStudent,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Invoice | null;
  /** Шинээр гаргахад сонгох сурагчид (`fixedStudent` өгөөгүй үед) */
  students?: Student[];
  fixedStudent?: FixedStudent | null;
  onSaved: (invoice: Invoice) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        {open && (
          <InvoiceForm
            editing={editing ?? null}
            students={students}
            fixedStudent={fixedStudent ?? null}
            onCancel={() => onOpenChange(false)}
            onSaved={(inv) => {
              onSaved(inv);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function InvoiceForm({
  editing,
  students,
  fixedStudent,
  onCancel,
  onSaved,
}: {
  editing: Invoice | null;
  students: Student[];
  fixedStudent: FixedStudent | null;
  onCancel: () => void;
  onSaved: (invoice: Invoice) => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [enrollmentId, setEnrollmentId] = useState(NONE);
  const [search, setSearch] = useState("");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [discount, setDiscount] = useState(
    editing && editing.discount > 0 ? String(editing.discount) : "",
  );
  const [dueDate, setDueDate] = useState(
    () => editing?.due_date ?? addDaysLocal(todayLocal(), 7),
  );
  const [note, setNote] = useState(editing?.note ?? "");
  const [submitting, setSubmitting] = useState(false);

  const selected = students.find((s) => String(s.id) === studentId) ?? null;
  const studentOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter(
        (s) =>
          !q ||
          `${studentDisplayName(s)} ${s.student_code ?? ""} ${s.phone ?? ""}`
            .toLowerCase()
            .includes(q),
      )
      .slice(0, 50);
  }, [students, search]);

  const amountValue = toIntOrUndefined(amount) ?? 0;
  const discountValue = toIntOrUndefined(discount) ?? 0;
  const total = amountValue - discountValue;
  const paid = editing?.paid_amount ?? 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing && !fixedStudent && !studentId) {
      toast.error("Сурагчаа сонгоно уу");
      return;
    }
    if (amountValue < 1) {
      toast.error("Дүнг оруулна уу");
      return;
    }
    if (discountValue >= amountValue) {
      toast.error("Хөнгөлөлт дүнгээс бага байх ёстой");
      return;
    }
    if (total < paid) {
      toast.error(`Төлөх дүн аль хэдийн төлөгдсөн ${formatMoney(paid)}-өөс бага байж болохгүй`);
      return;
    }
    setSubmitting(true);
    try {
      const saved = editing
        ? await invoicesApi.update(editing.id, {
            description: description.trim(),
            amount: amountValue,
            discount: discountValue,
            due_date: dueDate,
            note: note.trim(),
          })
        : await invoicesApi.create({
            student_id: fixedStudent ? fixedStudent.id : Number(studentId),
            enrollment_id: fixedStudent
              ? fixedStudent.enrollmentId
              : enrollmentId !== NONE
                ? Number(enrollmentId)
                : undefined,
            description: description.trim(),
            amount: amountValue,
            discount: discountValue || undefined,
            due_date: dueDate,
            note: note.trim() || undefined,
          });
      toast.success(
        editing
          ? "Нэхэмжлэх шинэчлэгдлээ"
          : `Нэхэмжлэх ${formatDocNo(saved.number)} гарлаа`,
      );
      onSaved(saved);
    } catch (err) {
      toast.error(errorMessage(err, "Хадгалж чадсангүй"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {editing ? `Нэхэмжлэх ${formatDocNo(editing.number)} засах` : "Нэхэмжлэх гаргах"}
        </DialogTitle>
        <DialogDescription>
          {editing
            ? invoiceStudentName(editing)
            : fixedStudent
              ? fixedStudent.name
              : "Курсийн төлбөрөөс гадна сурах бичиг, шалгалтын хураамж зэрэгт. Элсэлтийн нэхэмжлэх автоматаар гардаг."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!editing && !fixedStudent && (
          <>
            <div className="space-y-2">
              <Label>Сурагч *</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Нэр, код, утсаар хайх..."
                disabled={submitting}
              />
              <Select
                value={studentId}
                onValueChange={(v) => {
                  setStudentId(v);
                  setEnrollmentId(NONE);
                }}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={studentOptions.length ? "Сурагч сонгох" : "Тохирох сурагч алга"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {studentOptions.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {studentDisplayName(s)}
                      {s.student_code ? ` · ${s.student_code}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selected && selected.groups.length > 0 && (
              <div className="space-y-2">
                <Label>Хамаарах бүлэг</Label>
                <Select value={enrollmentId} onValueChange={setEnrollmentId} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Холбохгүй (бусад орлого)</SelectItem>
                    {selected.groups.map((g) => (
                      <SelectItem key={g.enrollment_id} value={String(g.enrollment_id)}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="inv-desc">Тайлбар *</Label>
          <Input
            id="inv-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Жишээ: Сурах бичиг, Шалгалтын хураамж"
            required
            minLength={2}
            maxLength={200}
            disabled={submitting}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <AmountField
            id="inv-amount"
            label="Дүн (₮) *"
            value={amount}
            onChange={setAmount}
            disabled={submitting}
            required
          />
          <AmountField
            id="inv-discount"
            label="Хөнгөлөлт (₮)"
            value={discount}
            onChange={setDiscount}
            disabled={submitting}
          />
        </div>
        <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
          <SummaryRow label="Төлөх дүн" value={formatMoney(Math.max(0, total))} strong />
          {editing && paid > 0 && (
            <SummaryRow label="Үүнээс төлөгдсөн" value={formatMoney(paid)} />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv-due">Төлөх сүүлийн өдөр *</Label>
          <Input
            id="inv-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv-note">Дотоод тэмдэглэл</Label>
          <Input
            id="inv-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Сурагч, эцэг эхэд харагдахгүй"
            maxLength={500}
            disabled={submitting}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Болих
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Хадгалж байна..." : editing ? "Хадгалах" : "Нэхэмжлэх гаргах"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

/* ──────────────────────────────────────────────
   Нэхэмжлэхийн дэлгэрэнгүй: дүн, төлбөрүүд, үйлдлүүд
   ────────────────────────────────────────────── */
export function InvoiceDetailSheet({
  invoiceId,
  onOpenChange,
  onChanged,
}: {
  /** null = хаалттай */
  invoiceId: number | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  return (
    <Sheet open={invoiceId !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        {invoiceId !== null && (
          <InvoiceDetail key={invoiceId} invoiceId={invoiceId} onChanged={onChanged} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function InvoiceDetail({ invoiceId, onChanged }: { invoiceId: number; onChanged: () => void }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [failed, setFailed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [refunding, setRefunding] = useState<{ payment: Payment; refundable: number } | null>(
    null,
  );
  const [voidingPayment, setVoidingPayment] = useState<Payment | null>(null);

  const reload = useCallback(() => {
    invoicesApi
      .get(invoiceId)
      .then((inv) => {
        setInvoice(inv);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, [invoiceId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const refresh = () => {
    reload();
    onChanged();
  };

  // Төлбөр тус бүрээс буцаах боломжтой үлдэгдэл = дүн − баталгаажсан буцаалтууд
  const refundableOf = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of invoice?.payments ?? []) {
      if (p.kind === "payment" && p.status === "confirmed") map.set(p.id, p.amount);
    }
    for (const p of invoice?.payments ?? []) {
      if (p.kind === "refund" && p.status === "confirmed" && p.refund_of_id != null) {
        map.set(p.refund_of_id, (map.get(p.refund_of_id) ?? 0) - p.amount);
      }
    }
    return map;
  }, [invoice]);

  async function print(payment: Payment) {
    try {
      printReceipt(await paymentsApi.receipt(payment.id));
    } catch (err) {
      toast.error(errorMessage(err, "Баримт татаж чадсангүй"));
    }
  }

  async function restore() {
    if (!invoice) return;
    try {
      await invoicesApi.restore(invoice.id);
      toast.success("Нэхэмжлэх сэргээгдлээ");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Сэргээж чадсангүй"));
    }
  }

  if (failed) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Нэхэмжлэх</SheetTitle>
          <SheetDescription>Нэхэмжлэхийг ачаалж чадсангүй.</SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <Button variant="outline" onClick={reload}>
            Дахин оролдох
          </Button>
        </div>
      </>
    );
  }

  if (!invoice) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Нэхэмжлэх</SheetTitle>
          <SheetDescription>Ачаалж байна...</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </>
    );
  }

  const isVoid = invoice.status === "void";
  const student = invoice.student;
  const contact = student?.guardian_phone ?? student?.phone;
  const payments = invoice.payments ?? [];

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex flex-wrap items-center gap-2">
          <ReceiptText className="h-5 w-5 shrink-0 text-primary" />
          <span>Нэхэмжлэх {formatDocNo(invoice.number)}</span>
          <InvoiceStatusBadge invoice={invoice} />
        </SheetTitle>
        <SheetDescription>{invoice.description}</SheetDescription>
      </SheetHeader>

      <div className="scrollbar-slim flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {/* Сурагч */}
        <div className="rounded-lg border p-3">
          <p className="text-sm font-semibold text-foreground">
            {invoiceStudentName(invoice)}
            {student?.is_active === false && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">(идэвхгүй)</span>
            )}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
            {student?.student_code && <span>{student.student_code}</span>}
            {contact && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {contact}
                {student?.guardian_phone && student.guardian_name
                  ? ` (${student.guardian_name})`
                  : ""}
              </span>
            )}
            {invoice.class && <span>{invoice.class.name}</span>}
          </p>
        </div>

        {/* Дүн */}
        <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
          <SummaryRow label="Дүн" value={formatMoney(invoice.amount)} />
          {invoice.discount > 0 && (
            <SummaryRow label="Хөнгөлөлт" value={`−${formatMoney(invoice.discount)}`} />
          )}
          <SummaryRow label="Төлөх дүн" value={formatMoney(invoice.total)} />
          <SummaryRow label="Төлөгдсөн" value={formatMoney(invoice.paid_amount)} />
          <div className="border-t pt-1.5">
            <SummaryRow label="Үлдэгдэл" value={formatMoney(invoice.balance)} strong />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Төлөх сүүлийн өдөр</dt>
            <dd className="font-medium text-foreground">{formatDate(invoice.due_date)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Гарсан өдөр</dt>
            <dd className="font-medium text-foreground">{formatDate(invoice.created_at)}</dd>
          </div>
          {invoice.period_start && (
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Төлбөрийн үе</dt>
              <dd className="font-medium text-foreground">
                {formatDateRange(invoice.period_start, invoice.period_end)}
              </dd>
            </div>
          )}
          {invoice.note && (
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Дотоод тэмдэглэл</dt>
              <dd className="text-foreground">{invoice.note}</dd>
            </div>
          )}
          {isVoid && invoice.void_reason && (
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Хүчингүй болсон шалтгаан</dt>
              <dd className="text-foreground">{invoice.void_reason}</dd>
            </div>
          )}
        </dl>

        {/* Үйлдлүүд */}
        <div className="flex flex-wrap gap-2">
          {!isVoid && invoice.balance > 0 && (
            <Button className="gap-1.5" onClick={() => setPaying(true)}>
              <HandCoins className="h-4 w-4" />
              Төлбөр бүртгэх
            </Button>
          )}
          {!isVoid && (
            <Button variant="outline" className="gap-1.5" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              Засах
            </Button>
          )}
          {!isVoid && invoice.paid_amount === 0 && (
            <Button
              variant="outline"
              className="gap-1.5 text-destructive hover:bg-destructive/10"
              onClick={() => setVoiding(true)}
            >
              <XCircle className="h-4 w-4" />
              Хүчингүй болгох
            </Button>
          )}
          {isVoid && (
            <Button variant="outline" className="gap-1.5" onClick={restore}>
              <RotateCcw className="h-4 w-4" />
              Сэргээх
            </Button>
          )}
        </div>
        {!isVoid && invoice.paid_amount > 0 && (
          <p className="text-xs text-muted-foreground">
            Мөнгө орсон нэхэмжлэхийг хүчингүй болгохын тулд эхлээд төлбөрийг буцаах эсвэл
            (андуурсан бол) цуцална.
          </p>
        )}

        {/* Төлбөрүүд */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">
            Төлбөрийн түүх ({payments.length})
          </p>
          {payments.length === 0 ? (
            <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
              Төлбөр бүртгэгдээгүй байна
            </p>
          ) : (
            <div className="space-y-1.5">
              {payments.map((p) => {
                const voided = p.status === "voided";
                const isRefund = p.kind === "refund";
                const refundable = refundableOf.get(p.id) ?? 0;
                return (
                  <div
                    key={p.id}
                    className={`flex items-start gap-3 rounded-lg border p-2.5 ${voided ? "bg-muted/40" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 text-sm">
                        <span
                          className={`font-semibold tabular-nums ${voided ? "text-muted-foreground line-through" : "text-foreground"}`}
                        >
                          {isRefund ? "−" : "+"}
                          {formatMoney(p.amount)}
                        </span>
                        {isRefund && !voided && (
                          <Pill tone="amber" icon={Undo2}>
                            Буцаалт
                          </Pill>
                        )}
                        {voided && (
                          <Pill tone="slate" icon={Ban}>
                            Цуцлагдсан
                          </Pill>
                        )}
                      </p>
                      <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                        <span>{formatDate(p.paid_on)}</span>
                        <span>{PAYMENT_METHOD_LABELS[p.method]}</span>
                        <span>{formatDocNo(p.receipt_no)}</span>
                        {p.received_by_name && <span>{p.received_by_name}</span>}
                      </p>
                      {(p.reference || p.note || p.void_reason) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[
                            p.reference,
                            p.note,
                            p.void_reason ? `Цуцалсан шалтгаан: ${p.void_reason}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" title="Үйлдэл" className="shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => print(p)}>
                          <Printer className="mr-2 h-4 w-4" /> Баримт хэвлэх
                        </DropdownMenuItem>
                        {!voided && !isRefund && refundable > 0 && (
                          <DropdownMenuItem
                            onClick={() => setRefunding({ payment: p, refundable })}
                          >
                            <Undo2 className="mr-2 h-4 w-4" /> Буцаалт хийх
                          </DropdownMenuItem>
                        )}
                        {!voided && p.method !== "qpay" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setVoidingPayment(p)}
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Андуурсан бүртгэл — цуцлах
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <PaymentDialog
        invoice={paying ? invoice : null}
        onOpenChange={setPaying}
        onSaved={refresh}
      />
      <InvoiceFormDialog
        open={editing}
        onOpenChange={setEditing}
        editing={invoice}
        onSaved={refresh}
      />
      <RefundDialog
        target={refunding}
        invoice={invoice}
        onOpenChange={(v) => !v && setRefunding(null)}
        onDone={refresh}
      />
      <ReasonDialog
        open={voiding}
        onOpenChange={setVoiding}
        title="Нэхэмжлэхийг хүчингүй болгох"
        description={`${formatDocNo(invoice.number)} — ${formatMoney(invoice.total)}. Авлагаас хасагдана; дараа нь сэргээж болно.`}
        confirmLabel="Хүчингүй болгох"
        onConfirm={async (reason) => {
          await invoicesApi.void(invoice.id, reason);
          toast.success("Нэхэмжлэх хүчингүй боллоо");
          refresh();
        }}
      />
      <ReasonDialog
        open={!!voidingPayment}
        onOpenChange={(v) => !v && setVoidingPayment(null)}
        title={voidingPayment?.kind === "refund" ? "Буцаалтын бүртгэлийг цуцлах" : "Төлбөрийн бүртгэлийг цуцлах"}
        description={
          voidingPayment
            ? `${formatMoney(voidingPayment.amount)} (${formatDocNo(voidingPayment.receipt_no)}). Зөвхөн АНДУУРЧ бүртгэсэн үед — мөнгө бодитоор буцааж өгсөн бол "Буцаалт хийх"-ийг ашиглана.`
            : ""
        }
        confirmLabel="Бүртгэлийг цуцлах"
        onConfirm={async (reason) => {
          if (!voidingPayment) return;
          await paymentsApi.void(voidingPayment.id, reason);
          toast.success("Бүртгэл цуцлагдлаа");
          refresh();
        }}
      />
    </>
  );
}

/* ──────────────────────────────────────────────
   Нэг сурагчийн нэхэмжлэхүүд — бүлгийн жагсаалт, сурагчийн жагсаалт, өрийн
   жагсаалтаас шууд төлбөр авахад
   ────────────────────────────────────────────── */
export function StudentInvoicesDialog({
  student,
  onOpenChange,
  onChanged,
}: {
  /** null = хаалттай. `enrollmentId` өгвөл зөвхөн тэр элсэлтийн нэхэмжлэхүүд. */
  student: FixedStudent | null;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}) {
  return (
    <Dialog open={!!student} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {student && (
          <StudentInvoices
            key={`${student.id}-${student.enrollmentId ?? "all"}`}
            student={student}
            onChanged={onChanged}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StudentInvoices({
  student,
  onChanged,
}: {
  student: FixedStudent;
  onChanged?: () => void;
}) {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const reload = useCallback(() => {
    invoicesApi
      .list({
        student_id: student.id,
        enrollment_id: student.enrollmentId,
        status: "all",
        limit: 100,
      })
      .then((res) => setInvoices(res.items))
      .catch(() => setInvoices([]));
  }, [student.id, student.enrollmentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const refresh = () => {
    reload();
    onChanged?.();
  };

  const balance = (invoices ?? []).reduce((sum, i) => sum + i.balance, 0);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Төлбөр, нэхэмжлэх</DialogTitle>
        <DialogDescription>
          {student.name}
          {invoices && invoices.length > 0 && (
            <>
              {" · "}
              {balance > 0 ? `Үлдэгдэл ${formatMoney(balance)}` : "Үлдэгдэлгүй"}
            </>
          )}
        </DialogDescription>
      </DialogHeader>

      {invoices === null ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : invoices.length === 0 ? (
        <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          Нэхэмжлэх гараагүй байна
        </p>
      ) : (
        <div className="space-y-1.5">
          {invoices.map((inv) => (
            <div key={inv.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <button
                  type="button"
                  onClick={() => setDetailId(inv.id)}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {formatDocNo(inv.number)}
                </button>
                <InvoiceStatusBadge invoice={inv} />
                <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
                  {formatMoney(inv.total)}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{inv.description}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Хугацаа {formatDate(inv.due_date)}
                  {inv.status !== "void" && inv.balance > 0 && (
                    <>
                      {" · "}
                      <span className="font-medium text-foreground">
                        Үлдэгдэл {formatMoney(inv.balance)}
                      </span>
                    </>
                  )}
                </p>
                {inv.status !== "void" && inv.balance > 0 && (
                  <Button size="sm" className="gap-1.5" onClick={() => setPaying(inv)}>
                    <HandCoins className="h-3.5 w-3.5" />
                    Төлбөр авах
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" className="gap-1.5" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Нэхэмжлэх гаргах
        </Button>
      </DialogFooter>

      <PaymentDialog
        invoice={paying}
        onOpenChange={(v) => !v && setPaying(null)}
        onSaved={refresh}
      />
      <InvoiceDetailSheet
        invoiceId={detailId}
        onOpenChange={(v) => !v && setDetailId(null)}
        onChanged={refresh}
      />
      <InvoiceFormDialog
        open={creating}
        onOpenChange={setCreating}
        fixedStudent={student}
        onSaved={refresh}
      />
    </>
  );
}
