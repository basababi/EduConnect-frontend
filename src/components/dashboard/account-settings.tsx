"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User as UserIcon,
  ShieldCheck,
  Monitor,
  LogOut,
  MailCheck,
  Save,
  CalendarRange,
  CheckCircle2,
  Plus,
  Phone,
  KeyRound,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { GraduationCap, AlertTriangle } from "lucide-react";
import {
  authApi,
  usersApi,
  termsApi,
  academicApi,
  getStoredUser,
  setAuth,
  getToken,
  getRefreshToken,
  type SessionInfo,
  type User,
  type Term,
  type RolloverPreview,
} from "@/lib/api";
import { hasFeature } from "@/lib/features";
import { formatPhone, normalizePhone } from "@/lib/phone";
import { SmsUsageCard } from "@/components/dashboard/admin/sms-usage-card";

function currentAcademicYear(): number {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

export function AccountSettings() {
  const stored = getStoredUser();
  const isAdmin = stored?.role === "admin" || stored?.role === "super_admin";
  // Улирал, хичээлийн жил дэвших нь ЕБС-ийн ойлголт — сургалтын төвд default-оор нуугдана
  const showTerms = isAdmin && hasFeature(stored, "academic_terms");
  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Тохиргоо</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Хувийн мэдээлэл, аюулгүй байдал{showTerms ? ", улирал" : ""}
        </p>
      </div>
      {stored && <ProfileCard user={stored} />}
      {showTerms && <TermsCard />}
      {showTerms && <RolloverCard />}
      <SecurityCard user={stored} />
      {stored?.role === "admin" && <SmsUsageCard />}
      <SessionsCard />
    </div>
  );
}

function RolloverCard() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<RolloverPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ year: number; graduated: number } | null>(null);

  async function openDialog() {
    setOpen(true);
    setDone(null);
    setLoading(true);
    try {
      setPreview(await academicApi.previewRollover());
    } catch {
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    setBusy(true);
    try {
      const res = await academicApi.rollover();
      setDone({ year: res.new_academic_year, graduated: res.graduated_students });
      toast.success("Шинэ хичээлийн жил эхэллээ");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Амжилтгүй");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4 text-primary" />
          Хичээлийн жил дэвших
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800">
            Бүх анги дэвшинэ (10→11→12), 12-р анги төгсөж архивлагдана. Шинэ жилийн
            улирал үүснэ. <strong>Буцаахгүй үйлдэл.</strong>
          </p>
          <Button variant="outline" size="sm" className="shrink-0" onClick={openDialog}>
            Жил дэвших
          </Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Шинэ хичээлийн жил эхлүүлэх
            </DialogTitle>
            <DialogDescription>
              Энэ үйлдлийг буцаах боломжгүй. Доорхийг анхааралтай шалгана уу.
            </DialogDescription>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="text-sm font-medium text-foreground">
                {done.year}-{done.year + 1} оны хичээлийн жил эхэллээ
              </p>
              <p className="text-xs text-muted-foreground">
                {done.graduated} сурагч төгслөө
              </p>
              <Button onClick={() => setOpen(false)}>Хаах</Button>
            </div>
          ) : loading ? (
            <Skeleton className="h-32 w-full" />
          ) : preview ? (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Дэвших анги</span>
                  <span className="font-semibold text-foreground">
                    {preview.promote.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Төгсөх анги</span>
                  <span className="font-semibold text-foreground">
                    {preview.graduate.length} (
                    {preview.graduate.reduce((a, g) => a + g.students, 0)} сурагч)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Шинэ хичээлийн жил</span>
                  <span className="font-semibold text-primary">
                    {preview.next_year}-{preview.next_year + 1}
                  </span>
                </div>
              </div>
              {preview.promote.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {preview.promote.map((p) => `${p.from}→${p.to}`).join(", ")}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                  Болих
                </Button>
                <Button variant="destructive-solid" onClick={confirm} disabled={busy}>
                  {busy ? "Гүйцэтгэж байна..." : "Баталгаажуулж дэвших"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Анги олдсонгүй
            </p>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TermsCard() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const ay = currentAcademicYear();

  const load = useCallback(() => {
    termsApi
      .list()
      .then(setTerms)
      .catch(() => setTerms([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function ensureYear() {
    setBusy(true);
    try {
      await termsApi.ensureYear(ay);
      toast.success(`${ay}-${ay + 1} оны улирлууд бэлэн`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Үүсгэж чадсангүй");
    } finally {
      setBusy(false);
    }
  }

  async function activate(id: number) {
    try {
      await termsApi.activate(id);
      toast.success("Идэвхтэй улирал солигдлоо");
      setTerms((prev) => prev.map((t) => ({ ...t, is_active: t.id === id })));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Амжилтгүй");
    }
  }

  // Жилээр бүлэглэх
  const byYear = terms.reduce<Record<number, Term[]>>((acc, t) => {
    (acc[t.academic_year] ??= []).push(t);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarRange className="h-4 w-4 text-primary" />
            Улирал / хичээлийн жил
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={ensureYear} disabled={busy}>
            <Plus className="h-3.5 w-3.5" />
            {ay}-{ay + 1} үүсгэх
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : terms.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Улирал үүсгээгүй байна. Дээрх товчоор {ay}-{ay + 1} оны 4 улирлыг үүсгэнэ.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(byYear)
              .sort((a, b) => Number(b[0]) - Number(a[0]))
              .map(([year, list]) => (
                <div key={year}>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    {year}-{Number(year) + 1} оны хичээлийн жил
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {list
                      .sort((a, b) => a.order_no - b.order_no)
                      .map((t) => (
                        <button
                          key={t.id}
                          onClick={() => !t.is_active && activate(t.id)}
                          className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                            t.is_active
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <p className="font-medium text-foreground">{t.name}</p>
                          {t.is_active ? (
                            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Идэвхтэй
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              Идэвхжүүлэх
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Токенуудыг хэвээр үлдээж локал хэрэглэгчийг шинэчилнэ */
function storeUser(user: User) {
  const at = getToken();
  const rt = getRefreshToken();
  if (at && rt) setAuth(at, rt, user);
}

function ProfileCard({ user: initial }: { user: User }) {
  const [user, setUser] = useState(initial);
  const [firstName, setFirstName] = useState(initial.first_name);
  const [lastName, setLastName] = useState(initial.last_name);
  const [saving, setSaving] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Нэвтрэх нэр (утас, имэйл) энд солигдохгүй — утсыг SMS кодоор баталгаажуулна
      const updated = await usersApi.update(user.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      const next = { ...user, ...updated };
      setUser(next);
      storeUser(next);
      toast.success("Мэдээлэл хадгалагдлаа");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Хадгалж чадсангүй");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserIcon className="h-4 w-4 text-primary" />
          Хувийн мэдээлэл
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="set-ln">Овог</Label>
              <Input
                id="set-ln"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="set-fn">Нэр</Label>
              <Input
                id="set-fn"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="set-email">Имэйл</Label>
              <Input id="set-email" value={user.email ?? "—"} disabled />
            </div>
            <div className="space-y-2">
              <Label>Утас (нэвтрэх нэр)</Label>
              <div className="flex items-center gap-2">
                <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate tabular-nums">
                    {user.phone ? formatPhone(user.phone) : "—"}
                  </span>
                  {user.phone && (
                    <Badge
                      variant="secondary"
                      className={
                        user.phone_verified
                          ? "ml-auto bg-emerald-100 text-emerald-700"
                          : "ml-auto bg-amber-100 text-amber-700"
                      }
                    >
                      {user.phone_verified ? "Баталгаажсан" : "Баталгаажаагүй"}
                    </Badge>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setPhoneOpen(true)}>
                  {!user.phone ? "Нэмэх" : user.phone_verified ? "Солих" : "Баталгаажуулах"}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
          </div>
        </form>
      </CardContent>
      <PhoneChangeDialog
        key={phoneOpen ? "open" : "closed"}
        open={phoneOpen}
        onOpenChange={setPhoneOpen}
        current={user.phone_verified ? null : (user.phone ?? null)}
        onChanged={(fresh) => {
          const next = { ...user, ...fresh };
          setUser(next);
          storeUser(next);
        }}
      />
    </Card>
  );
}

/** Шинэ дугаарт SMS код илгээж баталгаажуулна — дараа нь утсаар нэвтэрч, сэргээж болно */
function PhoneChangeDialog({
  open,
  onOpenChange,
  current,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Баталгаажаагүй одоогийн дугаар (баталгаажуулахад урьдчилан бөглөнө) */
  current: string | null;
  onChanged: (user: User) => void;
}) {
  const [phone, setPhone] = useState(current ? formatPhone(current) : "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizePhone(phone);
    if (!normalized) {
      toast.error("Утасны дугаараа 8 оронтойгоор оруулна уу");
      return;
    }
    setBusy(true);
    try {
      if (step === "phone") {
        const res = await authApi.requestPhoneChange(normalized);
        setDevCode(res.dev_code ?? null);
        setStep("code");
        toast.success("Баталгаажуулах код илгээлээ");
      } else {
        const fresh = await authApi.confirmPhoneChange(normalized, code.trim());
        onChanged(fresh);
        toast.success("Утас баталгаажлаа — одоо утсаараа нэвтэрч болно");
        onOpenChange(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Амжилтгүй");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Утасны дугаар</DialogTitle>
          <DialogDescription>
            Дугаартаа ирсэн SMS кодоор баталгаажуулна. Баталгаажсан утсаараа нэвтэрч, нууц үгээ
            сэргээж болно.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pcd-phone">Утасны дугаар</Label>
            <Input
              id="pcd-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9911 2233"
              disabled={busy || step === "code"}
              required
            />
          </div>
          {step === "code" && (
            <div className="space-y-2">
              <Label htmlFor="pcd-code">SMS код</Label>
              <Input
                id="pcd-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="tracking-[0.4em]"
                disabled={busy}
                required
              />
              {devCode && (
                <p className="text-xs text-muted-foreground">
                  Туршилтын орчин — код: <span className="font-mono font-semibold">{devCode}</span>
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Болих
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Түр хүлээнэ үү..." : step === "phone" ? "Код авах" : "Баталгаажуулах"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SecurityCard({ user }: { user: User | null }) {
  const [sending, setSending] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmNext, setConfirmNext] = useState("");
  const [changing, setChanging] = useState(false);

  async function verifyEmail() {
    setSending(true);
    try {
      await authApi.requestEmailVerification();
      toast.success("Баталгаажуулах имэйл илгээгдлээ");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Илгээж чадсангүй");
    } finally {
      setSending(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) {
      toast.error("Шинэ нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой");
      return;
    }
    if (next !== confirmNext) {
      toast.error("Шинэ нууц үг таарахгүй байна");
      return;
    }
    setChanging(true);
    try {
      const res = await authApi.changePassword(current, next);
      // Бусад төхөөрөмжөөс гарсан; энэ төхөөрөмж шинэ токеноор үргэлжилнэ
      setAuth(res.accessToken, res.refreshToken, res.user);
      setCurrent("");
      setNext("");
      setConfirmNext("");
      toast.success("Нууц үг солигдлоо. Бусад төхөөрөмжөөс гарлаа.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Сольж чадсангүй");
    } finally {
      setChanging(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Аюулгүй байдал
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={changePassword} className="space-y-3 rounded-lg border p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            Нууц үг солих
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="pw-cur" className="text-xs">Одоогийн нууц үг</Label>
              <Input
                id="pw-cur"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                disabled={changing}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-new" className="text-xs">Шинэ нууц үг</Label>
              <Input
                id="pw-new"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="8+ тэмдэгт"
                minLength={8}
                disabled={changing}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-new2" className="text-xs">Давтах</Label>
              <Input
                id="pw-new2"
                type="password"
                autoComplete="new-password"
                value={confirmNext}
                onChange={(e) => setConfirmNext(e.target.value)}
                disabled={changing}
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="outline" size="sm" className="gap-1.5" disabled={changing}>
              <Lock className="h-3.5 w-3.5" />
              {changing ? "Сольж байна..." : "Нууц үг солих"}
            </Button>
          </div>
        </form>
        {user?.email && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex min-w-0 items-center gap-3">
              <MailCheck className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Имэйл баталгаажуулалт</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={verifyEmail} disabled={sending}>
              {sending ? "Илгээж байна..." : "Баталгаажуулах"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SessionsCard() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    authApi
      .sessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function revoke(id: number) {
    try {
      await authApi.revokeSession(id);
      toast.success("Сесс хаагдлаа");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Хааж чадсангүй");
    }
  }

  async function logoutAll() {
    if (!confirm("Бүх төхөөрөмжөөс гарах уу? Та дахин нэвтрэх шаардлагатай болно.")) return;
    try {
      await authApi.logoutAll();
      toast.success("Бүх сессээс гарлаа");
      window.dispatchEvent(new Event("educonnect:logout"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Үйлдэл амжилтгүй");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-4 w-4 text-primary" />
            Идэвхтэй сесс
          </CardTitle>
          {sessions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={logoutAll}
            >
              <LogOut className="h-3.5 w-3.5" />
              Бүгдээс гарах
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Идэвхтэй сесс олдсонгүй
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Monitor className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {s.user_agent ?? "Тодорхойгүй төхөөрөмж"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.ip ?? "—"} ·{" "}
                    {new Date(s.last_used_at ?? s.created_at).toLocaleString("mn-MN")}
                  </p>
                </div>
                {s.current ? (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                    Энэ төхөөрөмж
                  </Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => revoke(s.id)}
                  >
                    Хаах
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
