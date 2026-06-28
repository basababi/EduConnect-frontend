"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock, MapPin, CalendarClock } from "lucide-react";
import { calendarApi, type TimetableSlot, type CalendarEventItem } from "@/lib/api";

const DAYS = [
  { dow: 1, label: "Даваа" },
  { dow: 2, label: "Мягмар" },
  { dow: 3, label: "Лхагва" },
  { dow: 4, label: "Пүрэв" },
  { dow: 5, label: "Баасан" },
];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const EVENT_META: Record<string, { label: string; cls: string }> = {
  holiday: { label: "Амралт", cls: "bg-green-100 text-green-700" },
  exam: { label: "Шалгалт", cls: "bg-red-100 text-red-700" },
  ptm: { label: "Эцэг эхийн уулзалт", cls: "bg-blue-100 text-blue-700" },
  event: { label: "Арга хэмжээ", cls: "bg-amber-100 text-amber-700" },
};

export function StudentSchedule() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      calendarApi.myTimetable().catch(() => [] as TimetableSlot[]),
      calendarApi.events().catch(() => [] as CalendarEventItem[]),
    ])
      .then(([s, e]) => {
        setSlots(s);
        setEvents(e);
      })
      .finally(() => setLoading(false));
  }, []);

  const slotAt = (day: number, period: number) =>
    slots.find((s) => s.day_of_week === day && s.period === period);
  const todayDow = ((new Date().getDay() + 6) % 7) + 1; // 1=Даваа

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Хичээлийн хуваарь</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">7 хоногийн хуваарь</p>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : slots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
            <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Хуваарь хараахан бүртгэгдээгүй</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-3">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[64px_repeat(5,1fr)] gap-1.5">
                <div />
                {DAYS.map((d) => (
                  <div
                    key={d.dow}
                    className={`rounded-lg py-2 text-center text-sm font-semibold ${
                      d.dow === todayDow
                        ? "bg-amber text-amber-foreground"
                        : "bg-primary/5 text-primary"
                    }`}
                  >
                    {d.label}
                  </div>
                ))}
              </div>
              {PERIODS.map((period) => (
                <div
                  key={period}
                  className="mt-1.5 grid grid-cols-[64px_repeat(5,1fr)] gap-1.5"
                >
                  <div className="flex items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                    {period}-р
                  </div>
                  {DAYS.map((d) => {
                    const slot = slotAt(d.dow, period);
                    return slot ? (
                      <div
                        key={d.dow}
                        className="rounded-lg border border-primary/20 bg-primary/5 p-2"
                      >
                        <p className="truncate text-xs font-semibold text-foreground">
                          {slot.subject}
                        </p>
                        {slot.start_time && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            {slot.start_time}
                          </p>
                        )}
                        {slot.room && (
                          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5" />
                            {slot.room}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div key={d.dow} className="h-16 rounded-lg bg-muted/30" />
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming events */}
      {events.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary">
            <CalendarClock className="h-5 w-5" />
            Удахгүй болох
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {events.map((ev) => {
              const meta = EVENT_META[ev.type] ?? EVENT_META.event;
              return (
                <Card key={ev.id}>
                  <CardContent className="flex items-start gap-3 p-3">
                    <div className="flex flex-col items-center rounded-lg bg-muted px-2.5 py-1.5 text-center">
                      <span className="text-xs font-bold text-foreground">
                        {new Date(ev.event_date).getDate()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(ev.event_date).toLocaleDateString("mn-MN", {
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {ev.title}
                      </p>
                      {ev.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {ev.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className={`text-xs ${meta.cls}`}>
                      {meta.label}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
