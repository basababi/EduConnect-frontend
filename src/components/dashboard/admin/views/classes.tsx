"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Users } from "lucide-react";
import { api, type ClassRoom, type Student } from "@/lib/api";

export function AdminClasses() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.allSettled([
      api.get<ClassRoom[]>("/classes"),
      api.get<Student[]>("/students"),
    ]).then(([cls, sts]) => {
      if (cls.status === "fulfilled") setClasses(cls.value);
      if (sts.status === "fulfilled") setStudents(sts.value);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = classes.filter(
    (c) =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.grade_level.toLowerCase().includes(search.toLowerCase())
  );

  function studentCount(classId: number) {
    return students.filter((s) => s.class_id === classId).length;
  }

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B4B]">Ангиуд</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Нийт {classes.length} анги · {classes.filter((c) => c.is_active).length} идэвхтэй
        </p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Анги хайх..."
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <BookOpen className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-400">Анги олдсонгүй</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((c) => {
                const count = studentCount(c.id);
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1B2B4B]/10">
                      <BookOpen className="h-5 w-5 text-[#1B2B4B]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1B2B4B]">{c.name}</p>
                      <p className="text-xs text-gray-500">
                        {c.grade_level}-р анги · {c.academic_year} оны хичээлийн жил
                      </p>
                      {c.teacher && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Багш: {c.teacher.first_name} {c.teacher.last_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-lg px-2 py-1">
                        <Users className="h-3 w-3" />
                        {count}
                      </div>
                      <Badge
                        className={`text-xs ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        variant="secondary"
                      >
                        {c.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
