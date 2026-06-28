"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой");
      return;
    }
    if (password !== confirm) {
      toast.error("Нууц үг таарахгүй байна");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(params.token, password);
      setDone(true);
      toast.success("Нууц үг шинэчлэгдлээ");
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Шинэчилж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Шинэ нууц үг</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Шинэ нууц үгээ оруулна уу
            </p>
          </div>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <p className="text-sm font-medium text-foreground">
              Нууц үг амжилттай шинэчлэгдлээ
            </p>
            <p className="text-xs text-muted-foreground">Нэвтрэх хуудас руу шилжиж байна...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="np">Шинэ нууц үг</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="np"
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
              <Label htmlFor="cp">Нууц үг давтах</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="cp"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  disabled={submitting}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" variant="success" className="w-full" disabled={submitting}>
              {submitting ? "Шинэчилж байна..." : "Нууц үг шинэчлэх"}
            </Button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Нэвтрэх хуудас руу буцах
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
