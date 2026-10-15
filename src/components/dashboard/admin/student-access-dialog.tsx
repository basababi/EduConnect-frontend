"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/ui/dashboard-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Clock, Copy, KeyRound, Send, Smartphone, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import {
  accessApi,
  type AccessAccount,
  type CodeDelivery,
  type StudentAccess,
} from "@/lib/api";
import { formatPhone, normalizePhone } from "@/lib/phone";

/**
 * Сурагч болон эцэг эхэд апп-д утсаар нэвтрэх эрх нээх.
 * Эрх нээхэд SMS-ээр 72 цагийн код очно; хүлээн авагч /activate хуудсанд өөрийн нууц үгээ
 * тохируулна. SMS хүрээгүй (үйлчилгээ тохируулаагүй) бол кодыг энд харуулж, админ дамжуулна.
 */
export function StudentAccessDialog({
  student,
  onOpenChange,
  onChanged,
}: {
  student: { id: number; name: string } | null;
  onOpenChange: (v: boolean) => void;
  onChanged?: () => void;
}) {
  const [data, setData] = useState<StudentAccess | null>(null);
  const [failed, setFailed] = useState(false);
  /** SMS хүрээгүй үед админд харуулах код */
  const [handover, setHandover] = useState<{ name: string; phone: string; delivery: CodeDelivery } | null>(null);

  const load = useCallback(() => {
    if (!student) return;
    accessApi
      .ofStudent(student.id)
      .then((d) => {
        setData(d);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, [student]);

  useEffect(() => {
    load();
  }, [load]);

  function afterDelivery(account: AccessAccount, delivery: CodeDelivery) {
    const who = `${account.last_name} ${account.first_name}`.trim();
    if (delivery.status === "sent") {
      toast.success(`${formatPhone(account.phone)} дугаарт SMS-ээр код илгээлээ`);
      setHandover(null);
    } else if (delivery.status === "not_sent" && delivery.code) {
      setHandover({ name: who, phone: account.phone ?? "", delivery });
    } else if (delivery.status === "rate_limited") {
      toast.error(
        `Энэ дугаарт саяхан код илгээсэн. ${delivery.retry_after ?? 60} секундийн дараа дахин оролдоно уу.`,
      );
    } else if (delivery.status === "not_needed") {
      toast.success("Холбогдлоо — энэ хэрэглэгч аль хэдийн апп ашигладаг");
    }
    load();
    onChanged?.();
  }

  return (
    <Dialog
      open={!!student}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setData(null);
          setHandover(null);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Апп-д нэвтрэх эрх</DialogTitle>
          <DialogDescription>
            {student?.name} — сурагч өөрөө болон эцэг эх нь утсаараа нэвтэрч хуваарь, ирц, төлбөрөө
            харна. Имэйл шаардлагагүй.
          </DialogDescription>
        </DialogHeader>

        {handover && <HandoverCode {...handover} onClose={() => setHandover(null)} />}

        {failed ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Мэдээллийг ачаалж чадсангүй</p>
        ) : !data ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            {!data.sms_enabled && !handover && (
              <p className="rounded-lg border border-dashed p-2.5 text-xs text-muted-foreground">
                SMS үйлчилгээ хараахан холбогдоогүй тул эрх нээхэд идэвхжүүлэх кодыг энд харуулна —
                та кодыг хүлээн авагчид өөрөө (утсаар, мессежээр) дамжуулна.
              </p>
            )}
            <Section icon={UserRound} title="Сурагч өөрөө">
              {data.student_account ? (
                <AccountRow account={data.student_account} onDelivered={afterDelivery} />
              ) : (
                <GrantForm
                  target="student"
                  defaultPhone={data.student_phone}
                  hint="Насанд хүрсэн суралцагч, эсвэл өөрийн утастай сурагч"
                  studentId={data.student_id}
                  onDelivered={afterDelivery}
                />
              )}
            </Section>
            <Section icon={Users} title="Эцэг эх / асран хамгаалагч">
              <div className="space-y-2">
                {data.guardians.map((g) => (
                  <AccountRow key={g.user_id} account={g} onDelivered={afterDelivery} />
                ))}
                <GrantForm
                  key={data.guardians.length}
                  target="guardian"
                  defaultPhone={data.guardians.length === 0 ? data.guardian_phone : null}
                  defaultName={data.guardians.length === 0 ? data.guardian_name : null}
                  hint={
                    data.guardians.length === 0
                      ? "Ах дүүс нэг эцэг эхтэй бол ижил дугаараар холбоно — шинэ данс үүсэхгүй"
                      : "Өөр эцэг эх нэмэх"
                  }
                  studentId={data.student_id}
                  onDelivered={afterDelivery}
                  compact={data.guardians.length > 0}
                />
              </div>
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function StatusPill({ account }: { account: AccessAccount }) {
  if (account.status === "active") {
    return (
      <Pill tone="emerald" icon={CheckCircle2}>
        Идэвхтэй
      </Pill>
    );
  }
  if (account.status === "invited") {
    return (
      <Pill tone="amber" icon={Clock}>
        Идэвхжүүлээгүй
      </Pill>
    );
  }
  return <Pill tone="slate">{account.status === "suspended" ? "Түр хаалттай" : "Идэвхгүй"}</Pill>;
}

function AccountRow({
  account,
  onDelivered,
}: {
  account: AccessAccount;
  onDelivered: (account: AccessAccount, delivery: CodeDelivery) => void;
}) {
  const [busy, setBusy] = useState(false);
  const canSend =
    account.phone &&
    (account.status === "invited" || (account.status === "active" && account.phone_verified));

  async function sendCode() {
    setBusy(true);
    try {
      const res = await accessApi.sendCode(account.user_id);
      onDelivered(res.account, res.delivery);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Амжилтгүй");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {`${account.last_name} ${account.first_name}`.trim()}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {account.phone && (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Smartphone className="h-3 w-3" />
              {formatPhone(account.phone)}
            </span>
          )}
          {account.email && <span className="truncate">{account.email}</span>}
          {account.last_login_at && (
            <span>Сүүлд: {new Date(account.last_login_at).toLocaleDateString("mn-MN")}</span>
          )}
        </p>
      </div>
      <StatusPill account={account} />
      {canSend && (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={sendCode} disabled={busy}>
          {account.status === "invited" ? <Send className="h-3.5 w-3.5" /> : <KeyRound className="h-3.5 w-3.5" />}
          {account.status === "invited" ? "Код дахин илгээх" : "Нууц үг сэргээх код"}
        </Button>
      )}
    </div>
  );
}

function GrantForm({
  target,
  studentId,
  defaultPhone,
  defaultName,
  hint,
  compact = false,
  onDelivered,
}: {
  target: "student" | "guardian";
  studentId: number;
  defaultPhone: string | null;
  defaultName?: string | null;
  hint: string;
  compact?: boolean;
  onDelivered: (account: AccessAccount, delivery: CodeDelivery) => void;
}) {
  const [open, setOpen] = useState(!compact);
  const [phone, setPhone] = useState(defaultPhone ? formatPhone(defaultPhone) : "");
  const [name, setName] = useState(defaultName ?? "");
  const [busy, setBusy] = useState(false);
  const valid = !!normalizePhone(phone);

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      toast.error("Утасны дугаар 8 оронтой байх ёстой");
      return;
    }
    setBusy(true);
    try {
      const res = await accessApi.grant(studentId, {
        target,
        phone: normalizePhone(phone)!,
        ...(target === "guardian" && name.trim() ? { name: name.trim() } : {}),
      });
      onDelivered(res.account, res.delivery);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Эрх нээж чадсангүй");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="text-xs" onClick={() => setOpen(true)}>
        + {hint}
      </Button>
    );
  }

  return (
    <form onSubmit={grant} className="space-y-2 rounded-lg border border-dashed p-3">
      <div className={target === "guardian" ? "grid gap-2 sm:grid-cols-2" : ""}>
        {target === "guardian" && (
          <div className="space-y-1">
            <Label htmlFor={`gn-${target}`} className="text-xs">Нэр</Label>
            <Input
              id={`gn-${target}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Эцэг эхийн нэр"
              disabled={busy}
            />
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor={`gp-${target}`} className="text-xs">Утасны дугаар</Label>
          <Input
            id={`gp-${target}`}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9911 2233"
            aria-invalid={phone.length > 0 && !valid}
            disabled={busy}
            required
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{hint}</p>
        <Button type="submit" size="sm" className="gap-1.5" disabled={busy || !valid}>
          <Send className="h-3.5 w-3.5" />
          {busy ? "Нээж байна..." : target === "student" ? "Сурагчид эрх нээх" : "Эцэг эхэд эрх нээх"}
        </Button>
      </div>
    </form>
  );
}

/** SMS хүрээгүй үед: кодыг админ өөрөө дамжуулна */
function HandoverCode({
  name,
  phone,
  delivery,
  onClose,
}: {
  name: string;
  phone: string;
  delivery: CodeDelivery;
  onClose: () => void;
}) {
  const until = delivery.expires_at ? new Date(delivery.expires_at) : null;
  const local = normalizePhone(phone)?.slice(4) ?? "";
  const url =
    typeof window !== "undefined" ? `${window.location.origin}/activate?phone=${local}` : "/activate";
  const text = `EduConnect: ${url} хаягаар орж ${delivery.code} кодоор бүртгэлээ идэвхжүүлээд өөрийн нууц үгээ тохируулна уу.`;
  return (
    <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <p className="text-sm font-medium">SMS илгээгдсэнгүй — кодыг өөрөө дамжуулна уу</p>
      <p className="text-xs">
        {name} ({formatPhone(phone)}) — <span className="font-mono text-base font-semibold tracking-widest">{delivery.code}</span>
        {until && <> · {until.toLocaleString("mn-MN")} хүртэл хүчинтэй, нэг удаа</>}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => {
            navigator.clipboard
              .writeText(text)
              .then(() => toast.success("Хуулагдлаа"))
              .catch(() => toast.error("Хуулж чадсангүй"));
          }}
        >
          <Copy className="h-3.5 w-3.5" /> Зааврыг хуулах
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Хаах
        </Button>
      </div>
    </div>
  );
}
