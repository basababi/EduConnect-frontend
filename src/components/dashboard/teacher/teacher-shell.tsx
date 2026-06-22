"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  GraduationCap,
  Home,
  CheckSquare,
  BarChart3,
  FileText,
  MessageSquare,
  Calendar,
  FileBarChart,
  Settings,
  LogOut,
  Bell,
  Menu,
  Wifi,
} from "lucide-react";
import { authApi, type User } from "@/lib/api";

export type TeacherView =
  | "overview"
  | "attendance"
  | "grades"
  | "assignments"
  | "messages"
  | "schedule"
  | "reports"
  | "settings";

interface NavItem {
  id: TeacherView;
  label: string;
  icon: typeof Home;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Нүүр", icon: Home },
  { id: "attendance", label: "Ирц бүртгэл", icon: CheckSquare },
  { id: "grades", label: "Дүн шинжилгээ", icon: BarChart3 },
  { id: "assignments", label: "Даалгавар", icon: FileText },
  { id: "messages", label: "Мессеж", icon: MessageSquare, badge: 4 },
  { id: "schedule", label: "Хуваарь", icon: Calendar },
  { id: "reports", label: "Тайлан", icon: FileBarChart },
  { id: "settings", label: "Тохиргоо", icon: Settings },
];

interface TeacherShellProps {
  user: User;
  activeView: TeacherView;
  onViewChange: (view: TeacherView) => void;
  onLogout: () => void;
  children: React.ReactNode;
  unreadMessages?: number;
  unreadNotifications?: number;
}

export function TeacherShell({
  user,
  activeView,
  onViewChange,
  onLogout,
  children,
  unreadMessages = 0,
  unreadNotifications = 0,
}: TeacherShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentTime = new Date().toLocaleTimeString("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleLogout() {
    await authApi.logout();
    onLogout();
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-primary text-primary-foreground">
      {/* Logo + User */}
      <div className="border-b border-primary-foreground/10 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold">EduConnect</h1>
            <p className="text-xs text-primary-foreground/60">Багшийн портал</p>
          </div>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 rounded-lg bg-primary-foreground/5 p-3">
          <Avatar className="h-10 w-10 border-2 border-accent">
            <AvatarFallback className="bg-accent text-accent-foreground">
              {user.first_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user.first_name} {user.last_name}
            </p>
            <p className="truncate text-xs text-primary-foreground/60">
              {user.role === "teacher" ? "Багш" : user.role}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
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
                  ? "bg-accent text-accent-foreground"
                  : "text-primary-foreground/80 hover:bg-primary-foreground/10"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === "messages" && unreadMessages > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadMessages}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-primary-foreground/10 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
          Гарах
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 md:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
          {/* Left: Mobile menu + page title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold capitalize">
                {NAV_ITEMS.find((n) => n.id === activeView)?.label ||
                  "Нүүр хуудас"}
              </h2>
            </div>
          </div>

          {/* Right: Status + notifications + avatar */}
          <div className="flex items-center gap-3">
            {/* Online status */}
            <div className="hidden items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs text-green-700 sm:flex">
              <Wifi className="h-3 w-3" />
              Онлайн
            </div>

            {/* Server time */}
            <div className="hidden text-xs text-muted-foreground lg:block">
              Сүүлийн хадгалсан: {currentTime}
            </div>

            {/* Notification bell */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadNotifications}
                </span>
              )}
            </Button>

            {/* Avatar */}
            <Avatar className="h-9 w-9 border-2 border-primary">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user.first_name[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}