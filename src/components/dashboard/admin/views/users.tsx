"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { api, type User } from "@/lib/api";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Супер Админ",
  admin: "Сургуулийн Админ",
  teacher: "Багш",
  parent: "Эцэг эх",
  student: "Сурагч",
};

const ROLE_COLOR: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  teacher: "bg-[#1B2B4B]/10 text-[#1B2B4B]",
  parent: "bg-green-100 text-green-700",
  student: "bg-amber-100 text-amber-700",
};

const ROLE_FILTERS = [
  { key: "all", label: "Бүгд" },
  { key: "teacher", label: "Багш" },
  { key: "parent", label: "Эцэг эх" },
  { key: "student", label: "Сурагч" },
  { key: "admin", label: "Админ" },
];

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    api
      .get<User[]>("/users")
      .then(setUsers)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      search === "" ||
      `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B4B]">Хэрэглэгчид</h1>
        <p className="text-sm text-gray-500 mt-0.5">Нийт {users.length} хэрэглэгч</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Хэрэглэгч хайх..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                roleFilter === f.key
                  ? "bg-[#1B2B4B] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users list */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Users className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-400">Хэрэглэгч олдсонгүй</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B2B4B] text-white text-sm font-bold">
                    {u.first_name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1B2B4B]">
                      {u.first_name} {u.last_name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                  </div>
                  <Badge
                    className={`text-xs shrink-0 ${ROLE_COLOR[u.role] ?? "bg-gray-100 text-gray-600"}`}
                    variant="secondary"
                  >
                    {ROLE_LABEL[u.role] ?? u.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
