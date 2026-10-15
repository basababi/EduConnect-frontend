"use client";

import {
  Home, BookOpen, Briefcase, MessageSquare, Calendar, Bot, FileText, Megaphone, FolderOpen, Trophy,
  Wallet,
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
  | "exams"
  | "schedule"
  | "submissions"
  | "materials"
  | "payments"
  | "announcements"
  | "messages";

const SECTIONS: ShellNavSection[] = [
  {
    label: "Үндсэн цэс",
    items: [
      { id: "overview", label: "Нүүр", icon: Home, primary: true },
      { id: "schedule", label: "Хуваарь", icon: Calendar, primary: true },
      { id: "submissions", label: "Даалгавар", icon: FileText, primary: true },
      { id: "materials", label: "Хичээлийн материал", icon: FolderOpen },
      { id: "payments", label: "Төлбөр", icon: Wallet },
      { id: "announcements", label: "Зарлал", icon: Megaphone },
      { id: "messages", label: "Мессеж", icon: MessageSquare },
    ],
  },
  {
    // Төв бүрээр асаадаг нэмэлт боломжууд — асаагаагүй бол энэ хэсэг бүхэлдээ харагдахгүй
    label: "AI Дагуул",
    items: [
      { id: "ai-tutor", label: "Хичээлийн Дагуул", icon: BookOpen, ai: true, primary: true, shortLabel: "Дагуул", feature: "ai_tutor" },
      { id: "exams", label: "Нийтийн шалгалт", icon: Trophy, shortLabel: "Шалгалт", feature: "public_exams" },
      { id: "career", label: "Карьер Зөвлөгөө", icon: Briefcase, ai: true, shortLabel: "Карьер", feature: "career" },
      { id: "ai-chat", label: "AI Туслах", icon: Bot, ai: true, feature: "ai_chat" },
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
}

export function StudentShell({
  user,
  activeView,
  onViewChange,
  onLogout,
  children,
  unreadMessages = 0,
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
    >
      {children}
    </DashboardShell>
  );
}
