"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  UserPlus,
  Mail,
  Copy,
  X,
  Clock,
  CheckCircle2,
  Ban,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  invitationsApi,
  classesApi,
  usersApi,
  type User,
  type Invitation,
  type ClassRoom,
} from "@/lib/api";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Супер Админ",
  admin: "Сургуулийн Админ",
  teacher: "Багш",
  parent: "Эцэг эх",
  student: "Сурагч",
};

const ROLE_COLOR: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  teacher: "bg-primary/10 text-primary",
  parent: "bg-green-100 text-green-700",
  student: "bg-amber-100 text-amber-700",
};

const ROLE_FILTERS = [
  { key: "all", label: "Бүгд" },
  { key: "teacher", label: "Багш" },
  { key: "parent", label: "Эцэг эх" },
  { key: "student", label: "Сурагч" },
  { key: "admin", label: "Админ" },
];

const INVITE_STATUS: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: "Хүлээгдэж буй", cls: "bg-amber-100 text-amber-700", icon: Clock },
  accepted: { label: "Хүлээн авсан", cls: "bg-green-100 text-green-700", icon: CheckCircle2 },
  revoked: { label: "Цуцлагдсан", cls: "bg-gray-100 text-gray-600", icon: Ban },
  expired: { label: "Хугацаа дууссан", cls: "bg-red-100 text-red-700", icon: X },
};

export function AdminUsers({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);

  const loadAll = useCallback(() => {
    Promise.all([
      usersApi.list().catch(() => [] as User[]),
      invitationsApi.list().catch(() => [] as Invitation[]),
      classesApi.list().catch(() => [] as ClassRoom[]),
    ])
      .then(([u, inv, cls]) => {
        setUsers(u);
        setInvitations(inv);
        setClasses(cls);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = users.filter((u) => {
    const matchSearch =
      search === "" ||
      `${u.first_name} ${u.last_name} ${u.email}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const pendingCount = invitations.filter((i) => i.status === "pending").length;

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Хэрэглэгчид</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Нийт {users.length} хэрэглэгч · {pendingCount} хүлээгдэж буй урилга
          </p>
        </div>
        <Button variant="amber" onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Хэрэглэгч урих
        </Button>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Хэрэглэгчид</TabsTrigger>
          <TabsTrigger value="invitations">
            Урилгууд
            {pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Users ── */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Хэрэглэгч хайх..."
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setRoleFilter(f.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    roleFilter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={Users}
                  text="Хэрэглэгч олдсонгүй"
                  hint="Шинэ хэрэглэгчийг 'Хэрэглэгч урих' товчоор урина уу"
                />
              ) : (
                <div className="divide-y">
                  {filtered.map((u) => {
                    const inactive = u.is_active === false;
                    const isSelf = u.id === currentUser.id;
                    return (
                      <div
                        key={u.id}
                        className={`flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 ${
                          inactive ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          {u.first_name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {u.first_name} {u.last_name}
                            {isSelf && (
                              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                (та)
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {u.email}
                            {currentUser.role === "super_admin" && u.school && (
                              <span className="ml-1.5 text-muted-foreground/70">
                                · {u.school.name}
                              </span>
                            )}
                          </p>
                        </div>
                        {inactive && (
                          <Badge
                            className="shrink-0 bg-gray-100 text-xs text-gray-500"
                            variant="secondary"
                          >
                            Идэвхгүй
                          </Badge>
                        )}
                        <Badge
                          className={`shrink-0 text-xs ${ROLE_COLOR[u.role] ?? "bg-muted"}`}
                          variant="secondary"
                        >
                          {ROLE_LABEL[u.role] ?? u.role}
                        </Badge>
                        {!isSelf && (
                          <div className="flex shrink-0 gap-1.5">
                            {inactive ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => handleReactivate(u)}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Сэргээх
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(u)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Invitations ── */}
        <TabsContent value="invitations">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : invitations.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  text="Урилга алга"
                  hint="Багш, эцэг эхийг урьж бүртгэлд нэмээрэй"
                />
              ) : (
                <div className="divide-y">
                  {invitations.map((inv) => {
                    const st = INVITE_STATUS[inv.status] ?? INVITE_STATUS.pending;
                    const StIcon = st.icon;
                    return (
                      <div
                        key={inv.id}
                        className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {inv.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ROLE_LABEL[inv.role] ?? inv.role}
                          </p>
                        </div>
                        <Badge className={`text-xs ${st.cls}`} variant="secondary">
                          <StIcon className="mr-1 h-3 w-3" />
                          {st.label}
                        </Badge>
                        {inv.status === "pending" ? (
                          <div className="flex gap-1.5">
                            {inv.token && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => copyInviteLink(inv.token!)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Холбоос
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleRevoke(inv.id)}
                            >
                              Цуцлах
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="Түүхээс устгах"
                            onClick={() => handleDeleteInvite(inv.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        classes={classes}
        onCreated={loadAll}
      />
    </div>
  );

  async function handleRevoke(id: number) {
    try {
      await invitationsApi.revoke(id);
      toast.success("Урилга цуцлагдлаа");
      setInvitations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "revoked" } : i)),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Цуцалж чадсангүй");
    }
  }

  async function handleDeleteInvite(id: number) {
    try {
      await invitationsApi.remove(id);
      toast.success("Урилга устгагдлаа");
      setInvitations((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Устгаж чадсангүй");
    }
  }

  async function handleDelete(u: User) {
    if (
      !confirm(
        `${u.first_name} ${u.last_name} (${u.email})-г устгах уу?\nХэрэглэгч идэвхгүй болж, нэвтрэх боломжгүй болно. Дараа нь сэргээж болно.`,
      )
    )
      return;
    try {
      await usersApi.remove(u.id);
      toast.success("Хэрэглэгч устгагдлаа");
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, is_active: false } : x)),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Устгаж чадсангүй");
    }
  }

  async function handleReactivate(u: User) {
    try {
      await usersApi.update(u.id, { is_active: true });
      toast.success("Хэрэглэгч сэргээгдлээ");
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, is_active: true } : x)),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Сэргээж чадсангүй");
    }
  }
}

function copyInviteLink(token: string) {
  const link = `${window.location.origin}/invite/${token}`;
  navigator.clipboard.writeText(link).then(
    () => toast.success("Урилгын холбоос хууллаа"),
    () => toast.error("Хуулж чадсангүй"),
  );
}

function EmptyState({
  icon: Icon,
  text,
  hint,
}: {
  icon: typeof Users;
  text: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14">
      <Icon className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">{text}</p>
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  classes,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes: ClassRoom[];
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "teacher" | "parent">("teacher");
  const [classId, setClassId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  function reset() {
    setEmail("");
    setRole("teacher");
    setClassId("");
    setCreatedLink(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const inv = await invitationsApi.create({
        email: email.trim(),
        role,
        class_id: classId ? Number(classId) : undefined,
      });
      toast.success("Урилга илгээгдлээ");
      onCreated();
      if (inv.token) {
        setCreatedLink(`${window.location.origin}/invite/${inv.token}`);
      } else {
        onOpenChange(false);
        reset();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Урилга илгээж чадсангүй");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Хэрэглэгч урих</DialogTitle>
          <DialogDescription>
            Имэйлээр урилга илгээнэ. Урьсан хүн холбоосоор дансаа үүсгэнэ.
          </DialogDescription>
        </DialogHeader>

        {createdLink ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <p className="text-sm text-green-800">
                Урилга үүслээ. Имэйл тохиргоогүй бол доорх холбоосыг хуваалцаарай.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
              <code className="flex-1 truncate text-xs text-muted-foreground">
                {createdLink}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(createdLink);
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
              <Label htmlFor="inv-email">Имэйл хаяг</Label>
              <Input
                id="inv-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hereglegch@school.mn"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Эрх</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as typeof role)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Багш</SelectItem>
                  <SelectItem value="parent">Эцэг эх</SelectItem>
                  <SelectItem value="admin">Сургуулийн Админ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === "teacher" && classes.length > 0 && (
              <div className="space-y-2">
                <Label>Анги (заавал биш)</Label>
                <Select
                  value={classId}
                  onValueChange={setClassId}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Анги сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({c.grade_level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                {submitting ? "Илгээж байна..." : "Урилга илгээх"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
