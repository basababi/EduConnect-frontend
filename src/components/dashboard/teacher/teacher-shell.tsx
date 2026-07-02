"use client";

import {
  Home, CheckSquare, BarChart3, FileText, MessageSquare,
  Calendar, FileBarChart, Settings, Megaphone, Users, FolderOpen, BookMarked,
  ClipboardCheck,
} from "lucide-react";
import { type User } from "@/lib/api";
import {
  DashboardShell, type ShellNavSection,
} from "@/components/dashboard/dashboard-shell";

export type TeacherView =
  | "overview"
  | "subjects"
  | "students"
  | "attendance"
  | "grades"
  | "assignments"
  | "materials"
  | "messages"
  | "ai-reviews"
  | "schedule"
  | "announcements"
  | "reports"
  | "settings";

const SECTIONS: ShellNavSection[] = [
  {
    label: "Заах үйл ажиллагаа",
    items: [
      { id: "overview", label: "Нүүр", icon: Home },
      { id: "subjects", label: "Миний хичээлүүд", icon: BookMarked },
      { id: "students", label: "Сурагчид", icon: Users },
      { id: "attendance", label: "Ирц бүртгэл", icon: CheckSquare },
      { id: "grades", label: "Дүн шинжилгээ", icon: BarChart3 },
      { id: "assignments", label: "Даалгавар", icon: FileText },
      { id: "materials", label: "Хичээлийн материал", icon: FolderOpen },
      { id: "ai-reviews", label: "AI шалгалт", icon: ClipboardCheck },
      { id: "messages", label: "Мессеж", icon: MessageSquare },
    ],
  },
  {
    label: "Удирдлага",
    items: [
      { id: "schedule", label: "Хуваарь", icon: Calendar },
      { id: "announcements", label: "Зарлал", icon: Megaphone },
      { id: "reports", label: "Тайлан", icon: FileBarChart },
      { id: "settings", label: "Тохиргоо", icon: Settings },
    ],
  },
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
  return (
    <DashboardShell
      user={user}
      portalLabel="Багшийн портал"
      roleLabel={user.role === "teacher" ? "Багш" : user.role}
      sections={SECTIONS}
      activeView={activeView}
      onViewChange={(id) => onViewChange(id as TeacherView)}
      onLogout={onLogout}
      unreadMessages={unreadMessages}
      unreadNotifications={unreadNotifications}
      mainClassName="p-4 md:p-6"
    >
      {children}
    </DashboardShell>
  );
}
