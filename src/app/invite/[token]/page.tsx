"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  ShieldCheck,
  BookOpen,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { invitationsApi, setAuth, type InvitationPreview } from "@/lib/api";

const ROLE_META: Record<string, { label: string; icon: typeof BookOpen; desc: string }> = {
  admin: { label: "Сургуулийн Админ", icon: ShieldCheck, desc: "Сургуулийн удирдлага" },
  teacher: { label: "Багш", icon: BookOpen, desc: "Ирц, дүн бүртгэх" },
  parent: { label: "Эцэг эх", icon: Users, desc: "Хүүхдээ хянах" },
};

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!token) return;
    invitationsApi
      .preview(token)
      .then((p) => setPreview(p))
      .catch((e) =>
        setLoadError(
          e instanceof Error ? e.message : "Урилга хүчингүй эсвэл хугацаа дууссан байна",
        ),
      )
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой");
      return;
    }
    setSubmitting(true);
    try {
      const res = await invitationsApi.accept(token, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      setAuth(res.accessToken, res.refreshToken, res.user);
      toast.success("Бүртгэл амжилттай үүслээ! Тавтай морил.");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Бүртгэл үүсгэж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  const roleMeta = preview ? ROLE_META[preview.role] : null;
  const RoleIcon = roleMeta?.icon ?? UserIcon;
  const expired =
    preview && (preview.status !== "pending" || new Date(preview.expires_at) < new Date());

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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">EduConnect</h1>
            <p className="text-xs text-primary-foreground/70">Mongolia</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">
            Танийг урьж байна
          </h2>
          <p className="text-primary-foreground/70">
            Урилгаа баталгаажуулж, өөрийн дансаа үүсгээд платформд нэгдээрэй.
          </p>
          <div className="space-y-3 pt-2">
            {["Аюулгүй, нэг удаагийн урилгын холбоос", "Таны мэдээлэл хамгаалагдсан", "Шууд ажиллаж эхлэх боломжтой"].map(
              (f) => (
                <div key={f} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  <span className="text-sm text-primary-foreground/90">{f}</span>
                </div>
              ),
            )}
          </div>
        </div>
        <div className="relative text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} EduConnect Mongolia
        </div>
      </div>

      {/* RIGHT — accept form */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div>
                <h2 className="text-lg font-bold text-foreground">Урилга боломжгүй</h2>
                <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
              </div>
              <Button variant="outline" onClick={() => router.push("/")}>
                Нүүр хуудас руу
              </Button>
            </div>
          ) : expired ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-amber-300 bg-amber-50 p-8 text-center">
              <AlertCircle className="h-10 w-10 text-amber-500" />
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Урилгын хугацаа дууссан
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Сургуулийн админаас шинэ урилга авна уу.
                </p>
              </div>
              <Button variant="outline" onClick={() => router.push("/")}>
                Нүүр хуудас руу
              </Button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-3xl font-bold text-primary">Бүртгэлээ үүсгэх</h2>
                <p className="mt-2 text-muted-foreground">
                  Доорх мэдээллээ бөглөж урилгаа баталгаажуулна уу.
                </p>
              </div>

              {/* Invitation summary */}
              <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <RoleIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {roleMeta?.label ?? preview?.role}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {preview?.email}
                  </p>
                  {preview?.school_name && (
                    <p className="truncate text-xs text-muted-foreground">
                      {preview.school_name}
                    </p>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ln">Овог</Label>
                    <Input
                      id="ln"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Бат"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fn">Нэр</Label>
                    <Input
                      id="fn"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Болд"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pw">Нууц үг</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="pw"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Хамгийн багадаа 8 тэмдэгт"
                      required
                      minLength={8}
                      disabled={submitting}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ph">Утас (заавал биш)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="ph"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="99112233"
                      disabled={submitting}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="success"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "Үүсгэж байна..." : "Бүртгэл үүсгэж нэвтрэх"}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                Бүртгэл үүсгэснээр та үйлчилгээний нөхцөлийг зөвшөөрч байна.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
