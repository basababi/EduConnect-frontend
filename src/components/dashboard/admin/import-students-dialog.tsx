"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { studentsApi, type ClassRoom } from "@/lib/api";

interface ParsedRow {
  first_name?: string;
  last_name?: string;
  student_code?: string;
  date_of_birth?: string;
  class_name?: string;
  email?: string;
  password?: string;
}

// Excel баганы нэрийг (монгол/англи) дотоод талбартай харгалзуулна
const COLUMN_MAP: Record<string, keyof ParsedRow> = {
  овог: "last_name",
  "last name": "last_name",
  lastname: "last_name",
  нэр: "first_name",
  "first name": "first_name",
  firstname: "first_name",
  код: "student_code",
  "сурагчийн код": "student_code",
  code: "student_code",
  "student code": "student_code",
  анги: "class_name",
  class: "class_name",
  "төрсөн огноо": "date_of_birth",
  "төрсөн өдөр": "date_of_birth",
  dob: "date_of_birth",
  "date of birth": "date_of_birth",
  имэйл: "email",
  "и-мэйл": "email",
  email: "email",
  "нэвтрэх имэйл": "email",
  "нууц үг": "password",
  нууцүг: "password",
  password: "password",
};

function normalizeDate(v: unknown): string | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v.toISOString().split("T")[0];
  const s = String(v).trim();
  // YYYY-MM-DD эсвэл YYYY/MM/DD
  const m = s.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  }
  return undefined;
}

export function ImportStudentsDialog({
  open,
  onOpenChange,
  classes,
  onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes: ClassRoom[];
  onImported: () => void;
}) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [defaultClassId, setDefaultClassId] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    withLogin?: number;
    failed: number;
    errors: Array<{ row: number; reason: string }>;
  } | null>(null);

  function reset() {
    setRows([]);
    setFileName("");
    setDefaultClassId("");
    setResult(null);
  }

  function handleFile(file: File) {
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: "",
        });

        const parsed: ParsedRow[] = raw.map((r) => {
          const row: ParsedRow = {};
          for (const [key, val] of Object.entries(r)) {
            const mapped = COLUMN_MAP[key.toLowerCase().trim()];
            if (mapped) {
              if (mapped === "date_of_birth") {
                row.date_of_birth = normalizeDate(val);
              } else {
                row[mapped] = String(val).trim() || undefined;
              }
            }
          }
          return row;
        });

        const valid = parsed.filter(
          (r) => r.first_name || r.last_name || r.student_code,
        );
        setRows(valid);
        setFileName(file.name);
        if (valid.length === 0) {
          toast.error("Багана таарсангүй. Овог/Нэр/Код баганатай эсэхийг шалгана уу.");
        } else {
          toast.success(`${valid.length} мөр уншлаа`);
        }
      } catch {
        toast.error("Файл уншиж чадсангүй");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // Анги нэрийг id болгож хөрвүүлнэ (мөр дотор анги байхгүй бол default)
  function resolveClassId(name?: string): number | undefined {
    if (name) {
      const found = classes.find(
        (c) => c.name.toLowerCase() === name.toLowerCase().trim(),
      );
      if (found) return found.id;
    }
    return defaultClassId ? Number(defaultClassId) : undefined;
  }

  async function handleImport() {
    setImporting(true);
    try {
      const payload = rows.map((r) => ({
        first_name: r.first_name,
        last_name: r.last_name,
        student_code: r.student_code,
        date_of_birth: r.date_of_birth,
        class_id: resolveClassId(r.class_name),
        email: r.email,
        password: r.password,
      }));
      const res = await studentsApi.bulkCreate(payload);
      setResult(res);
      onImported();
      if (res.created > 0) toast.success(`${res.created} сурагч импортлогдлоо`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Импорт амжилтгүй");
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Овог", "Нэр", "Сурагчийн код", "Анги", "Төрсөн огноо", "Имэйл", "Нууц үг"],
      [
        "Бат",
        "Болд",
        "STU-2025-001",
        classes[0]?.name ?? "10А",
        "2009-05-15",
        "bat.bold@school.mn",
        "nuuts123",
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Сурагчид");
    XLSX.writeFile(wb, "сурагч-загвар.xlsx");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Сурагч Excel-ээс импортлох</DialogTitle>
          <DialogDescription>
            Багана: Овог, Нэр, Сурагчийн код, Анги, Төрсөн огноо. Нэмж{" "}
            <b>Имэйл + Нууц үг</b> өгвөл сурагчид нэвтрэх данс үүснэ.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">
                  {result.created} сурагч амжилттай импортлогдлоо
                </p>
                {result.withLogin ? (
                  <p className="text-sm text-green-700">
                    {result.withLogin} сурагчид нэвтрэх данс үүслээ
                  </p>
                ) : null}
                {result.failed > 0 && (
                  <p className="text-sm text-amber-700">
                    {result.failed} мөр алгасагдсан
                  </p>
                )}
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                {result.errors.map((e, i) => (
                  <p key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Мөр {e.row}: {e.reason}
                  </p>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Хаах</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="xls-file"
                className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {fileName || "Excel файл сонгох (.xlsx, .csv)"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rows.length > 0 ? `${rows.length} мөр уншсан` : "Файлаа чирж тавьж болно"}
                  </p>
                </div>
              </label>
              <input
                id="xls-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>

            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              Загвар Excel татах
            </button>

            {classes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">
                  Default анги (мөрөнд анги байхгүй бол)
                </Label>
                <Select value={defaultClassId} onValueChange={setDefaultClassId}>
                  <SelectTrigger className="w-48">
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
              </div>
            )}

            {rows.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr className="text-left text-muted-foreground">
                      <th className="p-2">Овог</th>
                      <th className="p-2">Нэр</th>
                      <th className="p-2">Код</th>
                      <th className="p-2">Анги</th>
                      <th className="p-2">Төрсөн</th>
                      <th className="p-2">Нэвтрэх</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{r.last_name ?? "—"}</td>
                        <td className="p-2">{r.first_name ?? "—"}</td>
                        <td className="p-2">{r.student_code ?? "—"}</td>
                        <td className="p-2">
                          {r.class_name ??
                            classes.find((c) => String(c.id) === defaultClassId)?.name ??
                            "—"}
                        </td>
                        <td className="p-2">{r.date_of_birth ?? "—"}</td>
                        <td className="p-2">
                          {r.email ? (
                            <span className="text-emerald-600">{r.email}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 50 && (
                  <p className="p-2 text-center text-xs text-muted-foreground">
                    …болон бусад {rows.length - 50} мөр
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Болих
              </Button>
              <Button
                variant="amber"
                className="gap-2"
                onClick={handleImport}
                disabled={importing || rows.length === 0}
              >
                <Upload className="h-4 w-4" />
                {importing ? "Импортлож байна..." : `${rows.length} сурагч импортлох`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
