"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  FileText,
  Award,
  Activity,
  Download,
  FileSpreadsheet,
  Send,
  Sparkles,
  Brain,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

// ===== Mock өгөгдөл =====
const SEMESTERS = ["2026 оны 2-р улирал", "2026 оны 1-р улирал"];
const CLASSES = ["Бүх анги", "9А", "8Б", "10А", "7Б", "9Б"];

const METRICS = [
  {
    label: "Амжилттай гүйцэтгэл",
    value: "78.4%",
    change: 3.2,
    trend: "up" as const,
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  {
    label: "Нийт ирц",
    value: "91.2%",
    change: -1.1,
    trend: "down" as const,
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    label: "Даалгавар гүйцэтгэл",
    value: "68%",
    change: 5,
    trend: "up" as const,
    icon: FileText,
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
  {
    label: "Шалгалтын дундаж",
    value: "76.8",
    change: 2.1,
    trend: "up" as const,
    icon: Award,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  {
    label: "Сурагчдын оролцоо",
    value: "84%",
    change: 0,
    trend: "stable" as const,
    icon: Activity,
    color: "text-cyan-600",
    bg: "bg-cyan-100",
    subtitle: "107/128 сурагч",
  },
];

// Ирцийн чиг хандлага (12 долоо хоног)
const TREND_DATA = [
  { week: "1-р долоо хоног", "9А": 92, "8Б": 88, "10А": 85, "7Б": 90 },
  { week: "2-р долоо хоног", "9А": 94, "8Б": 86, "10А": 87, "7Б": 88 },
  { week: "3-р долоо хоног", "9А": 91, "8Б": 89, "10А": 83, "7Б": 92 },
  { week: "4-р долоо хоног", "9А": 95, "8Б": 87, "10А": 88, "7Б": 89 },
  { week: "5-р долоо хоног", "9А": 93, "8Б": 90, "10А": 86, "7Б": 91 },
  { week: "6-р долоо хоног", "9А": 96, "8Б": 88, "10А": 89, "7Б": 87 },
  { week: "7-р долоо хоног", "9А": 94, "8Б": 85, "10А": 91, "7Б": 90 },
  { week: "8-р долоо хоног", "9А": 97, "8Б": 89, "10А": 88, "7Б": 92 },
];

// Дүнгийн тархалт
const GRADE_DISTRIBUTION = [
  { grade: "A (90-100)", count: 45, color: "#10B981", percent: 35 },
  { grade: "B (75-89)", count: 58, color: "#1E3A8A", percent: 45 },
  { grade: "C (60-74)", count: 18, color: "#F59E0B", percent: 14 },
  { grade: "D (<60)", count: 7, color: "#EF4444", percent: 6 },
];

// Анги тус бүрийн харьцуулалт
const CLASS_COMPARISON = [
  { class: "9А", "Дундаж дүн": 87, "Ирц %": 94, "Даалгавар %": 78 },
  { class: "8Б", "Дундаж дүн": 82, "Ирц %": 88, "Даалгавар %": 65 },
  { class: "10А", "Дундаж дүн": 85, "Ирц %": 91, "Даалгавар %": 72 },
  { class: "7Б", "Дундаж дүн": 79, "Ирц %": 89, "Даалгавар %": 58 },
];

// Сурагчийн явцын scatter plot
const SCATTER_DATA = [
  { name: "Б. Батмөнх", attendance: 97, score: 90, risk: false },
  { name: "О. Оюунчимэг", attendance: 95, score: 88, risk: false },
  { name: "Д. Далгэрмаа", attendance: 62, score: 54, risk: true },
  { name: "Г. Ганзориг", attendance: 71, score: 58, risk: true },
  { name: "Н. Намуун", attendance: 68, score: 61, risk: true },
  { name: "Б. Болд", attendance: 65, score: 49, risk: true },
  { name: "С. Саран", attendance: 89, score: 82, risk: false },
  { name: "М. Мөнх", attendance: 92, score: 85, risk: false },
  { name: "Э. Энх", attendance: 84, score: 76, risk: false },
  { name: "Т. Төгс", attendance: 78, score: 70, risk: false },
  { name: "Х. Хатан", attendance: 88, score: 79, risk: false },
  { name: "Ц. Цогт", attendance: 73, score: 64, risk: false },
];

// Сурагчийн гүйцэтгэлийн хүснэгт
const STUDENT_PERFORMANCE = [
  { no: 1, name: "Б. Батмөнх", attendance: 97, avgScore: 90.4, assignments: "20/20", tests: 92, trend: "up", risk: false },
  { no: 2, name: "О. Оюунчимэг", attendance: 95, avgScore: 88.2, assignments: "19/20", tests: 89, trend: "up", risk: false },
  { no: 3, name: "С. Саран", attendance: 89, avgScore: 82.1, assignments: "18/20", tests: 84, trend: "stable", risk: false },
  { no: 4, name: "М. Мөнх", attendance: 92, avgScore: 85.7, assignments: "20/20", tests: 86, trend: "up", risk: false },
  { no: 5, name: "Э. Энх", attendance: 84, avgScore: 76.3, assignments: "17/20", tests: 78, trend: "down", risk: false },
  { no: 6, name: "Т. Төгс", attendance: 78, avgScore: 70.5, assignments: "15/20", tests: 72, trend: "down", risk: false },
  { no: 7, name: "Х. Хатан", attendance: 88, avgScore: 79.4, assignments: "18/20", tests: 81, trend: "stable", risk: false },
  { no: 8, name: "Ц. Цогт", attendance: 73, avgScore: 64.8, assignments: "14/20", tests: 67, trend: "down", risk: false },
  { no: 9, name: "Н. Намуун", attendance: 68, avgScore: 61.2, assignments: "12/20", tests: 63, trend: "down", risk: true },
  { no: 10, name: "Г. Ганзориг", attendance: 71, avgScore: 58.7, assignments: "11/20", tests: 60, trend: "down", risk: true },
  { no: 11, name: "Б. Болд", attendance: 65, avgScore: 49.3, assignments: "10/20", tests: 52, trend: "down", risk: true },
  { no: 12, name: "Д. Далгэрмаа", attendance: 62, avgScore: 54.6, assignments: "9/20", tests: 56, trend: "down", risk: true },
];

// AI эрсдэлийн шинжилгээ
const AI_INSIGHTS = [
  {
    type: "risk",
    icon: AlertCircle,
    title: "4 сурагчид анхаарал шаардлагатай",
    desc: "Д. Далгэрмаа, Г. Ганзориг, Н. Намуун, Б. Болд — ирц болон дүн дооцруу байна. Нийт 128 сурагчаас 3.1% эрсдэлтэй.",
    action: "Харах",
    color: "red",
  },
  {
    type: "improvement",
    icon: TrendingUp,
    title: "9А анги хамгийн сайн гүйцэтгэлтэй",
    desc: "Дундаж дүн 87%, ирц 94%. Математик хичээлээр өнгөрсөн улиралаас 3.2% өссөн.",
    action: "Дэлгэрэнгүй",
    color: "green",
  },
  {
    type: "warning",
    icon: AlertCircle,
    title: "7Б ангид даалгаврын гүйцэтгэл буурч байна",
    desc: "Сүүлийн 2 долоо хоногт даалгаврын гүйцэтгэл 58% хүртэл буурсан. 10 сурагч хугацаанд амжихгүй байна.",
    action: "Шалгах",
    color: "orange",
  },
];

// AI recommendation
const AI_RECOMMENDATIONS = [
  "Д. Далгэрмаа-д нэмэлт хичээл орох саналтай — математик дээр хоцорсон",
  "7Б ангид даалгаврын хугацааг 2 хоног сунгах хэрэгтэй",
  "9А ангийн амжилтыг бусад ангидаа туршлага болгох",
  "Эцэг эхтэй ярилцах үе шаардлагатай: 4 сурагчийн хувьд",
];

// ===== Trend Icon component =====
function TrendIcon({ trend, change }: { trend: "up" | "down" | "stable"; change: number }) {
  if (trend === "up")
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-600">
        <ArrowUp className="w-3 h-3" />+{change}%
      </span>
    );
  if (trend === "down")
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600">
        <ArrowDown className="w-3 h-3" />{change}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-500">
      <Minus className="w-3 h-3" />0%
    </span>
  );
}

// ===== Main Component =====
export function TeacherReports() {
  const [semester, setSemester] = useState(SEMESTERS[0]);
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);

  const atRiskStudents = STUDENT_PERFORMANCE.filter((s) => s.risk);

  return (
    <div className="space-y-6">
      {/* === Header === */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Тайлан & Аналитик
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
              <Sparkles className="w-3 h-3 mr-1" />
              AI
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI анализтай сургалтын тайлан, статистик
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEMESTERS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLASSES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            Excel
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            PDF
          </Button>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
            <Send className="w-4 h-4 mr-1" />
            Захидал илгээх
          </Button>
        </div>
      </div>

      {/* === AI Alert Banner === */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-red-900">
            А хянах шаардлагатай {atRiskStudents.length} сурагч —{" "}
            {atRiskStudents.map((s) => s.name).join(", ")}
          </p>
          <p className="text-sm text-red-700 mt-0.5">
            Ирц болон дүн дооцруу байна. AI шинжилгээгээр эрсдэлтэй гэж үзсэн.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-red-500 hover:bg-red-600 text-white shrink-0"
        >
          <Eye className="w-4 h-4 mr-1" />
          Харах
        </Button>
      </div>

      {/* === AI Insights === */}
      <div className="grid gap-4 md:grid-cols-3">
        {AI_INSIGHTS.map((insight, i) => {
          const Icon = insight.icon;
          const colorClasses = {
            red: "bg-red-50 border-red-200 text-red-700",
            green: "bg-green-50 border-green-200 text-green-700",
            orange: "bg-orange-50 border-orange-200 text-orange-700",
          };
          return (
            <Card key={i} className={`${colorClasses[insight.color as keyof typeof colorClasses]} border`}>
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{insight.title}</p>
                    <p className="text-xs mt-1 opacity-80 leading-relaxed">{insight.desc}</p>
                    <button className="text-xs font-medium mt-2 underline">
                      {insight.action} →
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* === Metrics Cards === */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {METRICS.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg ${metric.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <TrendIcon trend={metric.trend} change={metric.change} />
                </div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{metric.label}</p>
                {metric.subtitle && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{metric.subtitle}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* === Charts Grid (2x2) === */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 1. Ирцийн чиг хандлага */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Ирцийн чиг хандлага
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="week"
                    className="text-[10px]"
                    tick={{ fontSize: 10 }}
                    interval={1}
                  />
                  <YAxis domain={[60, 100]} className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="9А" stroke="#1E3A8A" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="8Б" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="10А" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="7Б" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Дүнгийн тархалт */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-green-600" />
              Дүнгийн тархалт
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={GRADE_DISTRIBUTION} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="grade"
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {GRADE_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3 text-[10px]">
              {GRADE_DISTRIBUTION.map((g) => (
                <div key={g.grade} className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                    <span className="font-medium">{g.count}</span>
                  </div>
                  <p className="text-muted-foreground mt-0.5">{g.percent}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 3. Анги тус бүрийн харьцуулалт */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Анги тус бүрийн харьцуулалт
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CLASS_COMPARISON}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="class" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="Дундаж дүн" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Ирц %" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Даалгавар %" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 4. Сурагчийн явц (Scatter) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-red-600" />
              Сурагчийн дүнгийн явц
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    dataKey="attendance"
                    name="Ирц %"
                    domain={[50, 100]}
                    className="text-xs"
                    tick={{ fontSize: 10 }}
                    label={{ value: "Ирц %", position: "bottom", fontSize: 11, offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="score"
                    name="Амжилт"
                    domain={[40, 100]}
                    className="text-xs"
                    tick={{ fontSize: 10 }}
                    label={{ value: "Амжилт", angle: -90, position: "insideLeft", fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    content={({ payload }) => {
                      if (!payload || payload.length === 0) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border rounded-lg p-2 text-xs shadow-sm">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-muted-foreground">Ирц: {data.attendance}%</p>
                          <p className="text-muted-foreground">Дүн: {data.score}</p>
                          {data.risk && (
                            <p className="text-red-600 font-medium mt-1">⚠ Эрсдэлтэй</p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Scatter data={SCATTER_DATA.filter((s) => !s.risk)} fill="#3B82F6" />
                  <Scatter data={SCATTER_DATA.filter((s) => s.risk)} fill="#EF4444" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Хэвийн</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Эрсдэлтэй</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === AI Recommendations === */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI зөвлөмж
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
              <Sparkles className="w-3 h-3 mr-1" />
              AI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {AI_RECOMMENDATIONS.map((rec, i) => (
              <div
                key={i}
                className="bg-white border border-purple-100 rounded-lg p-3 flex items-start gap-2"
              >
                <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* === Student Performance Table === */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Сурагчийн гүйцэтгэл</CardTitle>
            <Badge variant="outline">{STUDENT_PERFORMANCE.length} сурагч</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-2 font-medium text-muted-foreground">#</th>
                  <th className="pb-2 pr-2 font-medium text-muted-foreground">Нэр</th>
                  <th className="pb-2 pr-2 font-medium text-muted-foreground text-right">Ирц %</th>
                  <th className="pb-2 pr-2 font-medium text-muted-foreground text-right">Дундаж дүн</th>
                  <th className="pb-2 pr-2 font-medium text-muted-foreground text-right">Даалгавар</th>
                  <th className="pb-2 pr-2 font-medium text-muted-foreground text-right">Шалгалт</th>
                  <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">Чиг хандлага</th>
                  <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {STUDENT_PERFORMANCE.map((student) => (
                  <tr
                    key={student.no}
                    className={`border-b last:border-0 hover:bg-muted/50 ${
                      student.risk ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="py-2.5 pr-2 text-muted-foreground">{student.no}</td>
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{student.name}</span>
                        {student.risk && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Эрсдэлтэй" />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 pr-2 text-right font-mono">
                      <span className={student.attendance < 70 ? "text-red-600" : ""}>
                        {student.attendance}
                      </span>
                    </td>
                    <td className="py-2.5 pr-2 text-right font-mono">
                      <span
                        className={
                          student.avgScore >= 85
                            ? "text-green-600 font-medium"
                            : student.avgScore < 60
                            ? "text-red-600 font-medium"
                            : ""
                        }
                      >
                        {student.avgScore}
                      </span>
                    </td>
                    <td className="py-2.5 pr-2 text-right font-mono text-muted-foreground">
                      {student.assignments}
                    </td>
                    <td className="py-2.5 pr-2 text-right font-mono">
                      <span className={student.tests < 60 ? "text-red-600" : ""}>
                        {student.tests}
                      </span>
                    </td>
                    <td className="py-2.5 pr-2 text-center">
                      <TrendIcon trend={student.trend as "up" | "down" | "stable"} change={0} />
                    </td>
                    <td className="py-2.5 pr-2 text-center">
                      {student.risk ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Харах
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          Харах
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}