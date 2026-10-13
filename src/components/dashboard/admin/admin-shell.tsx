"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  GraduationCap,
  Home,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  Wifi,
  Shield,
  Building2,
  Megaphone,
  Trophy,
  Library,
  UserRound,
} from "lucide-react";
import { authApi, type User } from "@/lib/api";
import { hasFeature, type FeatureKey } from "@/lib/features";
import { ROLE_LABELS, TERMS } from "@/lib/terms";
import { NotificationBell } from "@/components/dashboard/notification-bell";

export type AdminView =
  | "overview"
  | "schools"
  | "users"
  | "courses"
  | "classes"
  | "students"
  | "universities"
  | "exams"
  | "announcements"
  | "reports"
  | "settings";

interface NavItem {
  id: AdminView;
  label: string;
  icon: typeof Home;
  /** Төвд энэ боломж асаалттай үед л харагдана */
  feature?: FeatureKey;
}

const ADMIN_NAV: NavItem[] = [
  { id: "overview", label: "Нүүр", icon: Home },
  { id: "courses", label: "Курсууд", icon: Library },
  { id: "classes", label: TERMS.group.many, icon: BookOpen },
  { id: "students", label: "Сурагчид", icon: UserRound },
  { id: "users", label: "Хэрэглэгчид", icon: Users },
  { id: "universities", label: "Их сургууль (карьер)", icon: GraduationCap, feature: "career" },
  { id: "exams", label: "Нийтийн шалгалт", icon: Trophy, feature: "public_exams" },
  { id: "announcements", label: "Зарлал", icon: Megaphone },
  { id: "reports", label: "Тайлан", icon: BarChart3 },
  { id: "settings", label: "Тохиргоо", icon: Settings },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  { id: "overview", label: "Нүүр", icon: Home },
  { id: "schools", label: TERMS.org.many, icon: Building2 },
  { id: "users", label: "Хэрэглэгчид", icon: Users },
  { id: "universities", label: "Их сургууль (карьер)", icon: GraduationCap, feature: "career" },
  { id: "exams", label: "Нийтийн шалгалт", icon: Trophy, feature: "public_exams" },
  { id: "announcements", label: "Зарлал", icon: Megaphone },
  { id: "reports", label: "Тайлан", icon: BarChart3 },
  { id: "settings", label: "Тохиргоо", icon: Settings },
];

interface AdminShellProps {
  user: User;
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AdminShell({
  user,
  activeView,
  onViewChange,
  onLogout,
  children,
}: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = (user.role === "super_admin" ? SUPER_ADMIN_NAV : ADMIN_NAV).filter(
    (item) => !item.feature || hasFeature(user, item.feature),
  );

  async function handleLogout() {
    await authApi.logout();
    onLogout();
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-[#1B2B4B] text-white">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5A623]">
            <GraduationCap className="h-5 w-5 text-[#1B2B4B]" />
          </div>
          <div>
            <h1 className="text-sm font-bold">EduConnect</h1>
            <p className="text-xs text-white/60">Админ портал</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
          <Avatar className="h-10 w-10 border-2 border-[#F5A623]">
            <AvatarFallback className="bg-[#F5A623] text-[#1B2B4B] font-bold text-sm">
              {user.first_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user.first_name} {user.last_name}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield className="h-3 w-3 text-[#F5A623]" />
              <p className="text-xs text-white/60">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                setMobileOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#F5A623] text-[#1B2B4B]"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
        >
          <LogOut className="h-4 w-4" />
          Гарах
        </button>
      </div>
    </div>
  );

  const pageLabel = navItems.find((n) => n.id === activeView)?.label ?? "Нүүр";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="hidden w-64 shrink-0 md:block">{sidebar}</aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-[#1B2B4B]">{pageLabel}</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs text-green-700 sm:flex">
              <Wifi className="h-3 w-3" />
              Онлайн
            </div>
            <NotificationBell />
            <Avatar className="h-9 w-9 border-2 border-[#1B2B4B]">
              <AvatarFallback className="bg-[#1B2B4B] text-white text-sm">
                {user.first_name[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
