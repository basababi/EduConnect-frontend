"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const DAYS = ["Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан"];
const PERIODS = [
  { time: "08:00-08:45", subject: "Математик", grade: "9А", room: "201" },
  { time: "09:00-09:45", subject: "Математик", grade: "8Б", room: "105" },
  { time: "10:00-10:45", subject: "Алгебр", grade: "10А", room: "301" },
  { time: "11:00-11:45", subject: "Математик", grade: "7Б", room: "202" },
  { time: "12:00-12:45", subject: "Геометр", grade: "9Б", room: "201" },
];

export function TeacherSchedule() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        {DAYS.map((day, i) => (
          <Card key={day}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                {day}
                {i === 0 && <Badge className="bg-accent">Өнөөдөр</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {PERIODS.map((p, j) => (
                <div key={j} className="rounded-lg border p-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Clock className="h-3 w-3" />
                    {p.time}
                  </div>
                  <p className="text-sm font-medium">{p.subject}</p>
                  <p className="text-xs text-muted-foreground">{p.grade} • {p.room}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}