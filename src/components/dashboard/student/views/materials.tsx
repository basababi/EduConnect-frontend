"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import {
  studentsApi,
  materialsApi,
  downloadFile,
  type Material,
} from "@/lib/api";

function fmtSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function StudentMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const me = await studentsApi.me().catch(() => null);
      if (me?.class_id) {
        const mats = await materialsApi
          .listForClass(me.class_id)
          .catch(() => [] as Material[]);
        setMaterials(mats);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Хичээлээр бүлэглэх
  const bySubject = materials.reduce<Record<string, Material[]>>((acc, m) => {
    (acc[m.subject] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="animate-in-rise space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Хичээлийн материал</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Багшийн оруулсан файл, лекцийн материал
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
            <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Материал хараахан алга</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(bySubject).map(([subject, items]) => (
            <div key={subject}>
              <h2 className="mb-2 text-sm font-semibold text-primary">{subject}</h2>
              <div className="space-y-2">
                {items.map((m) => (
                  <Card key={m.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber/10">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{m.title}</p>
                        {m.description && (
                          <p className="text-xs text-muted-foreground">{m.description}</p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground/70">
                          {m.file_name ?? "Файл"} · {fmtSize(m.file_size)}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          downloadFile(m.file_id, m.file_name ?? undefined).catch((e) =>
                            toast.error(e instanceof Error ? e.message : "Татаж чадсангүй"),
                          )
                        }
                        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Татах
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
