"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  ArrowRight,
  Mail,
  Lock,
  Shield,
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { authApi, setAuth, type User } from "@/lib/api";

interface LoginPageProps {
  onBack: () => void;
  onSuccess: (user: User) => void;
}

const DEMO_ACCOUNTS = [
  {
    email: "admin@school.mn",
    password: "",
    label: "Админ",
    desc: "Сургуулийн удирдлага",
    icon: Shield,
    color: "bg-primary",
  },
  {
    email: "teacher@school.mn",
    password: "password",
    label: "Багш",
    desc: "Ирц, дүн бүртгэх",
    icon: BookOpen,
    color: "bg-accent",
  },
  {
    email: "parent@school.mn",
    password: "password",
    label: "Эцэг эх",
    desc: "Хүүхдээ хянах",
    icon: Users,
    color: "bg-primary",
  },
  {
    email: "student@school.mn",
    password: "password",
    label: "Сурагч",
    desc: "Хуваарь, дүн харах",
    icon: GraduationCap,
    color: "bg-accent",
  },
];

const LEFT_PANEL_FEATURES = [
  "Ирц бүртгэл — 30 секундэд",
  "Дүнгийн журнал + автомат дундаж",
  "Эцэг эх-багш real-time чат",
  "SMS мэдэгдэл + ESIS синк",
];

export function LoginPage({ onBack, onSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setAuth(res.accessToken, res.refreshToken, res.user);
      toast.success(`Тавтай морил, ${res.user.first_name}!`);
      onSuccess(res.user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Нэвтэрч чадсангүй");
    } finally {
      setLoading(false);
    }
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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
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
              Сургуулийн удирдлага, багш, эцэг эх, сурагч — нэг платформ
            </h2>
            <p className="mt-4 text-primary-foreground/70">
              Монголын ерөнхий боловсролын хувийн сургуулиудад зориулсан нэгдсэн дижитал шийдэл
            </p>
          </div>

          <div className="space-y-3">
            {LEFT_PANEL_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                <span className="text-sm text-primary-foreground/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Stats */}
        <div className="relative grid grid-cols-3 gap-4 border-t border-primary-foreground/10 pt-6">
          <div>
            <div className="text-2xl font-bold">50+</div>
            <div className="text-xs text-primary-foreground/60">Сургууль</div>
          </div>
          <div>
            <div className="text-2xl font-bold">15K+</div>
            <div className="text-xs text-primary-foreground/60">Сурагч</div>
          </div>
          <div>
            <div className="text-2xl font-bold">99.9%</div>
            <div className="text-xs text-primary-foreground/60">Uptime</div>
          </div>
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
              Нэвтрэхийн тулд имэйл болон нууц үгээ оруулна уу
            </p>
          </div>

          {/* Demo accounts */}
          <div>
            <Label className="text-xs text-muted-foreground">
              Туршилтын бүртгэлээр нэвтрэх (нууц үг: password)
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

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">эсвэл</span>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Имэйл хаяг</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@school.mn"
                  required
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Нууц үг</Label>
                <a href="#" className="text-xs text-accent hover:underline">
                  Нууц үг мартсан?
                </a>
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

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground">
            Сургуулиараа бүртгүүлэхийг хүсвэл{" "}
            <a href="#" className="text-accent hover:underline">
              энд дарна уу
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}