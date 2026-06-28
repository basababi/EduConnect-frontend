"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  CheckCheck,
  GraduationCap,
  CalendarCheck,
  FileText,
  MessageSquare,
  Megaphone,
  Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { notificationsApi, type NotificationItem } from "@/lib/api";

const TYPE_ICON: Record<string, { icon: LucideIcon; cls: string }> = {
  attendance: { icon: CalendarCheck, cls: "bg-emerald-100 text-emerald-600" },
  grade: { icon: GraduationCap, cls: "bg-primary/10 text-primary" },
  assignment: { icon: FileText, cls: "bg-amber-100 text-amber-600" },
  message: { icon: MessageSquare, cls: "bg-blue-100 text-blue-600" },
  announcement: { icon: Megaphone, cls: "bg-purple-100 text-purple-600" },
  system: { icon: Info, cls: "bg-muted text-muted-foreground" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Дөнгөж сая";
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} цаг`;
  return `${Math.floor(h / 24)} өдөр`;
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    notificationsApi
      .list({ limit: 20 })
      .then((res) => setItems(res.items ?? []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000); // 1 минут тутамд шинэчилнэ
    return () => clearInterval(t);
  }, [load]);

  const unread = items.filter((n) => !n.is_read).length;

  async function markRead(n: NotificationItem) {
    if (n.is_read) return;
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
    );
    notificationsApi.markRead(n.id).catch(() => load());
  }

  async function markAll() {
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    notificationsApi.markAllRead().catch(() => load());
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-muted">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-sm font-semibold text-foreground">Мэдэгдэл</p>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Бүгдийг уншсан
            </button>
          )}
        </div>

        <div className="scrollbar-slim max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Bell className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Мэдэгдэл алга</p>
            </div>
          ) : (
            items.map((n) => {
              const meta = TYPE_ICON[n.type] ?? TYPE_ICON.system;
              const Icon = meta.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/50 ${
                    n.is_read ? "" : "bg-primary/[0.03]"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.cls}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    {n.body && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    )}
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
