"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Plus, Trash2, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  calendarApi,
  classesApi,
  type ClassRoom,
  type TimetableSlot,
  type UpsertSlotDto,
} from "@/lib/api";

const DAYS = [
  { dow: 1, label: "Даваа" },
  { dow: 2, label: "Мягмар" },
  { dow: 3, label: "Лхагва" },
  { dow: 4, label: "Пүрэв" },
  { dow: 5, label: "Баасан" },
];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export function TeacherSchedule() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [dialog, setDialog] = useState<{ day: number; period: number } | null>(null);

  useEffect(() => {
    classesApi
      .list()
      .then((cls) => {
        setClasses(cls);
        if (cls.length) setClassId(String(cls[0].id));
      })
      .catch(() => setClasses([]))
      .finally(() => setLoadingClasses(false));
  }, []);

  const loadSlots = useCallback(() => {
    if (!classId) return;
    setLoadingSlots(true);
    calendarApi
      .classTimetable(Number(classId))
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [classId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const slotAt = (day: number, period: number) =>
    slots.find((s) => s.day_of_week === day && s.period === period);

  async function deleteSlot(id: number) {
    try {
      await calendarApi.deleteSlot(id);
      toast.success("Хичээл хасагдлаа");
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Хасаж чадсангүй");
    }
  }

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Хичээлийн хуваарь</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ангиа сонгож хуваарийг засна уу
          </p>
        </div>
        {!loadingClasses && classes.length > 0 && (
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Анги сонгох" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {loadingClasses ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : classes.length === 0 ? (
        <EmptyCard text="Танд хуваарь засах анги алга" />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-3">
            <div className="min-w-[680px]">
              {/* Header row */}
              <div className="grid grid-cols-[64px_repeat(5,1fr)] gap-1.5">
                <div />
                {DAYS.map((d) => (
                  <div
                    key={d.dow}
                    className="rounded-lg bg-primary/5 py-2 text-center text-sm font-semibold text-primary"
                  >
                    {d.label}
                  </div>
                ))}
              </div>

              {/* Period rows */}
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
                    if (loadingSlots) {
                      return <Skeleton key={d.dow} className="h-16 rounded-lg" />;
                    }
                    return slot ? (
                      <div
                        key={d.dow}
                        className="group relative rounded-lg border border-primary/20 bg-primary/5 p-2"
                      >
                        <p className="truncate text-xs font-semibold text-foreground">
                          {slot.subject}
                        </p>
                        {(slot.start_time || slot.room) && (
                          <div className="mt-1 space-y-0.5">
                            {slot.start_time && (
                              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-2.5 w-2.5" />
                                {slot.start_time}
                                {slot.end_time ? `-${slot.end_time}` : ""}
                              </p>
                            )}
                            {slot.room && (
                              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <MapPin className="h-2.5 w-2.5" />
                                {slot.room}
                              </p>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => deleteSlot(slot.id)}
                          className="absolute right-1 top-1 rounded p-0.5 text-destructive opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        key={d.dow}
                        onClick={() => setDialog({ day: d.dow, period })}
                        className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground/40 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {dialog && classId && (
        <SlotDialog
          key={`${dialog.day}-${dialog.period}`}
          classId={Number(classId)}
          day={dialog.day}
          period={dialog.period}
          onClose={() => setDialog(null)}
          onSaved={loadSlots}
        />
      )}
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
        <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

function SlotDialog({
  classId,
  day,
  period,
  onClose,
  onSaved,
}: {
  classId: number;
  day: number;
  period: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [room, setRoom] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dayLabel = DAYS.find((d) => d.dow === day)?.label ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const dto: UpsertSlotDto = {
      class_id: classId,
      day_of_week: day,
      period,
      subject: subject.trim(),
      room: room.trim() || undefined,
      start_time: start || undefined,
      end_time: end || undefined,
    };
    try {
      await calendarApi.upsertSlot(dto);
      toast.success("Хичээл нэмэгдлээ");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Хадгалж чадсангүй");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Хичээл нэмэх</DialogTitle>
          <DialogDescription>
            {dayLabel} · {period}-р цаг
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sl-subject">Хичээл</Label>
            <Input
              id="sl-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Математик"
              required
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sl-room">Анги/Өрөө (заавал биш)</Label>
            <Input
              id="sl-room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="201"
              disabled={submitting}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sl-start">Эхлэх</Label>
              <Input
                id="sl-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sl-end">Дуусах</Label>
              <Input
                id="sl-end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Болих
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Хадгалж байна..." : "Нэмэх"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
