"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, Phone, Search, Users } from "lucide-react";
import {
  classesApi,
  studentsApi,
  studentDisplayName,
  type ClassRoom,
  type Student,
} from "@/lib/api";

/**
 * Багшийн сурагчид — өөрийн бүлгийн жагсаалт, холбоо барих мэдээлэл (зөвхөн харах).
 * Сурагч бүртгэх, элсүүлэх, гаргах нь төлбөртэй холбоотой тул төвийн админ хийнэ.
 */
export function TeacherStudents() {
  const [groups, setGroups] = useState<ClassRoom[]>([]);
  const [groupId, setGroupId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    classesApi
      .list()
      .then((g) => {
        setGroups(g);
        if (g.length) setGroupId(String(g[0].id));
      })
      .catch(() => setGroups([]))
      .finally(() => setLoadingGroups(false));
  }, []);

  const loadStudents = useCallback(() => {
    if (!groupId) return;
    setLoadingStudents(true);
    studentsApi
      .list(Number(groupId))
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [groupId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const q = search.trim().toLowerCase();
  const filtered = students.filter(
    (s) => !q || `${studentDisplayName(s)} ${s.student_code ?? ""}`.toLowerCase().includes(q),
  );

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Сурагчид</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Бүлгийн сурагчид, холбоо барих мэдээлэл
          </p>
        </div>
        {!loadingGroups && groups.length > 0 && (
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger className="w-64 max-w-full">
              <SelectValue placeholder="Бүлэг" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {loadingGroups ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Танд хариуцсан бүлэг алга</p>
            <p className="text-xs text-muted-foreground/70">
              Төвийн админ танд бүлэг хуваарилна
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Сурагч хайх..."
              className="pl-9"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingStudents ? (
                <div className="space-y-2 p-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-14">
                  <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {students.length === 0 ? "Энэ бүлэгт сурагч элсээгүй байна" : "Сурагч олдсонгүй"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filtered.map((s) => {
                    const name = studentDisplayName(s);
                    const paused = s.groups.some(
                      (g) => String(g.class_id) === groupId && g.status === "paused",
                    );
                    return (
                      <div key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                          {name[0] ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1 basis-40">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {name}
                            {paused && (
                              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                Түр чөлөөтэй
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{s.student_code ?? "—"}</p>
                        </div>
                        <div className="space-y-0.5 text-xs text-muted-foreground">
                          {s.phone && (
                            <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 hover:text-primary">
                              <Phone className="h-3 w-3" />
                              {s.phone}
                            </a>
                          )}
                          {s.guardian_phone && (
                            <a href={`tel:${s.guardian_phone}`} className="flex items-center gap-1.5 hover:text-primary">
                              <Phone className="h-3 w-3" />
                              {s.guardian_phone}
                              {s.guardian_name ? ` (${s.guardian_name})` : " (асран хамгаалагч)"}
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
