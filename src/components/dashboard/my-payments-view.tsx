"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader, Pill } from "@/components/ui/dashboard-ui";
import { AlertTriangle, CheckCircle2, CircleDashed, Clock, Undo2, Wallet } from "lucide-react";
import { invoicesApi, studentDisplayName, type MyInvoice } from "@/lib/api";
import { formatDate, formatDateRange, formatDocNo, formatMoney } from "@/lib/format";
import { INVOICE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/terms";

function StatusPill({ invoice }: { invoice: MyInvoice }) {
  if (invoice.is_overdue) {
    return (
      <Pill tone="rose" icon={AlertTriangle}>
        Хугацаа хэтэрсэн · {invoice.days_overdue} хоног
      </Pill>
    );
  }
  if (invoice.status === "paid") {
    return (
      <Pill tone="emerald" icon={CheckCircle2}>
        {INVOICE_STATUS_LABELS.paid}
      </Pill>
    );
  }
  if (invoice.status === "partially_paid") {
    return (
      <Pill tone="navy" icon={CircleDashed}>
        {INVOICE_STATUS_LABELS.partially_paid}
      </Pill>
    );
  }
  return (
    <Pill tone="amber" icon={Clock}>
      {INVOICE_STATUS_LABELS.issued}
    </Pill>
  );
}

/**
 * Төлбөр — сурагч өөрийн, эцэг эх хүүхдүүдийнхээ нэхэмжлэх, төлбөрийн түүхийг харна.
 * Зөвхөн унших: төлбөрийг төвийн ажилтан бүртгэдэг.
 */
export function MyPaymentsView() {
  const [invoices, setInvoices] = useState<MyInvoice[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    invoicesApi
      .mine()
      .then(setInvoices)
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <div className="p-6">
        <EmptyState icon={AlertTriangle} title="Төлбөрийн мэдээллийг ачаалж чадсангүй" />
      </div>
    );
  }

  if (!invoices) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
      </div>
    );
  }

  const balance = invoices.reduce((sum, i) => sum + i.balance, 0);
  const overdue = invoices.filter((i) => i.is_overdue).reduce((sum, i) => sum + i.balance, 0);
  // Эцэг эх хэд хэдэн хүүхэдтэй бол хүүхэд бүрээр бүлэглэнэ
  const studentIds = [...new Set(invoices.map((i) => i.student_id))];
  const multiple = studentIds.length > 1;

  return (
    <div className="animate-in-rise mx-auto max-w-3xl space-y-5 p-6">
      <PageHeader
        icon={Wallet}
        title="Төлбөр"
        description="Сургалтын төлбөрийн нэхэмжлэх, төлсөн түүх"
      />

      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <EmptyState
            icon={Wallet}
            title="Нэхэмжлэх алга"
            description="Танд одоогоор төлбөрийн нэхэмжлэх гараагүй байна."
          />
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Төлөх үлдэгдэл</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-foreground">
              {formatMoney(balance)}
            </p>
            {overdue > 0 ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-foreground">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                Үүнээс {formatMoney(overdue)} нь хугацаа хэтэрсэн
              </p>
            ) : balance === 0 ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                Бүх төлбөр төлөгдсөн
              </p>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">
              Төлбөрийг төвийн ажилтан бүртгэнэ. Тодруулах зүйл байвал төвтэйгээ холбогдоно уу.
            </p>
          </div>

          {studentIds.map((studentId) => {
            const list = invoices.filter((i) => i.student_id === studentId);
            const student = list[0]?.student;
            return (
              <section key={studentId} className="space-y-3">
                {multiple && (
                  <h2 className="text-sm font-semibold text-foreground">
                    {student ? studentDisplayName(student) : "Сурагч"}
                  </h2>
                )}
                {list.map((inv) => (
                  <article
                    key={inv.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{inv.description}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDocNo(inv.number)}
                          {inv.period_start
                            ? ` · ${formatDateRange(inv.period_start, inv.period_end)}`
                            : ""}
                          {` · Төлөх хугацаа ${formatDate(inv.due_date)}`}
                        </p>
                      </div>
                      <StatusPill invoice={inv} />
                    </div>

                    <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-muted/40 p-2">
                        <dt className="text-[11px] text-muted-foreground">Төлөх дүн</dt>
                        <dd className="text-sm font-semibold tabular-nums text-foreground">
                          {formatMoney(inv.total)}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <dt className="text-[11px] text-muted-foreground">Төлсөн</dt>
                        <dd className="text-sm font-semibold tabular-nums text-foreground">
                          {formatMoney(inv.paid_amount)}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <dt className="text-[11px] text-muted-foreground">Үлдэгдэл</dt>
                        <dd className="text-sm font-semibold tabular-nums text-foreground">
                          {formatMoney(inv.balance)}
                        </dd>
                      </div>
                    </dl>

                    {inv.discount > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Үндсэн үнэ {formatMoney(inv.amount)} · хөнгөлөлт{" "}
                        {formatMoney(inv.discount)}
                      </p>
                    )}

                    {inv.payments.length > 0 && (
                      <ul className="mt-3 space-y-1 border-t pt-3">
                        {inv.payments.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center justify-between gap-3 text-xs"
                          >
                            <span className="flex min-w-0 flex-wrap items-center gap-x-2 text-muted-foreground">
                              <span>{formatDate(p.paid_on)}</span>
                              <span>{PAYMENT_METHOD_LABELS[p.method]}</span>
                              <span>{formatDocNo(p.receipt_no)}</span>
                              {p.kind === "refund" && (
                                <Pill tone="amber" icon={Undo2}>
                                  Буцаалт
                                </Pill>
                              )}
                            </span>
                            <span className="shrink-0 font-semibold tabular-nums text-foreground">
                              {p.kind === "refund" ? "−" : "+"}
                              {formatMoney(p.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
