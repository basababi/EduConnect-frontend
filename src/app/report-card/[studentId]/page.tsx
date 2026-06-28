"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { GraduationCap, Printer, ArrowLeft } from "lucide-react";
import { gradesApi, type ReportCard } from "@/lib/api";

function gradeColor(p: number) {
  if (p >= 80) return "#10B981";
  if (p >= 60) return "#F5A623";
  return "#EF4444";
}

function letterGrade(p: number): string {
  if (p >= 90) return "A";
  if (p >= 80) return "B";
  if (p >= 70) return "C";
  if (p >= 60) return "D";
  return "F";
}

function ReportCardInner() {
  const params = useParams<{ studentId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const termId = search.get("term");
  const [data, setData] = useState<ReportCard | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    gradesApi
      .reportCard(Number(params.studentId), termId ? Number(termId) : undefined)
      .then(setData)
      .catch(() => setError(true));
  }, [params.studentId, termId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Дүнгийн хуудас ачаалж чадсангүй.</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="animate-pulse text-sm text-gray-400">Ачаалж байна...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      {/* Toolbar — хэвлэхэд харагдахгүй */}
      <div className="mx-auto mb-4 flex max-w-[820px] items-center justify-between px-4 print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-[#1B2B4B] px-4 py-2 text-sm font-medium text-white hover:bg-[#1B2B4B]/90"
        >
          <Printer className="h-4 w-4" />
          Хэвлэх / PDF татах
        </button>
      </div>

      {/* A4 хуудас */}
      <div className="mx-auto max-w-[820px] bg-white p-10 shadow-lg print:max-w-none print:shadow-none">
        {/* Толгой */}
        <div className="flex items-center justify-between border-b-2 border-[#1B2B4B] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B2B4B] text-white">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1B2B4B]">{data.school.name}</h1>
              <p className="text-sm text-gray-500">Дүнгийн хуудас</p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            {data.term && (
              <p className="text-sm font-semibold text-[#1B2B4B]">
                {data.term.name} · {data.term.academic_year}-{data.term.academic_year + 1}
              </p>
            )}
            <p>Хэвлэсэн: {new Date(data.generated_at).toLocaleDateString("mn-MN")}</p>
          </div>
        </div>

        {/* Сурагчийн мэдээлэл */}
        <div className="mt-5 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">Сурагч</p>
            <p className="font-semibold text-gray-900">{data.student.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Анги</p>
            <p className="font-semibold text-gray-900">
              {data.student.class_name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Сурагчийн код</p>
            <p className="font-semibold text-gray-900">
              {data.student.student_code ?? "—"}
            </p>
          </div>
        </div>

        {/* Дүнгийн хүснэгт */}
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 text-left text-gray-500">
              <th className="py-2">#</th>
              <th className="py-2">Хичээл</th>
              <th className="py-2 text-center">Дүнгийн тоо</th>
              <th className="py-2 text-right">Дундаж</th>
              <th className="py-2 text-right">Жигнэсэн дүн</th>
              <th className="py-2 text-center">Үнэлгээ</th>
            </tr>
          </thead>
          <tbody>
            {data.subjects.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  Энэ улиралд дүн бүртгэгдээгүй байна
                </td>
              </tr>
            ) : (
              data.subjects.map((s, i) => (
                <tr key={s.subject} className="border-b border-gray-100">
                  <td className="py-2.5 text-gray-400">{i + 1}</td>
                  <td className="py-2.5 font-medium text-gray-900">{s.subject}</td>
                  <td className="py-2.5 text-center text-gray-500">{s.count}</td>
                  <td className="py-2.5 text-right font-mono text-gray-600">
                    {Math.round(s.average_percentage)}%
                  </td>
                  <td
                    className="py-2.5 text-right font-mono font-bold"
                    style={{ color: gradeColor(s.weighted_final) }}
                  >
                    {s.weighted_final}%
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: gradeColor(s.weighted_final) }}
                    >
                      {letterGrade(s.weighted_final)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Нийт дүн */}
        <div className="mt-6 flex items-center justify-between rounded-lg bg-[#1B2B4B] p-5 text-white">
          <div>
            <p className="text-xs text-white/60">Нийт жигнэсэн дүн</p>
            <p className="text-sm text-white/80">{data.total_grades} дүн дээр үндэслэв</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black">{data.overall_weighted}%</span>
            <span className="ml-2 text-lg font-bold text-[#F5A623]">
              {letterGrade(data.overall_weighted)}
            </span>
          </div>
        </div>

        {/* Гарын үсэг */}
        <div className="mt-12 grid grid-cols-2 gap-8 text-sm">
          <div>
            <div className="border-t border-gray-300 pt-1 text-center text-xs text-gray-500">
              Анги даасан багш
            </div>
          </div>
          <div>
            <div className="border-t border-gray-300 pt-1 text-center text-xs text-gray-500">
              Сургалтын менежер
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-gray-400">
          Энэхүү хуудсыг EduConnect системээс автоматаар гаргав.
        </p>
      </div>
    </div>
  );
}

export default function ReportCardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
          <p className="animate-pulse text-sm text-gray-400">Ачаалж байна...</p>
        </div>
      }
    >
      <ReportCardInner />
    </Suspense>
  );
}
