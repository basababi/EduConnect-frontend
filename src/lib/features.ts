import type { User } from "@/lib/api";

/**
 * Төв бүрээр асааж/унтраадаг нэмэлт боломжууд — backend-ийн
 * `common/tenant/features.ts`-тэй ижил түлхүүрүүд. Түлхүүр байхгүй = унтраалттай.
 *
 * Энд цэсийг нуух нь зөвхөн UX; жинхэнэ хамгаалалт backend-ийн `@RequireFeature()`.
 */
export type FeatureKey =
  | "ai_tutor"
  | "ai_chat"
  | "career"
  | "public_exams"
  | "subjects"
  | "academic_terms"
  | "sms_notifications";

export type FeatureFlags = Partial<Record<FeatureKey, boolean>>;

export const FEATURE_INFO: Record<FeatureKey, { label: string; description: string }> = {
  ai_tutor: {
    label: "AI Хичээлийн Дагуул",
    description: "Диагностик тест, сэдвийн хичээл, асуултын сан",
  },
  ai_chat: {
    label: "AI Туслах чат",
    description: "Сурагчийн чөлөөт асуулт хариултын туслах",
  },
  career: {
    label: "AI Карьер Зөвлөх",
    description: "Мэргэжил сонголт, ЭЕШ оноо → их сургууль",
  },
  public_exams: {
    label: "Нийтийн шалгалт",
    description: "Төв хоорондын сорил, чансаа",
  },
  subjects: {
    label: "Бүлгийн доторх хичээлүүд",
    description: "Нэг бүлэгт олон хичээл (ЕБС загвар)",
  },
  academic_terms: {
    label: "Улирал, хичээлийн жил",
    description: "Улирал, жил дэвших, дүнгийн хуудас (ЕБС загвар)",
  },
  sms_notifications: {
    label: "Мэдэгдлийн SMS",
    description: "Төлбөрийн сануулга, тасалсан тухай SMS (зардалтай, сарын хязгаартай)",
  },
};

export const FEATURE_KEYS = Object.keys(FEATURE_INFO) as FeatureKey[];

/** super_admin нь платформын эзэн тул бүх боломжийг харна (backend-тэй ижил дүрэм). */
export function hasFeature(user: User | null | undefined, key: FeatureKey): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  return user.school?.features?.[key] === true;
}
