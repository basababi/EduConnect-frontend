"use client";

import { Home, CheckSquare, BarChart3, MessageSquare, Megaphone, Wallet } from "lucide-react";
import { type User } from "@/lib/api";
import {
  DashboardShell, type ShellNavSection,
} from "@/components/dashboard/dashboard-shell";

export type ParentView =
  | "overview"
  | "attendance"
  | "grades"
  | "messages"
  | "payments"
  | "announcements";

const SECTIONS: ShellNavSection[] = [
  {
    items: [
      { id: "overview", label: "Нүүр", icon: Home, primary: true },
      { id: "attendance", label: "Ирц", icon: CheckSquare, primary: true },
      { id: "grades", label: "Дүн", icon: BarChart3, primary: true },
      { id: "messages", label: "Мессеж", icon: MessageSquare, primary: true },
      { id: "payments", label: "Төлбөр", icon: Wallet },
      { id: "announcements", label: "Зарлал", icon: Megaphone },
    ],
  },
];

interface ParentShellProps {
  user: User;
  activeView: ParentView;
  onViewChange: (view: ParentView) => void;
  onLogout: () => void;
  children: React.ReactNode;
  unreadMessages?: number;
}

export function ParentShell({
  user,
  activeView,
  onViewChange,
  onLogout,
  children,
  unreadMessages = 0,
}: ParentShellProps) {
  return (
    <DashboardShell
      user={user}
      portalLabel="Эцэг эхийн портал"
      roleLabel="Эцэг эх"
      sections={SECTIONS}
      activeView={activeView}
      onViewChange={(id) => onViewChange(id as ParentView)}
      onLogout={onLogout}
      unreadMessages={unreadMessages}
    >
      {children}
    </DashboardShell>
  );
}
