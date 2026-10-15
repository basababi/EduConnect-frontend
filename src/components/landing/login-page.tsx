"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  ArrowRight,
  Mail,
  Lock,
  Shield,
  BookOpen,
  Users,
  CheckCircle2,
  Phone,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authApi, setAuth, GOOGLE_AUTH_URL, type User } from "@/lib/api";
import { looksLikePhone } from "@/lib/phone";
import { PhoneCodeForm } from "@/components/landing/phone-code-form";

interface LoginPageProps {
  onBack: () => void;
  onSuccess: (user: User) => void;
  onRegister?: () => void;
}

// `npm run seed:center` (backend) үүсгэдэг демо төвийн данснууд
const DEMO_ACCOUNTS = [
  {
    email: "admin@demo.test",
    password: "password",
    label: "Админ",
    desc: "Төвийн удирдлага",
    icon: Shield,
    color: "bg-primary",
  },
  {
    email: "teacher@demo.test",
    password: "password",
    label: "Багш",
    desc: "Ирц, үнэлгээ, даалгавар",
    icon: BookOpen,
    color: "bg-amber",
  },
  {
    email: "parent@demo.test",
    password: "password",
    label: "Эцэг эх",
    desc: "Хүүхдээ хянах",
    icon: Users,
    color: "bg-primary",
  },
  {
    email: "student@demo.test",
    password: "password",
    label: "Сурагч",
    desc: "Хуваарь, даалгавар",
    icon: GraduationCap,
    color: "bg-amber",
  },
];

const LEFT_PANEL_FEATURES = [
  "Гар утсаар ирц бүртгэх",
  "Курс, бүлэг, элсэлтийн бүртгэл",
  "Даалгавар, хичээлийн материал",
  "Эцэг эх-багшийн шууд харилцаа",
];

// Туршилтын хурдан нэвтрэлт — зөвхөн dev/demo орчинд.
// Production-д NEXT_PUBLIC_ENABLE_DEMO=true биш бол харагдахгүй (аюулгүй байдал).
const DEMO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO === "true";

export function LoginPage({ onBack, onSuccess, onRegister }: LoginPageProps) {
  /** Имэйл эсвэл утасны дугаар */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWith(email.trim(), password);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Нэвтэрч чадсангүй");
    } finally {
      setLoading(false);
    }
  }

  async function loginWith(identifier: string, pass: string) {
    const res = await authApi.login(identifier, pass);
    setAuth(res.accessToken, res.refreshToken, res.user);
    toast.success(`Тавтай морил, ${res.user.first_name}!`);
    onSuccess(res.user);
  }

  function selectDemo(acc: (typeof DEMO_ACCOUNTS)[0]) {
    setEmail(acc.email);
    setPassword(acc.password);
    setSelectedRole(acc.label);
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* === LEFT PANEL: Branding (Dark blue) === */}
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground md:p-12 lg:p-16">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* Top: Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber text-amber-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">EduConnect</h1>
            <p className="text-xs text-primary-foreground/70">Mongolia</p>
          </div>
        </div>

        {/* Middle: Tagline + features */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight md:text-4xl">
              Төвийн удирдлага, багш, эцэг эх, сурагч — нэг платформ
            </h2>
            <p className="mt-4 text-primary-foreground/70">
              Сургалтын төвүүдэд зориулсан нэгдсэн дижитал шийдэл
            </p>
          </div>

          <div className="space-y-3">
            {LEFT_PANEL_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-amber" />
                <span className="text-sm text-primary-foreground/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} EduConnect Mongolia
        </div>
      </div>

      {/* === RIGHT PANEL: Login form === */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Back button */}
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Буцах нүүр хуудас руу
          </button>

          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-primary">Тавтай морил</h2>
            <p className="mt-2 text-muted-foreground">
              Утасны дугаар эсвэл имэйл, нууц үгээ оруулна уу
            </p>
          </div>

          {/* Demo accounts — зөвхөн dev/demo орчинд */}
          {DEMO_ENABLED && (
            <>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Туршилтын бүртгэлээр нэвтрэх
                </Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => {
                    const Icon = acc.icon;
                    const isSelected = selectedRole === acc.label;
                    return (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => selectDemo(acc)}
                        disabled={loading}
                        className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:shadow-sm ${
                          isSelected ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${acc.color} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{acc.label}</div>
                          <div className="text-xs text-muted-foreground">{acc.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">эсвэл</span>
                </div>
              </div>
            </>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Утас эсвэл имэйл</Label>
              <div className="relative">
                {looksLikePhone(email) ? (
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                ) : email.includes("@") ? (
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                ) : (
                  <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                )}
                <Input
                  id="email"
                  type="text"
                  inputMode={looksLikePhone(email) ? "tel" : "email"}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="9911 2233 эсвэл name@example.mn"
                  required
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Нууц үг</Label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs text-amber hover:underline"
                >
                  Нууц үг мартсан?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          {/* Google login */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              window.location.href = GOOGLE_AUTH_URL;
            }}
            disabled={loading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
              />
            </svg>
            Google-ээр нэвтрэх
          </Button>

          {/* Утсаар анх удаа — төвөөс нээсэн эрхийг идэвхжүүлэх */}
          <Link
            href="/activate"
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Phone className="h-4 w-4" />
            Анх удаа утсаар нэвтрэх үү? <span className="font-medium text-amber">Бүртгэл идэвхжүүлэх</span>
          </Link>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground">
            Төвөө бүртгүүлэхийг хүсвэл{" "}
            <button
              type="button"
              onClick={onRegister}
              className="font-medium text-amber hover:underline"
            >
              энд дарна уу
            </button>
          </p>

          <ForgotDialog
            open={forgotOpen}
            onOpenChange={setForgotOpen}
            initial={email}
            onPhoneReset={async (phone, pass) => {
              setForgotOpen(false);
              await loginWith(phone, pass);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ForgotDialog({
  open,
  onOpenChange,
  initial,
  onPhoneReset,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Нэвтрэх талбарт бичсэн утга — утас мэт бол утасны таб, имэйл бол имэйлийн таб */
  initial: string;
  onPhoneReset: (phone: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<"phone" | "email">("phone");

  function reset() {
    setEmail("");
    setSent(false);
    setDevUrl(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setSent(true);
      setDevUrl(res.dev_reset_url ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Илгээж чадсангүй");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          const isEmail = initial.includes("@");
          setTab(isEmail ? "email" : "phone");
          setEmail(isEmail ? initial.trim() : "");
        } else reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Нууц үг сэргээх</DialogTitle>
          <DialogDescription>
            Утсаар бол SMS код, имэйлээр бол сэргээх холбоос илгээнэ.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "phone" | "email")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="phone" className="gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Утсаар
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Имэйлээр
            </TabsTrigger>
          </TabsList>
          <TabsContent value="phone" className="pt-3">
            <PhoneCodeForm
              key={open ? "open" : "closed"}
              purpose="reset"
              initialPhone={looksLikePhone(initial) ? initial.trim() : ""}
              onDone={onPhoneReset}
            />
          </TabsContent>
          <TabsContent value="email" className="pt-3">
            {sent ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  <p className="text-sm text-green-800">
                    Хэрэв энэ имэйл бүртгэлтэй бол сэргээх холбоос илгээгдсэн.
                  </p>
                </div>
                {devUrl && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">
                      Имэйл тохиргоогүй тул (dev) шууд холбоос:
                    </p>
                    <a
                      href={devUrl}
                      className="block truncate rounded-lg border bg-muted/40 p-2 text-xs text-amber hover:underline"
                    >
                      {devUrl}
                    </a>
                  </div>
                )}
                <Button className="w-full" onClick={() => onOpenChange(false)}>
                  Хаах
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Имэйл хаяг</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.mn"
                    required
                    disabled={loading}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Болих
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Илгээж байна..." : "Холбоос илгээх"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
