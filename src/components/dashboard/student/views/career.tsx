"use client";

import { useState } from "react";
import {
  Briefcase, GraduationCap, Globe, TrendingUp, Sparkles, Loader2,
  Target, Wallet, CalendarRange, Plus, X, CheckCircle2, ChevronDown, School,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeCareerLocal, type CareerAnalysisResult } from "@/lib/mock-assistant";

const MBTI_TYPES = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
const SUBJECTS = ["Математик", "Монгол хэл", "Англи хэл", "Физик", "Хими", "Биологи", "Түүх", "Газарзүй", "Мэдээллийн технологи"];
const INTEREST_OPTIONS = ["Програмчлал", "Дизайн", "Бизнес", "Анагаах ухаан", "Урлаг", "Спорт", "Хэл шинжлэл", "Инженерчлэл", "Байгаль орчин", "Сэтгүүл зүй"];

type Grade = { subject: string; score: number };

export function StudentCareer() {
  const [name, setName] = useState("Оюун");
  const [grade, setGrade] = useState(10);
  const [mbti, setMbti] = useState("INTJ");
  const [grades, setGrades] = useState<Grade[]>([
    { subject: "Математик", score: 72 },
    { subject: "Физик", score: 65 },
    { subject: "Англи хэл", score: 85 },
  ]);
  const [interests, setInterests] = useState<string[]>(["Програмчлал", "Инженерчлэл"]);
  const [attendance, setAttendance] = useState<string[]>(["Математик", "Физик"]);

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CareerAnalysisResult | null>(null);
  const [selectedUni, setSelectedUni] = useState<string | null>(null);

  function toggleInterest(i: string) {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }
  function updateGrade(idx: number, patch: Partial<Grade>) {
    setGrades((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }
  function addGrade() {
    const used = grades.map((g) => g.subject);
    const next = SUBJECTS.find((s) => !used.includes(s)) ?? SUBJECTS[0];
    setGrades((prev) => [...prev, { subject: next, score: 70 }]);
  }
  function removeGrade(idx: number) {
    setGrades((prev) => prev.filter((_, i) => i !== idx));
  }

  function analyze() {
    setLoading(true);
    setAnalysis(null);
    setSelectedUni(null);
    setTimeout(() => {
      const result = analyzeCareerLocal({ grades, mbti, interests });
      setAnalysis(result);
      setLoading(false);
    }, 1500);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Briefcase className="size-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-balance">AI Карьер Зөвлөгөө</h2>
          <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
            Дүн, зан төлөв, сонирхолд тулгуурлан тохирох мэргэжил, сургууль, гадаадад суралцах замыг AI таамаглаж зөвлөнө.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* Input form */}
        <section className="rounded-2xl border border-border bg-card p-5 h-fit sticky top-4">
          <div className="mb-4 flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Оролтын мэдээлэл</h3>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Нэр</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Анги</span>
                <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {[9, 10, 11, 12].map((g) => (<option key={g} value={g}>{g}-р анги</option>))}
                </select>
              </label>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Хичээлийн дүн</span>
                <button onClick={addGrade} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-accent">
                  <Plus className="size-3.5" /> Нэмэх
                </button>
              </div>
              <div className="space-y-2">
                {grades.map((g, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select value={g.subject} onChange={(e) => updateGrade(idx, { subject: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                      {SUBJECTS.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                    <div className="flex items-center gap-1.5">
                      <input type="number" min={0} max={100} value={g.score} onChange={(e) => updateGrade(idx, { score: Number(e.target.value) })} className="w-16 rounded-lg border border-input bg-background px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <button onClick={() => removeGrade(idx)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-2 block text-xs font-medium text-muted-foreground">Зан төлөв (MBTI)</span>
              <div className="grid grid-cols-4 gap-2">
                {MBTI_TYPES.map((t) => (
                  <button key={t} onClick={() => setMbti(t)} className={`rounded-md border py-1.5 text-xs font-medium transition-colors ${mbti === t ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-2 block text-xs font-medium text-muted-foreground">Сонирхол</span>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((i) => (
                  <button key={i} onClick={() => toggleInterest(i)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${interests.includes(i) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={analyze} disabled={loading || grades.length === 0} className="w-full">
              {loading ? (<><Loader2 className="size-4 animate-spin mr-2" /> Шинжилж байна...</>) : (<><Sparkles className="size-4 mr-2" /> Карьер шинжилгээ хийх</>)}
            </Button>
          </div>
        </section>

        {/* Results */}
        <section className="min-w-0 space-y-5">
          {!analysis && !loading && (
            <div className="flex h-full min-h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <TrendingUp className="size-6" />
              </div>
              <p className="font-medium">AI карьерийн шинжилгээ</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
                Зүүн талын мэдээллээ бөглөөд шинжилгээ хийхэд таны давуу тал, тохирох мэргэжил, их сургууль, гадаадад суралцах зам энд харагдана.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex h-full min-h-96 flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-12 text-center">
              <Loader2 className="mb-3 size-7 animate-spin text-primary" />
              <p className="font-medium">Дата болон зан төлөвт дүн шинжилгээ хийж байна</p>
              <p className="mt-1 text-sm text-muted-foreground">Хэдхэн секунд хүлээнэ үү...</p>
            </div>
          )}

          {analysis && (
            <>
              {/* Summary */}
              <div className="rounded-2xl border border-border bg-gradient-to-br from-accent/60 to-card p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold">Дүгнэлт</h3>
                </div>
                <p className="text-sm leading-relaxed text-pretty">{analysis.summary}</p>
              </div>

              {/* Strengths */}
              <Block icon={<Target className="size-4" />} title="Давуу тал">
                <div className="flex flex-wrap gap-2">
                  {analysis.strengths.map((s) => (
                    <div key={s.subject} className="rounded-lg border border-border bg-secondary px-3 py-2">
                      <p className="text-sm font-medium">{s.subject}</p>
                      <p className="text-xs text-muted-foreground">{s.note}</p>
                    </div>
                  ))}
                </div>
              </Block>

              {/* Careers */}
              <Block icon={<Briefcase className="size-4" />} title="Тохирох мэргэжил">
                <div className="space-y-3">
                  {analysis.careers.map((c) => (
                    <div key={c.title} className="rounded-xl border border-border bg-card p-4">
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <p className="font-medium">{c.title}</p>
                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {c.matchPercent}% тохирол
                        </span>
                      </div>
                      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${c.matchPercent}%` }} />
                      </div>
                      <p className="text-sm text-muted-foreground text-pretty">{c.reason}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="size-3.5 text-green-600" /> Эрэлт: <strong className="text-foreground">{c.demand}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Wallet className="size-3.5 text-amber-600" /> Цалин: <strong className="text-foreground">{c.salaryRange}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Block>

              {/* Universities Interactive */}
              <Block icon={<GraduationCap className="size-4" />} title="Монголын их дээд сургууль (Дарж дэлгэрэнгүй үзэх)">
                <div className="space-y-3">
                  {analysis.universities.map((u) => (
                    <div key={u.name} className="rounded-xl border border-border bg-card overflow-hidden">
                      <button 
                        onClick={() => setSelectedUni(selectedUni === u.name ? null : u.name)}
                        className="w-full p-4 flex items-center justify-between gap-2 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 text-left">
                          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
                            <School className="size-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.requiredGpa}</p>
                          </div>
                        </div>
                        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${selectedUni === u.name ? 'rotate-180' : ''}`} />
                      </button>

                      {selectedUni === u.name && (
                        <div className="border-t border-border p-4 space-y-3 bg-background">
                          <p className="text-xs font-medium text-muted-foreground">Салбаруудын нарийвчилсан шинжилгээ:</p>
                          {u.departments.map((dept, idx) => (
                            <div key={idx} className="rounded-lg border border-border p-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="font-medium text-sm">{dept.name}</p>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${dept.matchPercent >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                  Тохирол: {dept.matchPercent}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <span className="px-2 py-0.5 bg-secondary rounded">Шаардлагатай оноо: {dept.requiredScore}%</span>
                              </div>
                              <div className="flex items-start gap-1.5 text-xs text-foreground bg-primary/5 p-2 rounded">
                                <Target className="size-3 mt-0.5 text-primary shrink-0" />
                                <span>{dept.advice}</span>
                              </div>
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground pt-2 border-t border-dashed">{u.examInfo}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Block>

              {/* Study abroad */}
              <Block icon={<Globe className="size-4" />} title="Гадаадад суралцах">
                <div className="space-y-3">
                  {analysis.studyAbroad.map((a) => (
                    <div key={a.country} className="rounded-xl border border-border bg-card p-4">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{a.country}</p>
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">{a.language}</span>
                      </div>
                      <p className="text-sm text-muted-foreground text-pretty">
                        <strong className="text-foreground">Тэтгэлэг:</strong> {a.scholarship}
                      </p>
                      <ol className="mt-2.5 space-y-1.5">
                        {a.steps.map((step, i) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{i + 1}</span>
                            <span className="text-muted-foreground text-pretty">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </Block>

              {/* Plan */}
              <Block icon={<CalendarRange className="size-4" />} title="Хувийн хөгжлийн төлөвлөгөө">
                <ol className="relative space-y-4 border-l border-border pl-5">
                  {analysis.plan.map((p) => (
                    <li key={p.year} className="relative">
                      <span className="absolute -left-[26px] flex size-4 items-center justify-center rounded-full bg-amber-500 ring-4 ring-card">
                        <CheckCircle2 className="size-3 text-white" />
                      </span>
                      <p className="text-sm font-semibold text-primary">{p.year}</p>
                      <p className="text-sm text-muted-foreground text-pretty">{p.goal}</p>
                    </li>
                  ))}
                </ol>
              </Block>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2 text-primary">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}