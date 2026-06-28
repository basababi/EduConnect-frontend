"use client";

import {
  Home, BookOpen, Briefcase, MessageSquare, Calendar, Bot, FileText, Megaphone, FolderOpen,
} from "lucide-react";
import { type User } from "@/lib/api";
import {
  DashboardShell, type ShellNavSection,
} from "@/components/dashboard/dashboard-shell";

export type StudentView =
  | "overview"
  | "ai-tutor"
  | "ai-chat"
  | "career"
  | "schedule"
  | "submissions"
  | "materials"
  | "announcements"
  | "messages";

const SECTIONS: ShellNavSection[] = [
  {
    label: "Үндсэн цэс",
    items: [
      { id: "overview", label: "Нүүр", icon: Home },
      { id: "schedule", label: "Хуваарь", icon: Calendar },
      { id: "submissions", label: "Даалгавар", icon: FileText },
      { id: "materials", label: "Хичээлийн материал", icon: FolderOpen },
      { id: "announcements", label: "Зарлал", icon: Megaphone },
      { id: "messages", label: "Мессеж", icon: MessageSquare },
    ],
  },
  {
    label: "AI Дагуул",
    items: [
      { id: "ai-tutor", label: "Хичээлийн Дагуул", icon: BookOpen, ai: true },
      { id: "career", label: "Карьер Зөвлөгөө", icon: Briefcase, ai: true },
      { id: "ai-chat", label: "AI Туслах", icon: Bot, ai: true },
    ],
  },
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
  return (
    <DashboardShell
      user={user}
      portalLabel="Сурагчийн портал"
      roleLabel="Сурагч"
      sections={SECTIONS}
      activeView={activeView}
      onViewChange={(id) => onViewChange(id as StudentView)}
      onLogout={onLogout}
      unreadMessages={unreadMessages}
      unreadNotifications={unreadNotifications}
    >
      {children}
    </DashboardShell>
  );
}
