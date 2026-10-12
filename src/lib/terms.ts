/**
 * Бүтээгдэхүүний нэр томьёоны НЭГ эх сурвалж.
 *
 * Платформ сургалтын төвд зориулагдсан: tenant = «төв», сурагчдын нэгж = «бүлэг».
 * Backend-ийн хүснэгт/талбарын нэр түүхэн шалтгаанаар `schools` / `classes` хэвээр
 * (СУРГАЛТЫН-ТӨВ-ТӨЛӨВЛӨГӨӨ.md, шийдвэр D1, D2) — хэрэглэгчид харагдах үгийг эндээс авна.
 * Монгол хэлний тийн ялгал бүрийг тусад нь бичсэн тул мөр залгаж үг бүтээхгүй.
 */
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

/**
 * Бүлгийн жагсаалтад нэрийн доор харуулах товч мөр.
 * ЕБС-ийн "10-р анги · 2025"-ыг орлоно; курс/огнооны мэдээлэл нэмэгдэх тусам энд өргөтгөнө.
 */
export function groupSubtitle(g: {
  grade_level?: string | null;
  academic_year?: number | null;
}): string {
  return [g.grade_level ? `Түвшин: ${g.grade_level}` : null, g.academic_year ?? null]
    .filter(Boolean)
    .join(" · ");
}
