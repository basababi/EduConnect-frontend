"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CalendarClock } from "lucide-react";
import { calendarApi, type CalendarEventItem } from "@/lib/api";

const EVENT_META: Record<string, { label: string; cls: string }> = {
  holiday: { label: "Амралт", cls: "bg-green-100 text-green-700" },
  exam: { label: "Шалгалт", cls: "bg-red-100 text-red-700" },
  ptm: { label: "Эцэг эхийн уулзалт", cls: "bg-blue-100 text-blue-700" },
  event: { label: "Арга хэмжээ", cls: "bg-amber-100 text-amber-700" },
};

/** Удахгүй болох үйл явдал, амралтын өдрүүд (төв даяар + өөрт хамаарах бүлгүүд) */
export function UpcomingEvents() {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);

  useEffect(() => {
    calendarApi
      .events()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  if (events.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
        <CalendarClock className="h-5 w-5 text-primary" />
        Удахгүй болох
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {events.map((ev) => {
          const meta = EVENT_META[ev.type] ?? EVENT_META.event;
          // "YYYY-MM-DD" мөрөөс шууд — цагийн бүсээс хамаарч өдөр шилжихгүй
          const [, month, day] = ev.event_date.slice(0, 10).split("-");
          return (
            <div key={ev.id} className="flex items-start gap-3 rounded-xl border bg-card p-3">
              <div className="flex min-w-11 flex-col items-center rounded-lg bg-muted px-2 py-1.5 text-center">
                <span className="text-sm font-bold tabular-nums text-foreground">{Number(day)}</span>
                <span className="text-[10px] text-muted-foreground">{Number(month)}-р сар</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{ev.title}</p>
                {ev.description && (
                  <p className="truncate text-xs text-muted-foreground">{ev.description}</p>
                )}
              </div>
              <Badge variant="secondary" className={`text-xs ${meta.cls}`}>
                {meta.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </section>
  );
}
