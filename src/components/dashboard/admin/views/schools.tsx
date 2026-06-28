"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Building2,
  Plus,
  Mail,
  Phone,
  MapPin,
  Power,
  Copy,
  CheckCircle2,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { schoolsApi, registrationApi, type School } from "@/lib/api";

export function SuperAdminSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(() => {
    schoolsApi
      .list(true)
      .then(setSchools)
      .catch(() => setSchools([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = schools.filter(
    (s) => search === "" || s.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function toggleActive(s: School) {
    try {
      if (s.is_active) {
        await schoolsApi.remove(s.id);
        toast.success(`${s.name} идэвхгүй боллоо`);
      } else {
        await schoolsApi.restore(s.id);
        toast.success(`${s.name} идэвхжлээ`);
      }
      setSchools((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, is_active: !x.is_active } : x)),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Үйлдэл амжилтгүй");
    }
  }

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Сургуулиуд</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Нийт {schools.length} сургууль · {schools.filter((s) => s.is_active).length}{" "}
            идэвхтэй
          </p>
        </div>
        <Button variant="amber" onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Сургууль бүртгэх
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Сургууль хайх..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-14">
            <Building2 className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Сургууль олдсонгүй</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((s) => (
            <Card key={s.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{s.name}</p>
                      {s.director_name && (
                        <p className="text-xs text-muted-foreground">
                          Захирал: {s.director_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${s.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}
                  >
                    {s.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  {s.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> {s.email}
                    </p>
                  )}
                  {s.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> {s.phone}
                    </p>
                  )}
                  {s.address && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> {s.address}
                    </p>
                  )}
                </div>

                <div className="flex justify-end border-t pt-2">
                  {s.is_active ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => toggleActive(s)}
                    >
                      <Power className="h-3.5 w-3.5" />
                      Идэвхгүй болгох
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => toggleActive(s)}
                    >
                      <Power className="h-3.5 w-3.5" />
                      Идэвхжүүлэх
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RegisterSchoolDialog open={formOpen} onOpenChange={setFormOpen} onSaved={load} />
    </div>
  );
}

function RegisterSchoolDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [schoolName, setSchoolName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [director, setDirector] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  function reset() {
    setSchoolName("");
    setAdminEmail("");
    setSchoolEmail("");
    setPhone("");
    setAddress("");
    setDirector("");
    setInviteLink(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await registrationApi.registerSchool({
        school_name: schoolName.trim(),
        admin_email: adminEmail.trim(),
        school_email: schoolEmail.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        director_name: director.trim() || undefined,
      });
      toast.success("Сургууль бүртгэгдлээ");
      onSaved();
      if (res.invitation?.token) {
        setInviteLink(`${window.location.origin}/invite/${res.invitation.token}`);
      } else {
        onOpenChange(false);
        reset();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Бүртгэж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Шинэ сургууль бүртгэх</DialogTitle>
          <DialogDescription>
            Сургууль болон эхний админыг үүсгэнэ. Админд урилгын холбоос үүснэ.
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <p className="text-sm text-green-800">
                Сургууль үүслээ. Доорх холбоосыг админд илгээж дансаа үүсгүүлээрэй.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
              <code className="flex-1 truncate text-xs text-muted-foreground">
                {inviteLink}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  toast.success("Хууллаа");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  reset();
                }}
              >
                Хаах
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sc-name">Сургуулийн нэр *</Label>
              <Input
                id="sc-name"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Шинэ Эра сургууль"
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sc-admin" className="flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5" /> Админы имэйл *
              </Label>
              <Input
                id="sc-admin"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@school.mn"
                required
                disabled={submitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sc-email">Сургуулийн имэйл</Label>
                <Input
                  id="sc-email"
                  value={schoolEmail}
                  onChange={(e) => setSchoolEmail(e.target.value)}
                  placeholder="info@school.mn"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sc-phone">Утас</Label>
                <Input
                  id="sc-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="7011-xxxx"
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sc-dir">Захирлын нэр</Label>
              <Input
                id="sc-dir"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sc-addr">Хаяг</Label>
              <Textarea
                id="sc-addr"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                disabled={submitting}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Болих
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Бүртгэж байна..." : "Бүртгэх"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
