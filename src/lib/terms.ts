/**
 * Бүтээгдэхүүний нэр томьёоны НЭГ эх сурвалж.
 *
 * Платформ сургалтын төвд зориулагдсан: tenant = «төв», сурагчдын нэгж = «бүлэг».
 * Backend-ийн хүснэгт/талбарын нэр түүхэн шалтгаанаар `schools` / `classes` хэвээр
 * (СУРГАЛТЫН-ТӨВ-ТӨЛӨВЛӨГӨӨ.md, шийдвэр D1, D2) — хэрэглэгчид харагдах үгийг эндээс авна.
 * Монгол хэлний тийн ялгал бүрийг тусад нь бичсэн тул мөр залгаж үг бүтээхгүй.
 */
import { formatDateRange } from "@/lib/format";

export const TERMS = {
  /** Tenant (backend: school) */
  org: {
    one: "Төв",
    many: "Төвүүд",
    genitive: "Төвийн", // төвийн админ
    dative: "Төвд", // төвд бүртгэлтэй
    full: "Сургалтын төв",
  },
  /** Сурагчдын нэгж (backend: class) */
  group: {
    one: "Бүлэг",
    many: "Бүлгүүд",
    genitive: "Бүлгийн", // бүлгийн сурагчид
    dative: "Бүлэгт", // бүлэгт элсүүлэх
    accusative: "Бүлгийг", // бүлгийг устгах
    lower: "бүлэг",
  },
  product: "EduConnect",
  tagline: "Сургалтын төвийн удирдлагын платформ",
} as const;

export type RoleKey = "super_admin" | "admin" | "teacher" | "student" | "parent";

export const ROLE_LABELS: Record<RoleKey, string> = {
  super_admin: "Супер админ",
  admin: "Төвийн админ",
  teacher: "Багш",
  student: "Сурагч",
  parent: "Эцэг эх",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as RoleKey] ?? role;
}

export const GROUP_STATUS_LABELS = {
  planned: "Төлөвлөсөн",
  active: "Явагдаж буй",
  completed: "Дууссан",
  cancelled: "Цуцлагдсан",
} as const;

export const ENROLLMENT_STATUS_LABELS = {
  active: "Суралцаж буй",
  paused: "Түр чөлөөтэй",
  completed: "Дүүргэсэн",
  dropped: "Гарсан",
} as const;

export const BILLING_TYPE_LABELS = {
  one_time: "Курсийн нийт төлбөр",
  monthly: "Сар бүр",
} as const;

export const INVOICE_STATUS_LABELS = {
  issued: "Төлөгдөөгүй",
  partially_paid: "Хэсэгчлэн төлсөн",
  paid: "Төлөгдсөн",
  void: "Хүчингүй",
} as const;

export const PAYMENT_METHOD_LABELS = {
  cash: "Бэлэн",
  transfer: "Шилжүүлэг",
  card: "Карт",
  qpay: "QPay",
} as const;

/**
 * Бүлгийн жагсаалтад нэрийн доор харуулах товч мөр: курс · хугацаа
 * (ЕБС-ийн "10-р анги · 2025"-ыг орлоно).
 */
export function groupSubtitle(g: {
  course?: { name: string } | null;
  start_date?: string | null;
  end_date?: string | null;
}): string {
  const range = formatDateRange(g.start_date, g.end_date);
  return [g.course?.name ?? null, range || null].filter(Boolean).join(" · ") || "Курс оноогоогүй";
}

/**
 * Бүлгийн "хичээл"-ийн нэр — дүн, даалгавар, материалын `subject` талбарт очно.
 * Сургалтын төвд бүлэг = нэг курс тул багш хичээл тусад нь сонгохгүй.
 */
export function groupSubject(g: { name: string; course?: { name: string } | null }): string {
  return (g.course?.name ?? g.name).slice(0, 100);
}
