"use client";

import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { WeekSchedule } from "@/components/dashboard/sessions/session-ui";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";

/** Сурагчийн хуваарь — элссэн бүх бүлгийн бодит хичээлүүд (цуцлагдсан, нөхөх хичээлтэй) */
export function StudentSchedule() {
  return (
    <div className="animate-in-rise space-y-6 p-4 sm:p-6">
      <PageHeader
        icon={CalendarDays}
        title="Хичээлийн хуваарь"
        description="Элссэн бүх бүлгийн хичээл — цуцлагдсан, нөхөх хичээл энд харагдана"
      />
      <WeekSchedule showTeacher emptyText="Энэ долоо хоногт хичээл алга" />
      <UpcomingEvents />
    </div>
  );
}
