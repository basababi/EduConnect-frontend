"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  GraduationCap,
  Home,
  BookOpen,
  Heart,
  Briefcase,
  MessageSquare,
  Calendar,
  Bell,
  Menu,
  LogOut,
  Sparkles,
  Wifi,
} from "lucide-react";
import { authApi, type User } from "@/lib/api";

export type StudentView =
  | "overview"
  | "ai-tutor"
  | "wellbeing"
  | "career"
  | "schedule"
  | "messages";

interface NavItem {
  id: StudentView;
  label: string;
  icon: typeof Home;
  isAI?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Нүүр", icon: Home },
  { id: "schedule", label: "Хуваарь", icon: Calendar },
  { id: "messages", label: "Мессеж", icon: MessageSquare },
  { id: "ai-tutor", label: "Хичээлийн Дагуул", icon: BookOpen, isAI: true },
  { id: "wellbeing", label: "Сэтгэл Зүйч", icon: Heart, isAI: true },
  { id: "career", label: "Карьер Зөвлөгөө", icon: Briefcase, isAI: true },
];

interface StudentShellProps {
  user: User;
  activeView: StudentView;
  onViewChange: (view: StudentView) => void;
  onLogout: () => void;
  children: React.ReactNode;
  unreadMessages?: number;
  unreadNotifications?: number;
}

export function StudentShell({
  user,
  activeView,
  onViewChange,
  onLogout,
  children,
  unreadMessages = 0,
  unreadNotifications = 0,
}: StudentShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await authApi.logout();
    onLogout();
  }

  const mainItems = NAV_ITEMS.filter((i) => !i.isAI);
  const aiItems = NAV_ITEMS.filter((i) => i.isAI);

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[#1B2B4B] text-white">
      {/* Logo */}
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5A623]">
            <GraduationCap className="h-5 w-5 text-[#1B2B4B]" />
          </div>
          <div>
            <h1 className="text-sm font-bold">EduConnect</h1>
            <p className="text-xs text-white/60">Сурагчийн портал</p>
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
            <p className="truncate text-xs text-white/60">Сурагч</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-3 py-2">
          Үндсэн цэс
        </p>
        {mainItems.map((item) => {
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
              {item.id === "messages" && unreadMessages > 0 && (
                <Badge className="bg-red-500 text-white text-[10px] h-4 px-1">
                  {unreadMessages}
                </Badge>
              )}
            </button>
          );
        })}

        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-3 py-2 mt-3">
          AI Дагуул
        </p>
        {aiItems.map((item) => {
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
              <Sparkles
                className={`h-3 w-3 shrink-0 ${isActive ? "text-[#1B2B4B]/60" : "text-[#F5A623]/60"}`}
              />
            </button>
          );
        })}
      </nav>

      {/* Logout */}
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

  const pageLabel = NAV_ITEMS.find((n) => n.id === activeView)?.label ?? "Нүүр";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
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

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
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
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadNotifications}
                </span>
              )}
            </Button>
            <Avatar className="h-9 w-9 border-2 border-[#1B2B4B]">
              <AvatarFallback className="bg-[#1B2B4B] text-white text-sm">
                {user.first_name[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
