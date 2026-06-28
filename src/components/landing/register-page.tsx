"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  Mail,
  Lock,
  Building2,
  User as UserIcon,
  Phone,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { registrationApi, authApi, setAuth, type User } from "@/lib/api";

interface RegisterPageProps {
  onBack: () => void;
  onSuccess: (user: User) => void;
  onLogin: () => void;
}

const BENEFITS = [
  "Сургуулиа 5 минутад бүртгэнэ",
  "Ирц, дүн, даалгавар — бүгд нэг дор",
  "Эцэг эх-багшийн real-time харилцаа",
  "Үнэгүй туршилтаар эхэлнэ",
];

export function RegisterPage({ onBack, onSuccess, onLogin }: RegisterPageProps) {
  const [schoolName, setSchoolName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой");
      return;
    }
    setLoading(true);
    try {
      await registrationApi.signup({
        school_name: schoolName.trim(),
        admin_first_name: firstName.trim(),
        admin_last_name: lastName.trim(),
        admin_email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      // Шинэ үүсгэсэн админаар автоматаар нэвтэрнэ
      const res = await authApi.login(email.trim(), password);
      setAuth(res.accessToken, res.refreshToken, res.user);
      toast.success(`Тавтай морил, ${res.user.first_name}! Сургууль бүртгэгдлээ.`);
      onSuccess(res.user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Бүртгэж чадсангүй");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* LEFT — branding */}
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground md:p-12 lg:p-16">
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
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber text-amber-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">EduConnect</h1>
            <p className="text-xs text-primary-foreground/70">Mongolia</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">
            Сургуулиа дижитал болгох эхний алхам
          </h2>
          <p className="text-primary-foreground/70">
            Ахлах ангийн сурагч, багш, эцэг эхийг нэг платформд нэгтгэ.
          </p>
          <div className="space-y-3 pt-2">
            {BENEFITS.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-amber" />
                <span className="text-sm text-primary-foreground/90">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} EduConnect Mongolia
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Буцах
          </button>

          <div>
            <h2 className="text-3xl font-bold text-primary">Сургуулиа бүртгүүлэх</h2>
            <p className="mt-2 text-muted-foreground">
              Та сургуулийн админ дансаа үүсгэнэ. Дараа нь багш, сурагчаа урина.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="r-school">Сургуулийн нэр</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="r-school"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Шинэ Эра сургууль"
                  required
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="r-ln">Овог</Label>
                <Input
                  id="r-ln"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Бат"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-fn">Нэр</Label>
                <Input
                  id="r-fn"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Болд"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-email">Имэйл хаяг (нэвтрэх нэр)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="r-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@school.mn"
                  required
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-phone">Утас (заавал биш)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="r-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="99112233"
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-pw">Нууц үг</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="r-pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Хамгийн багадаа 8 тэмдэгт"
                  required
                  minLength={8}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" variant="amber" className="w-full" disabled={loading}>
              {loading ? "Бүртгэж байна..." : "Сургууль бүртгүүлэх"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Бүртгэлтэй юу?{" "}
            <button onClick={onLogin} className="font-medium text-amber hover:underline">
              Нэвтрэх
            </button>
          </p>
          <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3">
            <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Та админ эрхтэйгээр нэвтэрнэ. Багш, сурагч, эцэг эхээ дотроос урьж нэмнэ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
