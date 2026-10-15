"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, Pill, SectionCard, StatCard } from "@/components/ui/dashboard-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  AlertTriangle,
  Ban,
  Banknote,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  HandCoins,
  MoreVertical,
  Phone,
  Plus,
  Printer,
  ReceiptText,
  Search,
  TrendingUp,
  Undo2,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  InvoiceDetailSheet,
  InvoiceFormDialog,
  InvoiceStatusBadge,
  PaymentDialog,
  StudentInvoicesDialog,
  invoiceStudentName,
  type FixedStudent,
} from "@/components/dashboard/admin/finance-dialogs";
import { BarList, MonthlyRevenueChart } from "@/components/dashboard/admin/finance-charts";
import {
  financeApi,
  invoicesApi,
  paymentsApi,
  studentsApi,
  studentDisplayName,
  type DebtorsReport,
  type FinanceSummary,
  type Invoice,
  type InvoiceListStatus,
  type LedgerPayment,
  type MoneyFlow,
  type PagedResult,
  type PaymentMethod,
  type RevenueReport,
  type Student,
} from "@/lib/api";
import {
  addDaysLocal,
  formatDate,
  formatDocNo,
  formatMoney,
  formatMonth,
  monthStartLocal,
  todayLocal,
} from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/terms";
import { printReceipt } from "@/lib/print-receipt";

type TabKey = "invoices" | "debtors" | "payments" | "revenue";

const PAGE_SIZE = 25;
const ALL = "all";

/** Шүүлтийн товч (сонгосон нь дүүрэн өнгөтэй) */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

function Pager({
  page,
  count,
  onPage,
}: {
  page: number;
  count: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 border-t px-4 py-2.5">
      <span className="text-xs text-muted-foreground">
        {page} / {pages}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        title="Өмнөх"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        title="Дараах"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/** Төлбөр — нэхэмжлэх, өрийн жагсаалт, гүйлгээ, орлогын тайлан */
export function AdminFinance() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [tab, setTab] = useState<TabKey>("invoices");
  // Аль нэг үйлдэл мөнгөн дүнг өөрчлөх бүрд нэмэгдэнэ → тойм ба идэвхтэй таб дахин ачаална
  const [version, setVersion] = useState(0);
  const [studentFilter, setStudentFilter] = useState<FixedStudent | null>(null);
  const [students, setStudents] = useState<Student[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    financeApi
      .summary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [version]);

  const changed = useCallback(() => setVersion((v) => v + 1), []);

  async function openCreate() {
    if (!students) setStudents(await studentsApi.list().catch(() => [] as Student[]));
    setCreating(true);
  }

  async function generateMonthly() {
    setGenerating(true);
    try {
      const r = await invoicesApi.generateMonthly();
      if (r.created > 0) toast.success(`${r.created} сарын нэхэмжлэх үүслээ`);
      else toast.info("Одоо үүсгэх сарын нэхэмжлэх алга — хугацаа нь болоогүй байна");
      if (r.errors > 0) toast.error(`${r.errors} нэхэмжлэх үүсгэхэд алдаа гарлаа`);
      changed();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Үүсгэж чадсангүй");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Төлбөр</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Хэн төлсөн, хэн өртэй, хэд орсныг нэг дороос.
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" title="Бусад үйлдэл">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={generating} onClick={generateMonthly}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Сарын нэхэмжлэхийг одоо үүсгэх
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="amber" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Нэхэмжлэх гаргах
          </Button>
        </div>
      </div>

      {/* Тойм — одоогийн байдал (доорх табын шүүлтээс хамаарахгүй) */}
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={TrendingUp}
            tone="emerald"
            label="Энэ сард орсон"
            value={formatMoney(summary.collected_this_month)}
            hint={`Өнгөрсөн сард нийт ${formatMoney(summary.collected_prev_month)}`}
          />
          <StatCard
            icon={Banknote}
            tone="navy"
            label="Өнөөдөр орсон"
            value={formatMoney(summary.collected_today)}
            hint={formatDate(summary.today)}
          />
          <StatCard
            icon={Wallet}
            tone="amber"
            label="Нийт авлага"
            value={formatMoney(summary.outstanding)}
            hint={`${summary.open_invoice_count} нэхэмжлэх · ${summary.debtor_count} сурагч`}
          />
          <StatCard
            icon={AlertTriangle}
            tone="rose"
            label="Хугацаа хэтэрсэн"
            value={formatMoney(summary.overdue)}
            hint={`${summary.overdue_invoice_count} нэхэмжлэх`}
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="gap-4">
        <TabsList>
          <TabsTrigger value="invoices">Нэхэмжлэх</TabsTrigger>
          <TabsTrigger value="debtors">Өрийн жагсаалт</TabsTrigger>
          <TabsTrigger value="payments">Гүйлгээ</TabsTrigger>
          <TabsTrigger value="revenue">Орлого</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <InvoicesTab
            key={studentFilter?.id ?? ALL}
            version={version}
            onChanged={changed}
            student={studentFilter}
            onClearStudent={() => setStudentFilter(null)}
          />
        </TabsContent>
        <TabsContent value="debtors">
          <DebtorsTab
            version={version}
            onChanged={changed}
            onShowInvoices={(s) => {
              setStudentFilter(s);
              setTab("invoices");
            }}
          />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsTab version={version} onChanged={changed} />
        </TabsContent>
        <TabsContent value="revenue">
          <RevenueTab version={version} />
        </TabsContent>
      </Tabs>

      <InvoiceFormDialog
        open={creating}
        onOpenChange={setCreating}
        students={students ?? []}
        onSaved={changed}
      />
    </div>
  );
}

/* ══════════════════════════ Нэхэмжлэх ══════════════════════════ */

const STATUS_FILTERS: Array<{ key: InvoiceListStatus; label: string }> = [
  { key: "open", label: "Төлөгдөөгүй" },
  { key: "overdue", label: "Хугацаа хэтэрсэн" },
  { key: "paid", label: "Төлөгдсөн" },
  { key: "void", label: "Хүчингүй" },
  { key: "all", label: "Бүгд" },
];

type InvoicePage = PagedResult<Invoice, { total: number; paid: number; balance: number }>;

function InvoicesTab({
  version,
  onChanged,
  student,
  onClearStudent,
}: {
  version: number;
  onChanged: () => void;
  student: FixedStudent | null;
  onClearStudent: () => void;
}) {
  const [status, setStatus] = useState<InvoiceListStatus>("open");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<InvoicePage | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  // Бичиж дуусахыг хүлээж хайна (товчлуур бүрд хүсэлт илгээхгүй)
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const studentId = student?.id;
  const requestKey = JSON.stringify([status, query, page, studentId ?? null, version]);
  useEffect(() => {
    let cancelled = false;
    invoicesApi
      .list({
        status,
        q: query || undefined,
        student_id: studentId,
        page,
        limit: PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLoadedKey(requestKey);
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [status, query, page, studentId, requestKey]);
  const loading = loadedKey !== requestKey;

  const items = data?.items ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Сурагчийн нэр, утас, № ..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <Chip
              key={f.key}
              active={status === f.key}
              onClick={() => {
                setStatus(f.key);
                setPage(1);
              }}
            >
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      {student && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Сурагч:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pl-3 pr-1 text-xs font-semibold text-primary">
            {student.name}
            <button
              type="button"
              onClick={onClearStudent}
              title="Шүүлтийг арилгах"
              className="rounded-full p-0.5 hover:bg-primary/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {!data && loading ? (
            <ListSkeleton />
          ) : items.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Нэхэмжлэх олдсонгүй"
              description={
                status === "open"
                  ? "Төлөгдөөгүй нэхэмжлэх алга. Сурагчийг үнэтэй бүлэгт элсүүлэхэд нэхэмжлэх автоматаар гарна."
                  : "Энэ шүүлтэд тохирох нэхэмжлэх алга."
              }
            />
          ) : (
            // Дахин ачаалах үед өмнөх жагсаалтыг бүдгэрүүлж барина (үсрэхгүй)
            <div className={`divide-y transition-opacity ${loading ? "opacity-60" : ""}`}>
              {items.map((inv) => {
                const open = inv.status === "issued" || inv.status === "partially_paid";
                return (
                  <div
                    key={inv.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailId(inv.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target === e.currentTarget) setDetailId(inv.id);
                    }}
                    className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 p-4 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                  >
                    <div className="min-w-0 flex-1 basis-52">
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {invoiceStudentName(inv)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDocNo(inv.number)}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{inv.description}</p>
                    </div>
                    <div className="flex flex-col items-start gap-1 sm:items-end">
                      <InvoiceStatusBadge invoice={inv} />
                      <span className="text-xs text-muted-foreground">
                        Хугацаа {formatDate(inv.due_date)}
                      </span>
                    </div>
                    <div className="w-32 shrink-0 text-right">
                      <p
                        className={`text-sm font-semibold tabular-nums ${
                          inv.status === "void"
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }`}
                      >
                        {formatMoney(open ? inv.balance : inv.total)}
                      </p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {open
                          ? inv.paid_amount > 0
                            ? `${formatMoney(inv.total)}-өөс`
                            : "үлдэгдэл"
                          : inv.status === "paid"
                            ? "төлөгдсөн"
                            : ""}
                      </p>
                    </div>
                    <div className="w-28 shrink-0 text-right">
                      {open && (
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaying(inv);
                          }}
                        >
                          <HandCoins className="h-3.5 w-3.5" />
                          Төлбөр авах
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {data && items.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
                <span>{data.count} нэхэмжлэх</span>
                <span>
                  Нийт{" "}
                  <span className="font-semibold text-foreground">
                    {formatMoney(data.totals.total)}
                  </span>
                </span>
                <span>
                  Төлөгдсөн{" "}
                  <span className="font-semibold text-foreground">
                    {formatMoney(data.totals.paid)}
                  </span>
                </span>
                <span>
                  Үлдэгдэл{" "}
                  <span className="font-semibold text-foreground">
                    {formatMoney(data.totals.balance)}
                  </span>
                </span>
              </div>
              <Pager page={page} count={data.count} onPage={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <PaymentDialog
        invoice={paying}
        onOpenChange={(v) => !v && setPaying(null)}
        onSaved={onChanged}
      />
      <InvoiceDetailSheet
        invoiceId={detailId}
        onOpenChange={(v) => !v && setDetailId(null)}
        onChanged={onChanged}
      />
    </div>
  );
}

/* ══════════════════════════ Өрийн жагсаалт ══════════════════════════ */

function DebtorsTab({
  version,
  onChanged,
  onShowInvoices,
}: {
  version: number;
  onChanged: () => void;
  onShowInvoices: (student: FixedStudent) => void;
}) {
  const [report, setReport] = useState<DebtorsReport | null>(null);
  const [failed, setFailed] = useState(false);
  const [collecting, setCollecting] = useState<FixedStudent | null>(null);

  useEffect(() => {
    financeApi
      .debtors()
      .then((r) => {
        setReport(r);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, [version]);

  async function exportExcel() {
    if (!report) return;
    try {
      const XLSX = await import("xlsx");
      const rows = report.items.map((d) => ({
        Сурагч: studentDisplayName(d),
        Код: d.student_code ?? "",
        "Сурагчийн утас": d.phone ?? "",
        "Асран хамгаалагч": d.guardian_name ?? "",
        "Асран хамгаалагчийн утас": d.guardian_phone ?? "",
        Бүлэг: d.groups.join(", "),
        "Нэхэмжлэхийн тоо": d.invoice_count,
        "Үлдэгдэл (₮)": d.balance,
        "Хугацаа хэтэрсэн (₮)": d.overdue,
        "Хэтэрсэн хоног": d.days_overdue,
      }));
      const sheet = XLSX.utils.json_to_sheet(rows);
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "Өрийн жагсаалт");
      XLSX.writeFile(book, `uriin-jagsaalt-${report.today}.xlsx`);
    } catch {
      toast.error("Файл үүсгэж чадсангүй");
    }
  }

  if (failed) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState icon={AlertTriangle} title="Өрийн жагсаалтыг ачаалж чадсангүй" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {report ? (
            <>
              {report.totals.count} сурагч · нийт авлага{" "}
              <span className="font-semibold text-foreground">
                {formatMoney(report.totals.balance)}
              </span>
              {report.totals.overdue > 0 && (
                <>
                  {" "}
                  · үүнээс хугацаа хэтэрсэн{" "}
                  <span className="font-semibold text-foreground">
                    {formatMoney(report.totals.overdue)}
                  </span>
                </>
              )}
            </>
          ) : (
            "Ачаалж байна..."
          )}
        </p>
        <Button
          variant="outline"
          className="gap-2"
          disabled={!report || report.items.length === 0}
          onClick={exportExcel}
        >
          <Download className="h-4 w-4" />
          Excel татах
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {!report ? (
            <ListSkeleton />
          ) : report.items.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Өртэй сурагч алга"
              description="Бүх нэхэмжлэх төлөгдсөн байна."
            />
          ) : (
            <div className="divide-y">
              {report.items.map((d) => {
                const name = studentDisplayName(d);
                const contact = d.guardian_phone ?? d.phone;
                return (
                  <div
                    key={d.student_id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1 basis-52">
                      <p className="flex flex-wrap items-center gap-x-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {name}
                        </span>
                        {!d.is_active && <Pill tone="slate">Идэвхгүй</Pill>}
                      </p>
                      <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        {contact && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact}
                            {d.guardian_phone && d.guardian_name ? ` (${d.guardian_name})` : ""}
                          </span>
                        )}
                        {d.groups.length > 0 && <span className="truncate">{d.groups.join(", ")}</span>}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {d.overdue > 0 ? (
                        <Pill tone="rose" icon={AlertTriangle}>
                          {d.days_overdue} хоног хэтэрсэн
                        </Pill>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Хугацаа {formatDate(d.oldest_due)}
                        </span>
                      )}
                    </div>
                    <div className="w-32 shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {formatMoney(d.balance)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {d.invoice_count} нэхэмжлэх
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setCollecting({ id: d.student_id, name })}
                      >
                        <HandCoins className="h-3.5 w-3.5" />
                        Төлбөр авах
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onShowInvoices({ id: d.student_id, name })}
                      >
                        Нэхэмжлэх
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <StudentInvoicesDialog
        student={collecting}
        onOpenChange={(v) => !v && setCollecting(null)}
        onChanged={onChanged}
      />
    </div>
  );
}

/* ══════════════════════════ Гүйлгээ (дэвтэр) ══════════════════════════ */

function PaymentsTab({ version, onChanged }: { version: number; onChanged: () => void }) {
  const [today] = useState(todayLocal);
  const [from, setFrom] = useState(() => monthStartLocal(todayLocal()));
  const [to, setTo] = useState(today);
  const [method, setMethod] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedResult<LedgerPayment, MoneyFlow> | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);

  const requestKey = JSON.stringify([from, to, method, page, version]);
  useEffect(() => {
    let cancelled = false;
    paymentsApi
      .list({
        from: from || undefined,
        to: to || undefined,
        method: method === ALL ? undefined : (method as PaymentMethod),
        page,
        limit: PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLoadedKey(requestKey);
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, method, page, requestKey]);
  const loading = loadedKey !== requestKey;
  const items = data?.items ?? [];

  async function print(p: LedgerPayment) {
    try {
      printReceipt(await paymentsApi.receipt(p.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Баримт татаж чадсангүй");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          aria-label="Эхлэх өдөр"
          value={from}
          max={to || today}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
          className="w-40"
        />
        <span className="text-sm text-muted-foreground">–</span>
        <Input
          type="date"
          aria-label="Дуусах өдөр"
          value={to}
          min={from}
          max={today}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
          className="w-40"
        />
        <Select
          value={method}
          onValueChange={(v) => {
            setMethod(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Бүх хэлбэр</SelectItem>
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
              <SelectItem key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {!data && loading ? (
            <ListSkeleton />
          ) : items.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="Гүйлгээ алга"
              description="Сонгосон хугацаанд төлбөр бүртгэгдээгүй байна."
            />
          ) : (
            <div className={`divide-y transition-opacity ${loading ? "opacity-60" : ""}`}>
              {items.map((p) => {
                const voided = p.status === "voided";
                const isRefund = p.kind === "refund";
                return (
                  <div
                    key={p.id}
                    className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 p-4 ${voided ? "bg-muted/30" : ""}`}
                  >
                    <div className="w-24 shrink-0 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">{formatDate(p.paid_on)}</p>
                      <p>{formatDocNo(p.receipt_no)}</p>
                    </div>
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {p.student ? studentDisplayName(p.student) : "—"}
                      </p>
                      <button
                        type="button"
                        onClick={() => setDetailId(p.invoice.id)}
                        className="max-w-full truncate text-left text-xs text-primary hover:underline"
                      >
                        {formatDocNo(p.invoice.number)} · {p.invoice.description}
                      </button>
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                      <span className="text-xs text-muted-foreground">
                        {PAYMENT_METHOD_LABELS[p.method]}
                        {p.received_by_name ? ` · ${p.received_by_name}` : ""}
                      </span>
                      {voided ? (
                        <Pill tone="slate" icon={Ban}>
                          Цуцлагдсан
                        </Pill>
                      ) : isRefund ? (
                        <Pill tone="amber" icon={Undo2}>
                          Буцаалт
                        </Pill>
                      ) : null}
                    </div>
                    <p
                      className={`w-32 shrink-0 text-right text-sm font-semibold tabular-nums ${
                        voided ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {isRefund ? "−" : "+"}
                      {formatMoney(p.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Баримт хэвлэх"
                      className="shrink-0"
                      onClick={() => print(p)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          {data && items.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
                <span>{data.count} мөр</span>
                <span>
                  Орсон{" "}
                  <span className="font-semibold text-foreground">
                    {formatMoney(data.totals.collected)}
                  </span>
                </span>
                <span>
                  Буцаасан{" "}
                  <span className="font-semibold text-foreground">
                    {formatMoney(data.totals.refunded)}
                  </span>
                </span>
                <span>
                  Цэвэр{" "}
                  <span className="font-semibold text-foreground">
                    {formatMoney(data.totals.net)}
                  </span>
                </span>
              </div>
              <Pager page={page} count={data.count} onPage={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <InvoiceDetailSheet
        invoiceId={detailId}
        onOpenChange={(v) => !v && setDetailId(null)}
        onChanged={onChanged}
      />
    </div>
  );
}

/* ══════════════════════════ Орлого ══════════════════════════ */

interface RangePreset {
  key: string;
  label: string;
  from: string;
  to: string;
}

function buildPresets(today: string): RangePreset[] {
  const thisMonth = monthStartLocal(today);
  return [
    { key: "this-month", label: "Энэ сар", from: thisMonth, to: today },
    {
      key: "last-month",
      label: "Өнгөрсөн сар",
      from: monthStartLocal(today, -1),
      to: addDaysLocal(thisMonth, -1),
    },
    { key: "3m", label: "Сүүлийн 3 сар", from: monthStartLocal(today, -2), to: today },
    { key: "6m", label: "Сүүлийн 6 сар", from: monthStartLocal(today, -5), to: today },
    { key: "year", label: "Энэ жил", from: `${today.slice(0, 4)}-01-01`, to: today },
  ];
}

function RevenueTab({ version }: { version: number }) {
  const [today] = useState(todayLocal);
  const [presets] = useState(() => buildPresets(todayLocal()));
  const [range, setRange] = useState<{ key: string; from: string; to: string }>(
    () => buildPresets(todayLocal())[3],
  );
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { from, to } = range;
  const valid = !!from && !!to && from <= to;
  const requestKey = JSON.stringify([from, to, version]);
  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    financeApi
      .revenue(from, to)
      .then((r) => {
        if (cancelled) return;
        setReport(r);
        setError(null);
        setLoadedKey(requestKey);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Тайланг ачаалж чадсангүй");
        setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, valid, requestKey]);
  const loading = valid && loadedKey !== requestKey;

  const hasData = !!report && (report.totals.collected > 0 || report.totals.refunded > 0);

  return (
    <div className="space-y-4">
      {/* Шүүлт: нэг мөр, доорх бүх тоо, графикт үйлчилнэ */}
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <Chip
            key={p.key}
            active={range.key === p.key}
            onClick={() => setRange({ key: p.key, from: p.from, to: p.to })}
          >
            {p.label}
          </Chip>
        ))}
        <div className="flex items-center gap-2 sm:ml-2">
          <Input
            type="date"
            aria-label="Эхлэх өдөр"
            value={range.from}
            max={range.to || today}
            onChange={(e) => setRange((r) => ({ ...r, key: "custom", from: e.target.value }))}
            className="w-40"
          />
          <span className="text-sm text-muted-foreground">–</span>
          <Input
            type="date"
            aria-label="Дуусах өдөр"
            value={range.to}
            min={range.from}
            max={today}
            onChange={(e) => setRange((r) => ({ ...r, key: "custom", to: e.target.value }))}
            className="w-40"
          />
        </div>
      </div>

      {error && !loading ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState icon={AlertTriangle} title="Тайланг харуулах боломжгүй" description={error} />
          </CardContent>
        </Card>
      ) : !report ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">
              Цэвэр орлого · {formatDate(report.from)} – {formatDate(report.to)}
            </p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {formatMoney(report.totals.net)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Орсон{" "}
              <span className="font-semibold text-foreground">
                {formatMoney(report.totals.collected)}
              </span>
              {" · "}Буцаасан{" "}
              <span className="font-semibold text-foreground">
                {formatMoney(report.totals.refunded)}
              </span>
            </p>
          </div>

          {!hasData ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icon={TrendingUp}
                  title="Энэ хугацаанд орлого бүртгэгдээгүй"
                  description="Төлбөр бүртгэхэд орлого энд харагдана."
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {report.by_month.length > 1 && (
                <SectionCard
                  icon={TrendingUp}
                  title="Сар бүрийн цэвэр орлого"
                  description="Мөнгө орсон өдрөөр (орсон − буцаасан)"
                >
                  <MonthlyRevenueChart data={report.by_month} />
                  {/* Хүснэгтэн хэлбэр — графикийн утга бүрийг хулганагүйгээр уншина */}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-96 text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="py-2 font-medium">Сар</th>
                          <th className="py-2 text-right font-medium">Орсон</th>
                          <th className="py-2 text-right font-medium">Буцаасан</th>
                          <th className="py-2 text-right font-medium">Цэвэр</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.by_month.map((m) => (
                          <tr key={m.month} className="border-b last:border-0">
                            <td className="py-2 text-foreground">{formatMonth(m.month)}</td>
                            <td className="py-2 text-right tabular-nums text-foreground">
                              {formatMoney(m.collected)}
                            </td>
                            <td className="py-2 text-right tabular-nums text-foreground">
                              {formatMoney(m.refunded)}
                            </td>
                            <td className="py-2 text-right font-semibold tabular-nums text-foreground">
                              {formatMoney(m.net)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard title="Курсээр" description="Цэвэр орлого">
                  <BarList
                    rows={report.by_course.map((c) => ({
                      key: String(c.course_id ?? "other"),
                      label: c.course_name ?? "Бусад (курстэй холбоогүй)",
                      value: c.net,
                      sub:
                        `${c.students} сурагч` +
                        (c.refunded > 0 ? ` · буцаалт ${formatMoney(c.refunded)}` : ""),
                    }))}
                  />
                </SectionCard>
                <SectionCard title="Төлбөрийн хэлбэрээр" description="Цэвэр орлого">
                  <BarList
                    rows={report.by_method.map((m) => ({
                      key: m.method,
                      label: PAYMENT_METHOD_LABELS[m.method],
                      value: m.net,
                      sub: m.refunded > 0 ? `буцаалт ${formatMoney(m.refunded)}` : undefined,
                    }))}
                  />
                </SectionCard>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
