"use client";

import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { WeekSchedule } from "@/components/dashboard/sessions/session-ui";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";

/**
 * Багшийн хуваарь — заах хичээлүүд (өөрийн бүлгүүд + орлон заах хичээл).
 * Долоо хоногийн хуваарийг бүлгийн дэлгэрэнгүйгээс админ тохируулна; хичээлүүд түүнээс
 * автоматаар үүснэ.
 */
export function TeacherSchedule() {
  return (
    <div className="animate-in-rise space-y-6 p-4 sm:p-6">
      <PageHeader
        icon={CalendarDays}
        title="Миний хуваарь"
        description="Заах хичээлүүд — ирцийг «Ирц бүртгэл» цэснээс авна"
      />
      <WeekSchedule emptyText="Энэ долоо хоногт заах хичээл алга" />
      <UpcomingEvents />
    </div>
  );
}
