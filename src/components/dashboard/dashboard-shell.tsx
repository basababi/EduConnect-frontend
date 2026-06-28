"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { GraduationCap, Menu, LogOut, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { authApi, type User } from "@/lib/api";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/dashboard/notification-bell";

export interface ShellNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  ai?: boolean;
  badge?: number;
}

export interface ShellNavSection {
  label?: string;
  items: ShellNavItem[];
}

interface DashboardShellProps {
  user: User;
  portalLabel: string;
  roleLabel: string;
  sections: ShellNavSection[];
  activeView: string;
  onViewChange: (id: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
  unreadMessages?: number;
  unreadNotifications?: number;
  mainClassName?: string;
}

export function DashboardShell({
  user,
  portalLabel,
  roleLabel,
  sections,
  activeView,
  onViewChange,
  onLogout,
  children,
  unreadMessages = 0,
  unreadNotifications = 0,
  mainClassName,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await authApi.logout();
    onLogout();
  }

  const allItems = sections.flatMap((s) => s.items);
  const pageLabel = allItems.find((n) => n.id === activeView)?.label ?? portalLabel;
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();

  const NavButton = ({ item }: { item: ShellNavItem }) => {
    const Icon = item.icon;
    const isActive = activeView === item.id;
    const badge = item.id === "messages" ? unreadMessages : item.badge ?? 0;
    return (
      <button
        onClick={() => {
          onViewChange(item.id);
          setMobileOpen(false);
        }}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary-foreground/40" />
        )}
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {badge > 0 && (
          <span
            className={cn(
              "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
              isActive ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground" : "bg-rose-500 text-white",
            )}
          >
            {badge}
          </span>
        )}
        {item.ai && badge === 0 && (
          <Sparkles
            className={cn(
              "size-3 shrink-0 transition-colors",
              isActive ? "text-sidebar-primary-foreground/60" : "text-sidebar-primary/70",
            )}
          />
        )}
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo + user */}
      <div className="border-b border-sidebar-border p-4">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">EduConnect</h1>
            <p className="text-xs text-sidebar-foreground/55">{portalLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent p-3">
          <Avatar className="size-10 ring-2 ring-sidebar-primary/60">
            <AvatarFallback className="bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
              {initials || user.first_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user.first_name} {user.last_name}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/55">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="scrollbar-slim flex-1 space-y-0.5 overflow-y-auto p-3">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-4" : ""}>
            {section.label && (
              <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {section.label}
              </p>
            )}
            {section.items.map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
        >
          <LogOut className="size-4" />
          Гарах
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 md:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 border-0 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{pageLabel}</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Онлайн
            </div>
            <NotificationBell />
            <Avatar className="size-9 ring-2 ring-primary/15">
              <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                {initials || user.first_name?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className={cn("flex-1 overflow-y-auto", mainClassName)}>
          <div key={activeView} className="animate-in-fade h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
