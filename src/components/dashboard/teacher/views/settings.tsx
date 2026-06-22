"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "../../../../lib/use-user";

export function TeacherSettings() {
  const user = useUser();
  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Профайл</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {user.first_name[0]}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline">Зураг солих</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Нэр</Label>
              <Input defaultValue={user.first_name} className="mt-1" />
            </div>
            <div>
              <Label>Овог</Label>
              <Input defaultValue={user.last_name} className="mt-1" />
            </div>
            <div>
              <Label>Имэйл</Label>
              <Input defaultValue={user.email} className="mt-1" disabled />
            </div>
            <div>
              <Label>Утас</Label>
              <Input defaultValue={user.phone ?? ""} className="mt-1" />
            </div>
          </div>
          <Button className="bg-accent hover:bg-accent/90">Хадгалах</Button>
        </CardContent>
      </Card>
    </div>
  );
}