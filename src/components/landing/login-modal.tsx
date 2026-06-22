"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { authApi, setAuth, type User } from "@/lib/api";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

const DEMO_ACCOUNTS = [
  { email: "admin@school.mn", password: "password", label: "Админ" },
  { email: "teacher@school.mn", password: "password", label: "Багш" },
  { email: "parent@school.mn", password: "password", label: "Эцэг эх" },
  { email: "student@school.mn", password: "password", label: "Сурагч" },
];

export function LoginModal({ open, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
    }
  }, [open]);

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

  function useDemo(acc: { email: string; password: string }) {
    setEmail(acc.email);
    setPassword(acc.password);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Нэвтрэх</DialogTitle>
          <DialogDescription>
            EduConnect Mongolia платформ руу нэвтрэхийн тулд имэйл болон нууц үгээ оруулна уу.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Имэйл</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@school.mn"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Нууц үг</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
          </Button>
        </form>

        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground mb-2 text-center">
            Туршилтын бүртгэл (нууц үг: password)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <Button
                key={acc.email}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => useDemo(acc)}
                disabled={loading}
                className="text-xs"
              >
                {acc.label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}