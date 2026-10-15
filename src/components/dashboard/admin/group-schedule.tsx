"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarPlus,
  Clock,
  MoreVertical,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trash2,
  Undo2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  calendarApi,
  sessionsApi,
  type ClassRoom,
  type ClassSession,
  type TimetableSlot,
} from "@/lib/api";
import { addDaysLocal, formatDate, formatTimeRange, isoWeekdayOf, todayLocal } from "@/lib/format";
import { WEEKDAY_LABELS, WEEKDAY_SHORT } from "@/lib/terms";
import {
  SessionKindPill,
  SessionStatusPill,
} from "@/components/dashboard/sessions/session-ui";
import { ReasonDialog } from "@/components/dashboard/reason-dialog";

const errorMessage = (e: unknown, fallback: string) =>
  e instanceof Error ? e.message : fallback;

const DAYS = [1, 2, 3, 4, 5, 6, 7];

/* ══════════════════════════ Долоо хоногийн хуваарь ══════════════════════════ */

/**
 * Бүлгийн долоо хоногийн хуваарь (гараг + цаг). Хадгалах бүрд ирэх хичээлүүд автоматаар
 * тохирно; өнгөрсөн, ирцтэй, цуцлагдсан хичээл хэвээр.
 */
export function GroupTimetable({ group, onChanged }: { group: ClassRoom; onChanged?: () => void }) {
  const [slots, setSlots] = useState<TimetableSlot[] | null>(null);
  const [editing, setEditing] = useState<TimetableSlot | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = useCallback(() => {
    calendarApi
      .classTimetable(group.id)
      .then(setSlots)
      .catch(() => setSlots([]));
  }, [group.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(slot: TimetableSlot) {
    try {
      const res = await calendarApi.deleteSlot(slot.id);
      toast.success(
        res.sessions_removed > 0
          ? `Хасагдлаа · ирэх ${res.sessions_removed} хичээл хасагдсан`
          : "Хуваарийн мөр хасагдлаа",
      );
      setConfirmDelete(null);
      load();
      onChanged?.();
    } catch (err) {
      toast.error(errorMessage(err, "Хасаж чадсангүй"));
    }
  }

  const timed = (slots ?? []).filter((s) => s.start_time && s.end_time);
  const legacy = (slots ?? []).filter((s) => !s.start_time || !s.end_time);

  return (
    <div className="space-y-4">
      {!slots ? (
        <Skeleton className="h-24 w-full rounded-lg" />
      ) : timed.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Хуваарь тохируулаагүй — гараг, цагаа нэмэхэд хичээлүүд автоматаар үүснэ.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {timed.map((s) => (
            <li
              key={s.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-2.5",
                editing?.id === s.id && "border-primary ring-1 ring-primary/30",
              )}
            >
              <span className="w-16 shrink-0 text-sm font-semibold text-foreground">
                {WEEKDAY_LABELS[s.day_of_week]}
              </span>
              <span className="flex-1 text-sm tabular-nums text-foreground">
                {formatTimeRange(s.start_time!, s.end_time!)}
                <span className="ml-2 text-xs text-muted-foreground">
                  {s.room ?? group.room ?? ""}
                </span>
              </span>
              {confirmDelete === s.id ? (
                <span className="flex gap-1">
                  <Button size="xs" variant="destructive-solid" onClick={() => remove(s)}>
                    Хасах
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => setConfirmDelete(null)}>
                    Болих
                  </Button>
                </span>
              ) : (
                <span className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Засах"
                    onClick={() => {
                      setEditing(s);
                      setFormKey((k) => k + 1);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Хасах"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmDelete(s.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {legacy.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Цаггүй хуучин {legacy.length} мөр байна — тэдгээрээс хичээл үүсэхгүй. Цагтайгаар дахин нэмнэ үү.
        </p>
      )}

      <SlotForm
        key={`${editing?.id ?? "new"}-${formKey}`}
        group={group}
        editing={editing}
        onCancelEdit={() => {
          setEditing(null);
          setFormKey((k) => k + 1);
        }}
        onSaved={() => {
          setEditing(null);
          setFormKey((k) => k + 1);
          load();
          onChanged?.();
        }}
      />
    </div>
  );
}

function SlotForm({
  group,
  editing,
  onSaved,
  onCancelEdit,
}: {
  group: ClassRoom;
  editing: TimetableSlot | null;
  onSaved: () => void;
  onCancelEdit: () => void;
}) {
  const [day, setDay] = useState(String(editing?.day_of_week ?? 1));
  const [start, setStart] = useState(editing?.start_time ?? "18:00");
  const [end, setEnd] = useState(editing?.end_time ?? "19:30");
  const [room, setRoom] = useState(editing?.room ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end || end <= start) {
      toast.error("Дуусах цаг эхлэх цагаас хойш байх ёстой");
      return;
    }
    setSaving(true);
    try {
      const res = await calendarApi.upsertSlot({
        id: editing?.id,
        class_id: group.id,
        day_of_week: Number(day),
        start_time: start,
        end_time: end,
        room: room.trim() || undefined,
      });
      const { created, removed } = res.sessions;
      toast.success(
        editing
          ? `Хуваарь шинэчлэгдлээ · ${created} хичээл шинэчлэгдсэн`
          : `Нэмэгдлээ · ${created} хичээл үүслээ`,
      );
      if (removed > 0 && !editing) toast.info(`${removed} хичээл хасагдсан`);
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err, "Хадгалж чадсангүй"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <p className="text-sm font-medium text-foreground">
        {editing ? "Хуваарийн мөр засах" : "Хичээллэх гараг, цаг нэмэх"}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Гараг</Label>
          <Select value={day} onValueChange={setDay} disabled={saving}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {WEEKDAY_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="slot-start" className="text-xs">
            Эхлэх
          </Label>
          <Input
            id="slot-start"
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            disabled={saving}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="slot-end" className="text-xs">
            Дуусах
          </Label>
          <Input
            id="slot-end"
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
            disabled={saving}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="slot-room" className="text-xs">
            Өрөө
          </Label>
          <Input
            id="slot-room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder={group.room ?? "Бүлгийн өрөө"}
            maxLength={60}
            disabled={saving}
            className="h-9"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {editing && (
          <Button type="button" variant="outline" size="sm" onClick={onCancelEdit} disabled={saving}>
            Болих
          </Button>
        )}
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Хадгалж байна..." : editing ? "Хадгалах" : "Нэмэх"}
        </Button>
      </div>
    </form>
  );
}

/* ══════════════════════════ Хичээлүүд ══════════════════════════ */

type Range = "upcoming" | "past";

/** Бүлгийн хичээлүүд: цуцлах, сэргээх, шилжүүлэх, нөхөх/нэмэлт хичээл */
export function GroupSessions({ group }: { group: ClassRoom }) {
  const [today] = useState(todayLocal);
  const [range, setRange] = useState<Range>("upcoming");
  const [sessions, setSessions] = useState<ClassSession[] | null>(null);
  const [version, setVersion] = useState(0);
  const [cancelling, setCancelling] = useState<ClassSession | null>(null);
  const [dialog, setDialog] = useState<
    | { mode: "extra" }
    | { mode: "makeup"; session: ClassSession }
    | { mode: "reschedule"; session: ClassSession }
    | null
  >(null);

  const from = range === "upcoming" ? today : addDaysLocal(today, -42);
  const to = range === "upcoming" ? addDaysLocal(today, 42) : addDaysLocal(today, -1);

  useEffect(() => {
    let cancelled = false;
    sessionsApi
      .list({ class_id: group.id, from, to })
      .then((list) => {
        if (!cancelled) setSessions(range === "past" ? [...list].reverse() : list);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [group.id, from, to, range, version]);

  const refresh = () => setVersion((v) => v + 1);
  const canEdit = group.status === "active" || group.status === "planned";

  async function act(fn: () => Promise<unknown>, success: string) {
    try {
      await fn();
      toast.success(success);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Амжилтгүй"));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {(["upcoming", "past"] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => {
                setRange(r);
                setSessions(null);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent",
              )}
            >
              {r === "upcoming" ? "Ирэх 6 долоо хоног" : "Өнгөрсөн 6 долоо хоног"}
            </button>
          ))}
        </div>
        {canEdit && (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1"
              title="Хуваарьтай дахин тааруулах"
              onClick={() =>
                act(async () => {
                  const r = await sessionsApi.sync(group.id);
                  if (r.created + r.removed === 0) toast.info("Хичээлүүд хуваарьтай нийцэж байна");
                }, "Шалгалаа")
              }
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDialog({ mode: "extra" })}>
              <CalendarPlus className="h-3.5 w-3.5" />
              Нэмэлт хичээл
            </Button>
          </div>
        )}
      </div>

      {!sessions ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
      ) : sessions.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {range === "upcoming"
            ? "Ирэх хичээл алга — «Хуваарь» табаас хичээллэх гараг, цагаа тохируулна уу."
            : "Өнгөрсөн хичээл алга"}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {sessions.map((s) => (
            <li
              key={s.id}
              className={cn("flex items-center gap-3 rounded-lg border p-2.5", s.status === "cancelled" && "bg-muted/40")}
            >
              <div className="w-14 shrink-0 text-center">
                <p className="text-xs text-muted-foreground">{WEEKDAY_SHORT[isoWeekdayOf(s.date)]}</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">{s.date.slice(5).replace("-", ".")}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 text-sm">
                  <span className={cn("font-medium tabular-nums text-foreground", s.status === "cancelled" && "line-through")}>
                    {formatTimeRange(s.start_time, s.end_time)}
                  </span>
                  <SessionStatusPill status={s.status} />
                  <SessionKindPill kind={s.kind} />
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {[
                    s.room,
                    s.teacher && s.teacher.id !== group.teacher_id
                      ? `Орлон: ${s.teacher.last_name} ${s.teacher.first_name}`
                      : null,
                    s.topic,
                    s.status === "cancelled" ? s.cancel_reason : null,
                    s.attendance && s.attendance.total > 0
                      ? `${s.attendance.present + s.attendance.late}/${s.attendance.total} ирсэн`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {canEdit && s.status !== "held" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" title="Үйлдэл">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {s.status === "scheduled" && (
                      <>
                        <DropdownMenuItem onClick={() => setDialog({ mode: "reschedule", session: s })}>
                          <Clock className="mr-2 h-4 w-4" /> Өөр өдөр шилжүүлэх
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setCancelling(s)}>
                          <XCircle className="mr-2 h-4 w-4" /> Цуцлах
                        </DropdownMenuItem>
                      </>
                    )}
                    {s.status === "cancelled" && (
                      <>
                        <DropdownMenuItem onClick={() => setDialog({ mode: "makeup", session: s })}>
                          <Undo2 className="mr-2 h-4 w-4" /> Нөхөх хичээл товлох
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => act(() => sessionsApi.restore(s.id), "Хичээл сэргээгдлээ")}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" /> Цуцлалтыг буцаах
                        </DropdownMenuItem>
                      </>
                    )}
                    {s.kind !== "regular" && s.status !== "cancelled" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => act(() => sessionsApi.remove(s.id), "Хичээл устгагдлаа")}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Устгах
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          ))}
        </ul>
      )}

      <ReasonDialog
        open={!!cancelling}
        onOpenChange={(v) => !v && setCancelling(null)}
        title="Хичээл цуцлах"
        description={
          cancelling
            ? `${formatDate(cancelling.date)} ${cancelling.start_time}. Бүлгийн сурагч, эцэг эхэд мэдэгдэл очно.`
            : ""
        }
        confirmLabel="Цуцлах"
        onConfirm={async (reason) => {
          if (!cancelling) return;
          await sessionsApi.cancel(cancelling.id, reason);
          toast.success("Хичээл цуцлагдлаа");
          refresh();
        }}
      />
      <SessionDialog
        key={dialog ? `${dialog.mode}-${"session" in dialog ? dialog.session.id : "new"}` : "closed"}
        group={group}
        state={dialog}
        onOpenChange={(v) => !v && setDialog(null)}
        onSaved={refresh}
      />
    </div>
  );
}

/** Нэмэлт / нөхөх хичээл товлох, эсвэл шилжүүлэх */
function SessionDialog({
  group,
  state,
  onOpenChange,
  onSaved,
}: {
  group: ClassRoom;
  state:
    | { mode: "extra" }
    | { mode: "makeup"; session: ClassSession }
    | { mode: "reschedule"; session: ClassSession }
    | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const source = state && "session" in state ? state.session : null;
  const [date, setDate] = useState(() =>
    source ? addDaysLocal(source.date < todayLocal() ? todayLocal() : source.date, 1) : todayLocal(),
  );
  const [start, setStart] = useState(source?.start_time ?? "18:00");
  const [end, setEnd] = useState(source?.end_time ?? "19:30");
  const [room, setRoom] = useState(source?.room ?? group.room ?? "");
  const [topic, setTopic] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  if (!state) return <Dialog open={false} onOpenChange={onOpenChange} />;

  const title =
    state.mode === "reschedule"
      ? "Хичээлийг өөр өдөр шилжүүлэх"
      : state.mode === "makeup"
        ? "Нөхөх хичээл товлох"
        : "Нэмэлт хичээл товлох";
  const description =
    state.mode === "reschedule"
      ? `${formatDate(state.session.date)} ${state.session.start_time} хичээл цуцлагдаж, сонгосон өдөр нөхөх хичээл үүснэ.`
      : state.mode === "makeup"
        ? `${formatDate(state.session.date)} ${state.session.start_time}-ийн цуцлагдсан хичээлийг нөхнө.`
        : "Хуваарьт ороогүй нэг удаагийн хичээл (давталт, шалгалт г.м).";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!state) return;
    if (end <= start) {
      toast.error("Дуусах цаг эхлэх цагаас хойш байх ёстой");
      return;
    }
    setSaving(true);
    try {
      if (state.mode === "reschedule") {
        await sessionsApi.reschedule(state.session.id, {
          date,
          start_time: start,
          end_time: end,
          room: room.trim() || undefined,
          reason: reason.trim() || undefined,
        });
        toast.success("Хичээл шилжлээ — сурагч, эцэг эхэд мэдэгдэл очлоо");
      } else {
        await sessionsApi.create({
          class_id: group.id,
          date,
          start_time: start,
          end_time: end,
          room: room.trim() || undefined,
          topic: topic.trim() || undefined,
          makeup_for_id: state.mode === "makeup" ? state.session.id : undefined,
        });
        toast.success(state.mode === "makeup" ? "Нөхөх хичээл товлогдлоо" : "Нэмэлт хичээл товлогдлоо");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Хадгалж чадсангүй"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3 space-y-1 sm:col-span-1">
              <Label htmlFor="sd-date" className="text-xs">Огноо</Label>
              <Input id="sd-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required disabled={saving} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sd-start" className="text-xs">Эхлэх</Label>
              <Input id="sd-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} required disabled={saving} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sd-end" className="text-xs">Дуусах</Label>
              <Input id="sd-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} required disabled={saving} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sd-room" className="text-xs">Өрөө</Label>
            <Input id="sd-room" value={room} onChange={(e) => setRoom(e.target.value)} maxLength={60} disabled={saving} />
          </div>
          {state.mode === "reschedule" ? (
            <div className="space-y-1">
              <Label htmlFor="sd-reason" className="text-xs">Шалтгаан (заавал биш)</Label>
              <Input id="sd-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} disabled={saving} />
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="sd-topic" className="text-xs">Сэдэв (заавал биш)</Label>
              <Input id="sd-topic" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={200} disabled={saving} />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Болих
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
