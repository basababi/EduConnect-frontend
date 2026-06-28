"use client";

import { Home, CheckSquare, BarChart3, MessageSquare, Megaphone } from "lucide-react";
import { type User } from "@/lib/api";
import {
  DashboardShell, type ShellNavSection,
} from "@/components/dashboard/dashboard-shell";

export type ParentView =
  | "overview"
  | "attendance"
  | "grades"
  | "messages"
  | "announcements";

const SECTIONS: ShellNavSection[] = [
  {
    items: [
      { id: "overview", label: "Нүүр", icon: Home },
      { id: "attendance", label: "Ирц", icon: CheckSquare },
      { id: "grades", label: "Дүн", icon: BarChart3 },
      { id: "messages", label: "Мессеж", icon: MessageSquare },
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
  unreadNotifications?: number;
}

export function ParentShell({
  user,
  activeView,
  onViewChange,
  onLogout,
  children,
  unreadMessages = 0,
  unreadNotifications = 0,
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
      unreadNotifications={unreadNotifications}
    >
      {children}
    </DashboardShell>
  );
}
