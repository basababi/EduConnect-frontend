import type { FeatureFlags } from "@/lib/features";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
export const API_BASE = `${API_ORIGIN}/api/v1`;
export const GOOGLE_AUTH_URL = `${API_BASE}/auth/google`;

const TOKEN_KEY = "educonnect_token";
const REFRESH_KEY = "educonnect_refresh";
const USER_KEY = "educonnect_user";

// ===== Token management =====
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setAuth(accessToken: string, refreshToken: string, user: User) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const u = localStorage.getItem(USER_KEY);
  return u ? (JSON.parse(u) as User) : null;
}

/** Токенуудыг хөндөлгүй хадгалсан хэрэглэгчийг шинэчилнэ (/auth/me-ийн хариугаар) */
export function updateStoredUser(user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ===== HTTP client =====
async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Auth endpoint-ийн 401-д refresh/logout хийхгүй — backend-ийн бодит алдааг харуулна
  const isAuthEndpoint =
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/refresh") ||
    path.startsWith("/auth/logout");

  if (res.status === 401 && retry && !isAuthEndpoint) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, options, false);
    clearAuth();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("educonnect:logout"));
    }
    throw new Error("Нэвтрэх хугацаа дууссан");
  }

  if (!res.ok) {
    let message = `Алдаа (${res.status})`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Backend refresh token-ийг эргүүлдэг (rotation): нэг токен НЭГ л удаа хүчинтэй.
// Тиймээс (1) зэрэг 401 авсан хүсэлтүүд refresh-ийг нэг л удаа явуулна (single-flight),
// (2) хариунд ирсэн шинэ refresh token-ийг заавал хадгална — эс бөгөөс дараагийн
// refresh унаж, хэрэглэгч ~1 цаг тутам системээс гарна.
let refreshInFlight: Promise<boolean> | null = null;

function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function doRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ===== Файл татах (auth-тай blob) =====
export async function downloadFile(fileId: number, filename?: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/files/${fileId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Файл татаж чадсангүй");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `file-${fileId}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ===== Multipart upload (файл) — JSON Content-Type-гүй =====
export async function uploadFile<T = UploadedFileMeta>(
  path: string,
  file: File,
  field = "file",
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const form = new FormData();
  form.append(field, file);
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    let message = `Файл хуулж чадсангүй (${res.status})`;
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {}
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ===== Auth API =====
export interface SessionInfo {
  id: number;
  ip?: string | null;
  user_agent?: string | null;
  created_at: string;
  last_used_at?: string | null;
  expires_at?: string | null;
  current?: boolean;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/auth/login", { email, password }),
  me: () => api.get<User>("/auth/me"),
  logout: async () => {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        await api.post("/auth/logout", { refreshToken: refresh });
      } catch {}
    }
    clearAuth();
  },
  sessions: () => api.get<SessionInfo[]>("/auth/sessions"),
  revokeSession: (id: number) => api.delete<void>(`/auth/sessions/${id}`),
  logoutAll: () => api.post<void>("/auth/logout-all"),
  requestEmailVerification: () => api.post<void>("/auth/email/verify/request"),
  forgotPassword: (email: string) =>
    api.post<{ message: string; dev_reset_url?: string }>(
      "/auth/password/forgot",
      { email },
    ),
  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>("/auth/password/reset", { token, password }),
};

// ===== Types =====
/** Хэрэглэгчийн харьяалагдах төв (backend: school). `features` — асаасан нэмэлт боломжууд. */
export interface TenantSummary {
  id: number;
  name: string;
  org_type?: "training_center" | "school";
  features?: FeatureFlags;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "super_admin" | "admin" | "teacher" | "parent" | "student";
  school_id: number;
  phone?: string | null;
  is_active?: boolean;
  school?: TenantSummary | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type BillingType = "one_time" | "monthly";

/** Курс — төвийн каталогийн нэгж. Үнэ бүхэл төгрөгөөр. */
export interface Course {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  total_sessions: number | null;
  duration_weeks: number | null;
  default_price: number;
  billing_type: BillingType;
  is_active: boolean;
  group_count?: number;
}

export type GroupStatus = "planned" | "active" | "completed" | "cancelled";

/** Бүлэг (backend: class) — курсийн тодорхой ээлж */
export interface ClassRoom {
  id: number;
  school_id: number;
  teacher_id: number | null;
  teacher?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  course_id: number | null;
  course?: {
    id: number;
    name: string;
    billing_type: BillingType;
    default_price: number;
  } | null;
  name: string;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  /** Бүлгийн өөрийн үнэ; null бол курсийн үнийг дагана */
  price: number | null;
  effective_price: number;
  room: string | null;
  status: GroupStatus;
  /** Суудал эзэлж буй (идэвхтэй + түр чөлөөтэй) сурагчийн тоо */
  enrolled_count: number;
  grade_level: string | null;
  academic_year: number | null;
  is_active: boolean;
  created_at: string;
}

export interface StudentGroupRef {
  enrollment_id: number;
  class_id: number;
  name: string;
  status: EnrollmentStatus;
  course_name: string | null;
}

export interface Student {
  id: number;
  school_id: number;
  user_id: number | null;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  first_name: string | null;
  last_name: string | null;
  student_code: string | null;
  date_of_birth: string | null;
  phone: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  note: string | null;
  is_active: boolean;
  /** Төвд бүртгүүлсэн огноо */
  enrolled_at: string;
  /** Суралцаж буй бүлгүүд */
  groups: StudentGroupRef[];
  /** @deprecated "үндсэн бүлэг" — `groups`-ыг ашигла */
  class_id: number | null;
  /** @deprecated */
  class?: { id: number; name: string } | null;
}

export type EnrollmentStatus = "active" | "paused" | "completed" | "dropped";

/** Элсэлт — сурагч ↔ бүлэг. Үнийн талбарууд багшид ирэхгүй. */
export interface Enrollment {
  id: number;
  student_id: number;
  class_id: number;
  status: EnrollmentStatus;
  enrolled_at: string;
  ended_at: string | null;
  note: string | null;
  agreed_price?: number | null;
  discount?: number;
  base_price?: number;
  final_price?: number;
  /** Сарын төлбөр: аль өдрийг хүртэл нэхэмжилсэн (зөвхөн админд) */
  billed_until?: string | null;
  /** Энэ элсэлтийн нэхэмжилсэн / төлсөн / үлдэгдэл / хугацаа хэтэрсэн дүн (зөвхөн админд) */
  billing?: EnrollmentBilling;
  student: {
    id: number;
    student_code: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    guardian_name: string | null;
    guardian_phone: string | null;
    user: { id: number; first_name: string; last_name: string } | null;
  } | null;
  class: {
    id: number;
    name: string;
    status: GroupStatus;
    start_date: string | null;
    end_date: string | null;
    room: string | null;
    course: { id: number; name: string; billing_type: BillingType } | null;
    teacher: { id: number; first_name: string; last_name: string } | null;
  } | null;
  created_at: string;
}

export interface EnrollmentBilling {
  invoiced: number;
  paid: number;
  balance: number;
  overdue: number;
}

// ===== Төлбөр =====
export type InvoiceStatus = "issued" | "partially_paid" | "paid" | "void";
export type PaymentMethod = "cash" | "transfer" | "card" | "qpay";
/** Гараар бүртгэж болох хэлбэрүүд (QPay-г зөвхөн QPay-ийн холболт үүсгэнэ) */
export type ManualPaymentMethod = Exclude<PaymentMethod, "qpay">;
export type PaymentKind = "payment" | "refund";
export type PaymentStatus = "pending" | "confirmed" | "failed" | "voided";

export interface InvoiceStudentRef {
  id: number;
  first_name: string | null;
  last_name: string | null;
  student_code: string | null;
  // Доорх нь зөвхөн админд ирнэ
  phone?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  is_active?: boolean;
}

/** Мөнгөний хөдөлгөөний нэг мөр: төлбөр эсвэл буцаалт. Дүн үргэлж эерэг. */
export interface Payment {
  id: number;
  invoice_id: number;
  kind: PaymentKind;
  refund_of_id: number | null;
  receipt_no: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paid_on: string;
  reference: string | null;
  note: string | null;
  received_by: number | null;
  received_by_name: string | null;
  void_reason: string | null;
  voided_at: string | null;
  created_at: string;
}

/**
 * Нэхэмжлэх. Бүх дүн бүхэл төгрөгөөр.
 *   total = amount − discount · balance = total − paid_amount
 * "Хугацаа хэтэрсэн" нь төлөв биш — `is_overdue`-г сервер төлөх огнооноос тооцно.
 */
export interface Invoice {
  id: number;
  number: number;
  description: string;
  amount: number;
  discount: number;
  total: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  period_start: string | null;
  period_end: string | null;
  status: InvoiceStatus;
  is_overdue: boolean;
  days_overdue: number;
  student_id: number;
  enrollment_id: number | null;
  student: InvoiceStudentRef | null;
  class: { id: number; name: string } | null;
  course: { id: number; name: string } | null;
  created_at: string;
  // Доорх нь зөвхөн админд ирнэ
  note?: string | null;
  void_reason?: string | null;
  voided_at?: string | null;
  created_by?: number | null;
  /** Зөвхөн нэг нэхэмжлэхийг авахад */
  payments?: Payment[];
}

/** Сурагч/эцэг эхэд харагдах төлбөрийн мөр (дотоод мэдээлэлгүй) */
export interface CustomerPayment {
  id: number;
  kind: PaymentKind;
  receipt_no: number;
  amount: number;
  method: PaymentMethod;
  paid_on: string;
}

export interface MyInvoice extends Omit<Invoice, "payments"> {
  payments: CustomerPayment[];
}

/** Нэг төлбөрийн баримт (хэвлэхэд) */
export interface PaymentReceipt extends Payment {
  invoice: Invoice;
  center: { name: string; phone: string | null; address: string | null };
}

export interface LedgerPayment extends Payment {
  invoice: { id: number; number: number; description: string };
  student: InvoiceStudentRef | null;
}

export interface PagedResult<T, Totals> {
  items: T[];
  page: number;
  limit: number;
  count: number;
  totals: Totals;
}

export type InvoiceListStatus = "open" | "overdue" | "paid" | "void" | "all";

export interface MoneyFlow {
  collected: number;
  refunded: number;
  net: number;
}

export interface MonthlyFlow extends MoneyFlow {
  /** "YYYY-MM" */
  month: string;
}

export interface FinanceSummary {
  today: string;
  collected_today: number;
  collected_this_month: number;
  collected_prev_month: number;
  outstanding: number;
  open_invoice_count: number;
  overdue: number;
  overdue_invoice_count: number;
  debtor_count: number;
  monthly: MonthlyFlow[];
}

export interface Debtor {
  student_id: number;
  first_name: string | null;
  last_name: string | null;
  student_code: string | null;
  phone: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  is_active: boolean;
  groups: string[];
  invoice_count: number;
  balance: number;
  overdue: number;
  oldest_due: string | null;
  days_overdue: number;
}

export interface DebtorsReport {
  today: string;
  items: Debtor[];
  totals: { balance: number; overdue: number; count: number };
}

export interface RevenueReport {
  from: string;
  to: string;
  totals: MoneyFlow;
  by_month: MonthlyFlow[];
  /** course_id/course_name null = курстэй холбоогүй (бусад) орлого */
  by_course: Array<MoneyFlow & { course_id: number | null; course_name: string | null; students: number }>;
  by_method: Array<MoneyFlow & { method: PaymentMethod }>;
}

export interface TeacherContact {
  id: number;
  first_name: string;
  last_name: string;
  groups: string[];
}

export interface AttendanceSummary {
  class_id: number;
  class_name: string;
  subject: string;
  date_range: { start: string | null; end: string | null };
  total_records: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_rate: number;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  student: {
    id: number;
    student_code: string | null;
    user: { id: number; first_name: string; last_name: string } | null;
  } | null;
  class_id: number;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  /** Хичээлийн ирц (Фаза 4) — хуучин өдрийн ирцэд null */
  session?: {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    topic: string | null;
  } | null;
  class?: { id: number; name: string } | null;
  subject: string | null;
  period: number | null;
  note: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface Grade {
  id: number;
  student_id: number;
  student: {
    id: number;
    student_code: string | null;
    first_name: string | null;
    last_name: string | null;
    user: { id: number; first_name: string; last_name: string } | null;
  } | null;
  class_id: number;
  subject: string;
  score: number;
  max_score: number;
  percentage: number;
  grade_type: string;
  note: string | null;
  created_at: string;
}

export interface GradeAverage {
  student_id: number;
  term_id?: number | null;
  total_grades: number;
  average_percentage: number;
  weighted_final?: number;
  average_score: number;
  by_subject: Array<{
    subject: string;
    count: number;
    total_score: number;
    total_max: number;
    average_percentage: number;
    weighted_final?: number;
  }>;
}

export interface Term {
  id: number;
  school_id: number;
  academic_year: number;
  name: string;
  order_no: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Assignment {
  id: number;
  class_id: number;
  class: { id: number; name: string } | null;
  teacher_id: number;
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  title: string;
  description: string | null;
  file_url: string | null;
  subject: string;
  due_date: string;
  status: "active" | "closed" | "draft";
  is_overdue: boolean;
  days_until_due: number;
  is_active: boolean;
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  sender: {
    id: number;
    first_name: string;
    last_name: string;
    role: string;
  } | null;
  receiver_id: number;
  receiver: {
    id: number;
    first_name: string;
    last_name: string;
    role: string;
  } | null;
  student_id: number | null;
  content: string;
  is_read: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Conversation {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    role: string;
  };
  last_message: Message;
  unread_count: number;
}

export interface NotificationItem {
  id: number;
  school_id: number;
  user_id: number;
  type:
    | "attendance"
    | "grade"
    | "assignment"
    | "message"
    | "announcement"
    | "system";
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  channel: string;
  sms_sent: boolean;
  read_at: string | null;
  created_at: string;
}

export type Role = User["role"];

// Сурагчийн харагдах нэр: login данс байвал түүнийг, эс бөгөөс Student бичлэгийн нэр
export function studentDisplayName(s: {
  user?: { first_name: string; last_name: string } | null;
  first_name?: string | null;
  last_name?: string | null;
  student_code?: string | null;
}): string {
  if (s.user) return `${s.user.first_name} ${s.user.last_name}`;
  const n = `${s.last_name ?? ""} ${s.first_name ?? ""}`.trim();
  return n || s.student_code || "Нэр бүртгээгүй";
}

export interface UploadedFileMeta {
  id: number;
  original_name: string;
  mime_type: string;
  size: number;
  url?: string;
}

export interface Invitation {
  id: number;
  email: string;
  role: "admin" | "teacher" | "parent";
  class_id: number | null;
  status: "pending" | "accepted" | "revoked" | "expired";
  token?: string;
  expires_at: string;
  created_at: string;
  invited_by?: { id: number; first_name: string; last_name: string } | null;
}

export interface InvitationPreview {
  email: string;
  role: string;
  school_name?: string;
  status: string;
  expires_at: string;
}

export interface School {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  director_name: string | null;
  org_type?: "training_center" | "school";
  features?: FeatureFlags;
  status?: string;
  is_active: boolean;
  created_at: string;
}

/** Бүлгийн долоо хоногийн хуваарийн мөр (гараг + цаг). Үүнээс хичээлүүд автоматаар үүснэ. */
export interface TimetableSlot {
  id: number;
  class_id: number;
  day_of_week: number; // 1=Даваа .. 7=Ням
  /** @deprecated ЕБС-ийн "N-р цаг" — шинэ мөрт null */
  period: number | null;
  /** @deprecated — шинэ мөрт null */
  subject: string | null;
  /** null = бүлгийн багш */
  teacher_id: number | null;
  /** null = бүлгийн өрөө */
  room: string | null;
  start_time: string | null;
  end_time: string | null;
  class_name?: string | null;
}

// ===== Хичээл (session) =====
export type SessionStatus = "scheduled" | "held" | "cancelled";
export type SessionKind = "regular" | "makeup" | "extra";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface SessionCounts {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

export interface ClassSession {
  id: number;
  class_id: number;
  class: { id: number; name: string; course: { id: number; name: string } | null } | null;
  /** YYYY-MM-DD */
  date: string;
  /** 1 = Даваа … 7 = Ням */
  weekday: number;
  start_time: string;
  end_time: string;
  room: string | null;
  status: SessionStatus;
  kind: SessionKind;
  topic: string | null;
  teacher: { id: number; first_name: string; last_name: string } | null;
  cancel_reason: string | null;
  makeup_for_id: number | null;
  attendance_taken_at: string | null;
  /** Зөвхөн админ, багшид */
  attendance?: SessionCounts;
}

export interface SessionRosterEntry {
  student_id: number;
  name: string;
  student_code: string | null;
  attendance: { status: AttendanceStatus; note: string | null } | null;
}

export interface SessionDetail extends ClassSession {
  roster: SessionRosterEntry[];
}

export interface StudentAttendanceSummary {
  student_id: number;
  from: string | null;
  to: string | null;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  /** (ирсэн + хоцорсон) / нийт · бүртгэлгүй бол null */
  attendance_rate: number | null;
  by_class: Array<{
    class_id: number;
    class_name: string;
    last_date: string | null;
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendance_rate: number | null;
  }>;
}

export interface CalendarEventItem {
  id: number;
  title: string;
  description: string | null;
  event_date: string;
  type: "holiday" | "exam" | "ptm" | "event";
  class_id: number | null;
}

export interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  student?: {
    id: number;
    student_code: string | null;
    user: { first_name: string; last_name: string } | null;
  } | null;
  text_answer: string | null;
  file_id: number | null;
  file?: UploadedFileMeta | null;
  status: "submitted" | "graded" | "late";
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  unread_count?: number;
  hasMore?: boolean;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  target_type: "school" | "class" | "role";
  target_class_id: number | null;
  target_role: string | null;
  author_id: number;
  status: string;
  publish_at: string;
  expires_at: string | null;
  created_at: string;
}

export interface Subject {
  id: number;
  school_id: number;
  class_id: number;
  teacher_id: number;
  name: string;
  room: string | null;
  is_active: boolean;
  created_at: string;
  student_count?: number;
}

export interface EnrolledStudent {
  id: number;
  student_code: string | null;
  first_name: string | null;
  last_name: string | null;
  user: { first_name: string; last_name: string } | null;
}

export interface Material {
  id: number;
  class_id: number;
  subject: string;
  title: string;
  description: string | null;
  file_id: number;
  file_name: string | null;
  file_size: number | null;
  uploaded_by: number;
  created_at: string;
}

// ── Analytics ──
export interface ClassPerformance {
  class_id: number;
  student_count: number;
  class_average: number;
  by_student: Array<{
    student_id: number;
    student_code: string | null;
    name: string;
    average: number;
    grade_count: number;
  }>;
  by_subject: Array<{ subject: string; average: number }>;
  top: Array<{ student_id: number; student_code: string | null; name: string; average: number }>;
  bottom: Array<{ student_id: number; student_code: string | null; name: string; average: number }>;
}

export interface ClassAttendanceAnalytics {
  class_id: number;
  period_days: number;
  total_records: number;
  attendance_rate: number;
  counts: { present: number; absent: number; late: number; excused: number };
  chronic_absentees: Array<{ student_id: number; absences: number }>;
}

export interface AtRiskResult {
  count: number;
  students: Array<{
    student_id: number;
    student_code: string | null;
    name: string;
    class_id: number | null;
    average_grade: number | null;
    attendance_rate: number | null;
    reasons: string[];
    risk_level: "high" | "medium";
  }>;
}

export interface SchoolDashboard {
  students: number;
  classes: number;
  teachers: number;
  active_enrollments: number;
  today_attendance_rate: number | null;
  overall_average_grade: number;
}

export interface MyChild {
  id: number;
  student_code: string | null;
  class?: { id: number; name: string; grade_level: string } | null;
  user?: { id: number; first_name: string; last_name: string } | null;
}

// ===== DTO types =====
export interface RegisterSchoolDto {
  school_name: string;
  admin_email: string;
  school_email?: string;
  phone?: string;
  address?: string;
  director_name?: string;
}
export interface CreateInvitationDto {
  email: string;
  role: "admin" | "teacher" | "parent";
  class_id?: number;
}
export interface AcceptInvitationDto {
  first_name: string;
  last_name: string;
  password: string;
  phone?: string;
}
/** Засах үед сонголтот талбарыг цэвэрлэхийн тулд `null` илгээнэ */
export interface CreateClassDto {
  name: string;
  course_id?: number | null;
  teacher_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  capacity?: number | null;
  price?: number | null;
  room?: string | null;
  status?: GroupStatus;
}
export interface CreateCourseDto {
  name: string;
  category?: string;
  description?: string;
  total_sessions?: number;
  duration_weeks?: number;
  default_price?: number;
  billing_type?: BillingType;
}
export interface CreateStudentDto {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  note?: string | null;
  student_code?: string | null;
  date_of_birth?: string | null;
  /** Үүсгэхдээ шууд элсүүлэх бүлэг */
  class_id?: number;
  /** `class_id`-тай үед нэхэмжлэх гаргах эсэх (default: true) */
  create_invoice?: boolean;
}
export interface UpsertSlotDto {
  /** өгвөл тэр мөрийг засна */
  id?: number;
  class_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  teacher_id?: number;
}
export interface CreateEventDto {
  title: string;
  description?: string;
  event_date: string;
  type: "holiday" | "exam" | "ptm" | "event";
  class_id?: number;
}

// ===== Domain API wrappers (нэг эх сурвалж) =====
export const registrationApi = {
  // Backend хариу: { school, admin_invite } — урилгын холбоосыг супер админ админд дамжуулна
  registerSchool: (dto: RegisterSchoolDto) =>
    api.post<{
      school: { id: number; name: string; status: string };
      admin_invite?: {
        id: number;
        email: string;
        role: string;
        token: string;
        invite_link: string;
      };
    }>("/registration/school", dto),
  signup: (dto: {
    school_name: string;
    admin_first_name: string;
    admin_last_name: string;
    admin_email: string;
    password: string;
    phone?: string;
  }) =>
    api.post<{ school: { id: number; name: string }; admin_email: string }>(
      "/registration/signup",
      dto,
    ),
};

export const invitationsApi = {
  list: () => api.get<Invitation[]>("/invitations"),
  create: (dto: CreateInvitationDto) => api.post<Invitation>("/invitations", dto),
  bulk: (invitations: CreateInvitationDto[]) =>
    api.post<{ created: number; invitations: Invitation[] }>("/invitations/bulk", {
      invitations,
    }),
  preview: (token: string) =>
    api.get<InvitationPreview>(`/invitations/token/${token}`),
  accept: (token: string, dto: AcceptInvitationDto) =>
    api.post<LoginResponse>(`/invitations/token/${token}/accept`, dto),
  revoke: (id: number) => api.patch<Invitation>(`/invitations/${id}/revoke`),
  remove: (id: number) => api.delete<void>(`/invitations/${id}`),
};

export const schoolsApi = {
  list: (includeInactive = false) =>
    api.get<School[]>(`/schools${includeInactive ? "?include_inactive=true" : ""}`),
  get: (id: number) => api.get<School>(`/schools/${id}`),
  create: (dto: Partial<School> & { name: string }) =>
    api.post<School>("/schools", dto),
  update: (id: number, dto: Partial<Pick<School, "name" | "email" | "phone" | "address" | "director_name" | "org_type" | "features">>) =>
    api.patch<School>(`/schools/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/schools/${id}`),
  restore: (id: number) => api.post<School>(`/schools/${id}/restore`),
};

export const usersApi = {
  list: (role?: string) =>
    api.get<User[]>(`/users${role ? `?role=${role}` : ""}`),
  get: (id: number) => api.get<User>(`/users/${id}`),
  create: (dto: Partial<User> & { email: string; password: string; role: string }) =>
    api.post<User>("/users", dto),
  update: (id: number, dto: Partial<User>) =>
    api.patch<User>(`/users/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/users/${id}`),
};

/** Бүлгүүд (backend зам нь `/classes` хэвээр) */
export const classesApi = {
  list: (teacherId?: number) =>
    api.get<ClassRoom[]>(`/classes${teacherId ? `?teacher_id=${teacherId}` : ""}`),
  get: (id: number) => api.get<ClassRoom>(`/classes/${id}`),
  create: (dto: CreateClassDto) => api.post<ClassRoom>("/classes", dto),
  update: (id: number, dto: Partial<CreateClassDto>) =>
    api.patch<ClassRoom>(`/classes/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/classes/${id}`),
};

export const coursesApi = {
  list: (includeInactive = false) =>
    api.get<Course[]>(`/courses${includeInactive ? "?include_inactive=true" : ""}`),
  create: (dto: CreateCourseDto) => api.post<Course>("/courses", dto),
  update: (id: number, dto: Partial<CreateCourseDto> & { is_active?: boolean }) =>
    api.patch<Course>(`/courses/${id}`, dto),
  archive: (id: number) => api.delete<{ id: number; archived: boolean }>(`/courses/${id}`),
};

export const enrollmentsApi = {
  list: (params: { classId?: number; studentId?: number; status?: EnrollmentStatus } = {}) => {
    const q = new URLSearchParams();
    if (params.classId) q.set("class_id", String(params.classId));
    if (params.studentId) q.set("student_id", String(params.studentId));
    if (params.status) q.set("status", params.status);
    const qs = q.toString();
    return api.get<Enrollment[]>(`/enrollments${qs ? `?${qs}` : ""}`);
  },
  /** Нэвтэрсэн сурагчийн бүлгүүд */
  mine: () => api.get<Enrollment[]>("/enrollments/mine"),
  /** Сурагч/эцэг эхийн холбогдох багш нар */
  myTeachers: () => api.get<TeacherContact[]>("/enrollments/my-teachers"),
  forStudent: (studentId: number) =>
    api.get<Enrollment[]>(`/enrollments/student/${studentId}`),
  enroll: (dto: {
    student_id: number;
    class_id: number;
    enrolled_at?: string;
    agreed_price?: number;
    discount?: number;
    note?: string;
    /** Нэхэмжлэх гаргах эсэх (default: true) */
    create_invoice?: boolean;
    /** Нэхэмжлэхийн төлөх сүүлийн өдөр (YYYY-MM-DD) */
    due_date?: string;
  }) => api.post<Enrollment>("/enrollments", dto),
  update: (
    id: number,
    dto: {
      status?: EnrollmentStatus;
      agreed_price?: number | null;
      discount?: number;
      note?: string | null;
    },
  ) => api.patch<Enrollment>(`/enrollments/${id}`, dto),
  transfer: (id: number, classId: number) =>
    api.post<Enrollment>(`/enrollments/${id}/transfer`, { class_id: classId }),
  remove: (id: number) => api.delete<{ id: number; deleted: boolean }>(`/enrollments/${id}`),
};

export const studentsApi = {
  list: (classId?: number) =>
    api.get<Student[]>(`/students${classId ? `?class_id=${classId}` : ""}`),
  me: () => api.get<Student>("/students/me"),
  get: (id: number) => api.get<Student>(`/students/${id}`),
  create: (dto: CreateStudentDto) => api.post<Student>("/students", dto),
  bulkCreate: (
    students: Array<{
      first_name?: string;
      last_name?: string;
      student_code?: string;
      class_id?: number;
      date_of_birth?: string;
      phone?: string;
      guardian_name?: string;
      guardian_phone?: string;
      email?: string;
      password?: string;
    }>,
    /** Элсүүлсэн сурагч бүрд нэхэмжлэх гаргах эсэх (default: үгүй) */
    createInvoices = false,
  ) =>
    api.post<{
      created: number;
      withLogin?: number;
      enrolled?: number;
      failed: number;
      errors: Array<{ row: number; reason: string }>;
    }>("/students/bulk", { students, create_invoices: createInvoices }),
  update: (id: number, dto: Partial<CreateStudentDto>) =>
    api.patch<Student>(`/students/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/students/${id}`),
};

/**
 * Давхар хүсэлтээс хамгаалах түлхүүр. Төлбөр бүртгэх цонх нээгдэх бүрт НЭГ түлхүүр үүсгэж,
 * тэр цонхны бүх оролдлогод ашиглана — давхар товшилт, сүлжээний дахин оролдлого нэг л
 * төлбөр үүсгэнэ (сервер ижил түлхүүртэй хүсэлтэд анхны төлбөрийг буцаана).
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // crypto.randomUUID нь зөвхөн secure context-д (https/localhost) байдаг
  const part = () => Math.random().toString(36).slice(2);
  return `${Date.now().toString(36)}-${part()}-${part()}`;
}

function toQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") q.set(key, String(value));
  }
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export const invoicesApi = {
  list: (
    params: {
      status?: InvoiceListStatus;
      student_id?: number;
      enrollment_id?: number;
      class_id?: number;
      course_id?: number;
      q?: string;
      page?: number;
      limit?: number;
    } = {},
  ) =>
    api.get<PagedResult<Invoice, { total: number; paid: number; balance: number }>>(
      `/invoices${toQuery(params)}`,
    ),
  /** Сурагч: өөрийн · эцэг эх: хүүхдүүдийнхээ нэхэмжлэх */
  mine: () => api.get<MyInvoice[]>("/invoices/mine"),
  get: (id: number) => api.get<Invoice>(`/invoices/${id}`),
  create: (dto: {
    student_id: number;
    enrollment_id?: number;
    description: string;
    amount: number;
    discount?: number;
    due_date: string;
    note?: string;
  }) => api.post<Invoice>("/invoices", dto),
  update: (
    id: number,
    dto: {
      description?: string;
      amount?: number;
      discount?: number;
      due_date?: string;
      note?: string;
    },
  ) => api.patch<Invoice>(`/invoices/${id}`, dto),
  void: (id: number, reason: string) => api.post<Invoice>(`/invoices/${id}/void`, { reason }),
  restore: (id: number) => api.post<Invoice>(`/invoices/${id}/restore`),
  addPayment: (
    id: number,
    dto: {
      amount: number;
      method: ManualPaymentMethod;
      paid_on?: string;
      reference?: string;
      note?: string;
    },
    idempotencyKey: string,
  ) =>
    api.post<PaymentReceipt>(`/invoices/${id}/payments`, dto, {
      "Idempotency-Key": idempotencyKey,
    }),
  /** Сарын төлбөрийн хугацаа нь болсон нэхэмжлэхүүдийг одоо үүсгэнэ */
  generateMonthly: () =>
    api.post<{ created: number; skipped: number; errors: number }>("/invoices/generate-monthly"),
};

export const paymentsApi = {
  list: (
    params: {
      from?: string;
      to?: string;
      method?: PaymentMethod;
      student_id?: number;
      page?: number;
      limit?: number;
    } = {},
  ) => api.get<PagedResult<LedgerPayment, MoneyFlow>>(`/payments${toQuery(params)}`),
  receipt: (id: number) => api.get<PaymentReceipt>(`/payments/${id}`),
  void: (id: number, reason: string) =>
    api.post<PaymentReceipt>(`/payments/${id}/void`, { reason }),
  refund: (
    id: number,
    dto: {
      amount: number;
      method: ManualPaymentMethod;
      paid_on?: string;
      reason: string;
      /** true = үлдсэн авлагыг хасаж нэхэмжлэхийг хаана (сурагч цааш төлөхгүй) */
      close_invoice?: boolean;
    },
    idempotencyKey: string,
  ) =>
    api.post<PaymentReceipt>(`/payments/${id}/refund`, dto, {
      "Idempotency-Key": idempotencyKey,
    }),
};

export const financeApi = {
  summary: () => api.get<FinanceSummary>("/finance/summary"),
  debtors: () => api.get<DebtorsReport>("/finance/debtors"),
  revenue: (from?: string, to?: string) =>
    api.get<RevenueReport>(`/finance/revenue${toQuery({ from, to })}`),
};

export const sessionsApi = {
  /** Админ — бүгд, багш — өөрийн, сурагч/эцэг эх — өөрийн бүлгүүдийн хичээл */
  list: (params: { from?: string; to?: string; class_id?: number } = {}) =>
    api.get<ClassSession[]>(`/sessions${toQuery(params)}`),
  get: (id: number) => api.get<SessionDetail>(`/sessions/${id}`),
  /** Зөвхөн ирээгүй / хоцорсон / чөлөөтэйг илгээхэд хангалттай — бусад нь ирсэн */
  markAttendance: (
    id: number,
    dto: {
      marks: Array<{ student_id: number; status: AttendanceStatus; note?: string }>;
      topic?: string;
    },
  ) => api.post<SessionDetail>(`/sessions/${id}/attendance`, dto),
  cancel: (id: number, reason: string) =>
    api.post<SessionDetail>(`/sessions/${id}/cancel`, { reason }),
  restore: (id: number) => api.post<SessionDetail>(`/sessions/${id}/restore`),
  reschedule: (
    id: number,
    dto: { date: string; start_time: string; end_time: string; room?: string; reason?: string },
  ) => api.post<SessionDetail>(`/sessions/${id}/reschedule`, dto),
  update: (id: number, dto: { topic?: string; room?: string; teacher_id?: number }) =>
    api.patch<SessionDetail>(`/sessions/${id}`, dto),
  /** Нөхөх (makeup_for_id-тай) эсвэл нэмэлт хичээл */
  create: (dto: {
    class_id: number;
    date: string;
    start_time: string;
    end_time: string;
    room?: string;
    teacher_id?: number;
    topic?: string;
    makeup_for_id?: number;
  }) => api.post<SessionDetail>("/sessions", dto),
  remove: (id: number) => api.delete<{ id: number; deleted: boolean }>(`/sessions/${id}`),
  sync: (classId: number) =>
    api.post<{ created: number; removed: number }>(`/sessions/sync/${classId}`),
};

export const analyticsApi = {
  classPerformance: (classId: number) =>
    api.get<ClassPerformance>(`/analytics/class/${classId}/performance`),
  classAttendance: (classId: number) =>
    api.get<ClassAttendanceAnalytics>(`/analytics/class/${classId}/attendance`),
  atRisk: () => api.get<AtRiskResult>("/analytics/students/at-risk"),
  schoolDashboard: () => api.get<SchoolDashboard>("/analytics/school/dashboard"),
};

export const calendarApi = {
  classTimetable: (classId: number) =>
    api.get<TimetableSlot[]>(`/calendar/timetable/class/${classId}`),
  myTimetable: () => api.get<TimetableSlot[]>("/calendar/timetable/mine"),
  /** Хадгалсны дараа бүлгийн ирэх хичээлүүд автоматаар тохирно (`sessions` — үр дүн) */
  upsertSlot: (dto: UpsertSlotDto) =>
    api.post<TimetableSlot & { sessions: { created: number; removed: number } }>(
      "/calendar/timetable",
      dto,
    ),
  deleteSlot: (id: number) =>
    api.delete<{ id: number; deleted: boolean; sessions_removed: number }>(
      `/calendar/timetable/${id}`,
    ),
  events: () => api.get<CalendarEventItem[]>("/calendar/events"),
  createEvent: (dto: CreateEventDto) =>
    api.post<CalendarEventItem>("/calendar/events", dto),
  deleteEvent: (id: number) => api.delete<void>(`/calendar/events/${id}`),
};

export const submissionsApi = {
  submit: (assignmentId: number, dto: { text_answer?: string; file_id?: number }) =>
    api.post<Submission>(`/submissions/assignment/${assignmentId}`, dto),
  mine: () => api.get<Submission[]>("/submissions/mine"),
  forAssignment: (assignmentId: number) =>
    api.get<Submission[]>(`/submissions/assignment/${assignmentId}`),
  grade: (id: number, dto: { score: number; feedback?: string }) =>
    api.post<Submission>(`/submissions/${id}/grade`, dto),
};

export const announcementsApi = {
  list: (limit = 20, offset = 0) =>
    api.get<Paginated<Announcement>>(`/announcements?limit=${limit}&offset=${offset}`),
  create: (dto: {
    title: string;
    body: string;
    target_type: "school" | "class" | "role";
    target_class_id?: number;
    target_role?: string;
    expires_at?: string;
  }) => api.post<Announcement>("/announcements", dto),
  markRead: (id: number) => api.post<void>(`/announcements/${id}/read`),
  reads: (id: number) =>
    api.get<Array<{ user_id: number; read_at: string }>>(`/announcements/${id}/reads`),
};

export const notificationsApi = {
  list: (params?: { type?: string; is_read?: boolean; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.type) q.set("type", params.type);
    if (params?.is_read !== undefined) q.set("is_read", String(params.is_read));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    const qs = q.toString();
    return api.get<Paginated<NotificationItem>>(`/notifications${qs ? `?${qs}` : ""}`);
  },
  markRead: (id: number) => api.patch<void>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<void>("/notifications/read-all"),
  remove: (id: number) => api.delete<void>(`/notifications/${id}`),
};

export const messagesApi = {
  send: (dto: { receiver_id: number; content: string; student_id?: number }) =>
    api.post<Message>("/messages", dto),
  conversations: () => api.get<Conversation[]>("/messages/conversations"),
  conversation: (otherUserId: number) =>
    api.get<Message[]>(`/messages/conversation/${otherUserId}`),
  markAllRead: (otherUserId: number) =>
    api.patch<void>(`/messages/read-all/${otherUserId}`),
  markRead: (id: number) => api.patch<void>(`/messages/${id}/read`),
  remove: (id: number) => api.delete<void>(`/messages/${id}`),
};

export interface ReportCard {
  school: { name: string };
  student: {
    id: number;
    name: string;
    student_code: string | null;
    class_name: string | null;
    grade_level: string | null;
  };
  term: { id: number; name: string; academic_year: number } | null;
  generated_at: string;
  subjects: Array<{
    subject: string;
    count: number;
    average_percentage: number;
    weighted_final: number;
  }>;
  overall_weighted: number;
  total_grades: number;
}

export const gradesApi = {
  byClass: (classId: number, subject?: string) =>
    api.get<Grade[]>(`/grades/class/${classId}${subject ? `?subject=${subject}` : ""}`),
  byStudent: (studentId: number) =>
    api.get<Grade[]>(`/grades/student/${studentId}`),
  studentAverage: (studentId: number, termId?: number) =>
    api.get<GradeAverage>(
      `/grades/student/${studentId}/average${termId ? `?term_id=${termId}` : ""}`,
    ),
  reportCard: (studentId: number, termId?: number) =>
    api.get<ReportCard>(
      `/grades/student/${studentId}/report-card${termId ? `?term_id=${termId}` : ""}`,
    ),
  create: (dto: {
    student_id: number;
    class_id: number;
    subject: string;
    score: number;
    max_score: number;
    grade_type: string;
    note?: string;
  }) => api.post<Grade>("/grades", dto),
  update: (id: number, dto: Partial<{ score: number; max_score: number; note: string }>) =>
    api.patch<Grade>(`/grades/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/grades/${id}`),
};

export const attendanceApi = {
  byClass: (classId: number, date?: string, subject?: string) => {
    const q = new URLSearchParams();
    if (date) q.set("date", date);
    if (subject) q.set("subject", subject);
    const qs = q.toString();
    return api.get<AttendanceRecord[]>(`/attendance/class/${classId}${qs ? `?${qs}` : ""}`);
  },
  summary: (classId: number, start?: string, end?: string) => {
    const q = new URLSearchParams();
    if (start) q.set("start_date", start);
    if (end) q.set("end_date", end);
    const qs = q.toString();
    return api.get<AttendanceSummary>(`/attendance/summary/${classId}${qs ? `?${qs}` : ""}`);
  },
  byStudent: (studentId: number) =>
    api.get<AttendanceRecord[]>(`/attendance/student/${studentId}`),
  /** Сурагчийн ирсэн хувь, бүлэг тус бүрээр (эцэг эх, сурагч, багш, админ) */
  studentSummary: (studentId: number, from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    const qs = q.toString();
    return api.get<StudentAttendanceSummary>(
      `/attendance/student/${studentId}/summary${qs ? `?${qs}` : ""}`,
    );
  },
  markClass: (dto: {
    class_id: number;
    date: string;
    subject?: string;
    period?: number;
    records: Array<{ student_id: number; status: string; note?: string }>;
  }) => api.post("/attendance/mark-class", dto),
};

export const assignmentsApi = {
  my: () => api.get<Assignment[]>("/assignments/my"),
  /** Нэвтэрсэн сурагчийн бүх бүлгийн даалгавар */
  forStudent: () => api.get<Assignment[]>("/assignments/student"),
  byClass: (classId: number, status?: string) =>
    api.get<Assignment[]>(`/assignments/class/${classId}${status ? `?status=${status}` : ""}`),
  get: (id: number) => api.get<Assignment>(`/assignments/${id}`),
  create: (dto: {
    class_id: number;
    title: string;
    subject: string;
    due_date: string;
    description?: string;
    file_url?: string;
  }) => api.post<Assignment>("/assignments", dto),
  remove: (id: number) => api.delete<void>(`/assignments/${id}`),
};

export const parentStudentApi = {
  myChildren: () => api.get<MyChild[]>("/parent-student/my-children"),
};

export interface RolloverPreview {
  promote: Array<{ id: number; from: string; to: string; new_name: string }>;
  graduate: Array<{ id: number; name: string; students: number }>;
  next_year: number;
}

export const academicApi = {
  previewRollover: () => api.get<RolloverPreview>("/academic/rollover/preview"),
  rollover: () =>
    api.post<{
      promoted_classes: number;
      graduated_classes: number;
      graduated_students: number;
      new_academic_year: number;
    }>("/academic/rollover"),
};

export const termsApi = {
  list: () => api.get<Term[]>("/terms"),
  active: () => api.get<Term | null>("/terms/active"),
  ensureYear: (year: number) =>
    api.post<Term[]>("/terms/ensure-year", { year }),
  activate: (id: number) => api.patch<Term>(`/terms/${id}/activate`),
  remove: (id: number) => api.delete<void>(`/terms/${id}`),
};

export const subjectsApi = {
  mine: () => api.get<Subject[]>("/subjects/mine"),
  enrolled: () => api.get<Subject[]>("/subjects/enrolled"),
  forClass: (classId: number) => api.get<Subject[]>(`/subjects/class/${classId}`),
  create: (dto: {
    class_id: number;
    name: string;
    room?: string;
    auto_enroll?: boolean;
  }) => api.post<Subject>("/subjects", dto),
  remove: (id: number) => api.delete<void>(`/subjects/${id}`),
  students: (id: number) =>
    api.get<EnrolledStudent[]>(`/subjects/${id}/students`),
  enroll: (id: number, studentId: number) =>
    api.post<void>(`/subjects/${id}/students`, { student_id: studentId }),
  unenroll: (id: number, studentId: number) =>
    api.delete<void>(`/subjects/${id}/students/${studentId}`),
};

export const materialsApi = {
  listForClass: (classId: number) =>
    api.get<Material[]>(`/materials/class/${classId}`),
  create: (dto: {
    class_id: number;
    subject: string;
    title: string;
    description?: string;
    file_id: number;
    file_name?: string;
    file_size?: number;
  }) => api.post<Material>("/materials", dto),
  remove: (id: number) => api.delete<void>(`/materials/${id}`),
};

// ─────────────── Curriculum (мэдлэгийн сан) ───────────────
export interface CurriculumTopic {
  id: number;
  unit_id: number;
  order_index: number;
  title: string;
  difficulty: string;
  eyesh_relevant: boolean;
  summary: string | null;
  content: string | null;
  learning_objectives: string[] | null;
  key_concepts: string[] | null;
  formulas: { latex: string; description: string }[] | null;
  worked_examples: { problem: string; solution: string }[] | null;
  common_mistakes: string[] | null;
}

export interface CurriculumUnit {
  id: number;
  subject: string;
  grade: number;
  order_index: number;
  title: string;
  description: string | null;
  eyesh_weight: number;
  topics: CurriculumTopic[];
}

export interface CurriculumCatalogEntry {
  subject: string;
  grades: { grade: number; units: number; topics: number }[];
}

export const curriculumApi = {
  catalog: () =>
    api.get<CurriculumCatalogEntry[]>("/curriculum/catalog"),
  tree: (subject = "math", grade = 11) =>
    api.get<CurriculumUnit[]>(`/curriculum?subject=${subject}&grade=${grade}`),
  unit: (id: number) => api.get<CurriculumUnit>(`/curriculum/units/${id}`),
  topic: (id: number) => api.get<CurriculumTopic>(`/curriculum/topics/${id}`),
};

// ─────────────── AI Tutor / шалгалт ───────────────
export type QuestionType = "mcq" | "open";

export interface AiQuestion {
  id: string;
  type: QuestionType;
  topic_id: number;
  topic_title: string;
  difficulty: string;
  bloom?: string;
  question: string;
  options?: string[]; // зөвхөн mcq
  correct_index?: number; // зөвхөн оноолсны дараа (mcq)
  explanation?: string; // mcq
  sample_answer?: string; // open (оноолсны дараа)
  final_answer?: string; // open (оноолсны дараа)
}

export interface OpenGrade {
  score: number; // 0..1
  feedback: string;
  confidence: number;
  needs_review: boolean;
  matched_points?: string[];
  missing?: string[];
}

export interface TopicMastery {
  topic_id: number;
  title: string;
  correct: number;
  total: number;
  mastery: number;
  level: "эзэмшсэн" | "хэсэгчилсэн" | "эзэмшээгүй";
}

export interface AssessmentResult {
  correct: number;
  total: number;
  percentage: number;
  grade: string;
  per_topic: TopicMastery[];
  gaps: string[];
  recommendations: string;
  needs_review_count: number;
}

export interface IntegritySignal {
  paste_blocked: number;
  blur_events: number;
}

export interface AiAssessment {
  id: number;
  subject: string;
  grade: number;
  status: "generated" | "scored";
  score?: number | null;
  result?: AssessmentResult | null;
  answers?: Record<string, number | string>;
  open_grades?: Record<string, OpenGrade> | null;
  questions: AiQuestion[];
  created_at?: string;
}

export interface AssessmentHistoryItem {
  id: number;
  status: string;
  score: number | null;
  question_count: number;
  created_at: string;
}

export const aiApi = {
  status: () => api.get<{ available: boolean }>("/ai/status"),
  generate: (
    topic_ids: number[],
    count?: number,
    open_count?: number,
    level?: string,
  ) =>
    api.post<AiAssessment>("/ai/assessment/generate", {
      topic_ids,
      count,
      open_count,
      level,
    }),
  explain: (assessment_id: number, question_id: string, message?: string) =>
    api.post<{ explanation: string }>("/ai/explain", {
      assessment_id,
      question_id,
      message,
    }),
  hint: (assessment_id: number, question_id: string, level: number) =>
    api.post<{ level: number; max_level: number; hint: string }>("/ai/hint", {
      assessment_id,
      question_id,
      level,
    }),
  submit: (
    id: number,
    answers: Record<string, number | string>,
    integrity?: IntegritySignal,
  ) =>
    api.post<AiAssessment>(`/ai/assessment/${id}/submit`, { answers, integrity }),
  getOne: (id: number) => api.get<AiAssessment>(`/ai/assessment/${id}`),
  history: () => api.get<AssessmentHistoryItem[]>("/ai/assessment/history"),
  progress: () => api.get<AiProgress>("/ai/progress"),
  lesson: (topic_id: number) => api.post<AiLesson>("/ai/lesson", { topic_id }),
  practiceCheck: (topic_id: number, answers: Record<string, number>) =>
    api.post<PracticeResult>("/ai/lesson/practice-check", { topic_id, answers }),
  reviews: () => api.get<ReviewItem[]>("/ai/reviews"),
  overrideReview: (
    assessmentId: number,
    questionId: string,
    score: number,
    feedback?: string,
  ) =>
    api.patch<{ ok: boolean }>(`/ai/reviews/${assessmentId}/${questionId}`, {
      score,
      feedback,
    }),
};

// ─────────────── AI хичээл / ахиц / багшийн шалгалт ───────────────
export interface LessonExample {
  problem: string;
  solution_steps: string[];
  answer: string;
}
export interface LessonPractice {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
}
export interface AiLesson {
  topic_id: number;
  explanation: string;
  key_points: string[];
  worked_examples: LessonExample[];
  practice: LessonPractice[];
}
export interface PracticeResult {
  correct: number;
  total: number;
  percentage: number;
  results: {
    id: string;
    correct: boolean;
    picked?: number;
    correct_index: number;
    explanation: string;
  }[];
}
export interface ProgressTopic {
  topic_id: number;
  title: string;
  mastery: number;
  attempts: number;
  trend: number;
  last_seen: string;
  due: boolean;
}
export interface AiProgress {
  total_assessments: number;
  avg_score: number;
  streak: number;
  mastered: number;
  due_count: number;
  topics: ProgressTopic[];
}

// F8 · ангийн gap
export interface ClassGaps {
  class_id: number;
  student_count: number;
  tested_count: number;
  topics: {
    topic_id: number;
    title: string;
    avg_mastery: number;
    attempts: number;
    weak_count: number;
  }[];
  at_risk: {
    student_id: number;
    name: string;
    avg_score: number;
    attempts: number;
  }[];
}

// Question bank
export interface BankQuestion {
  id: number;
  topic_id: number;
  topic_title: string | null;
  type: QuestionType;
  bloom: string | null;
  difficulty: string;
  question: string;
  options: string[] | null;
  correct_index: number | null;
  explanation: string | null;
  rubric: { key_points: string[]; final_answer: string } | null;
  source: string;
  status: string;
  created_at: string;
}
export interface BankStats {
  draft: number;
  approved: number;
  rejected: number;
}

export const aiTeacherApi = {
  classGaps: (classId: number) =>
    api.get<ClassGaps>(`/ai/class/${classId}/gaps`),
  bankList: (params?: { topic_id?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.topic_id) q.set("topic_id", String(params.topic_id));
    if (params?.status) q.set("status", params.status);
    const qs = q.toString();
    return api.get<BankQuestion[]>(`/ai/bank${qs ? `?${qs}` : ""}`);
  },
  bankStats: () => api.get<BankStats>("/ai/bank/stats"),
  bankReview: (id: number, action: "approve" | "reject") =>
    api.patch<{ id: number; status: string }>(`/ai/bank/${id}/${action}`),
};
export interface ReviewItem {
  assessment_id: number;
  student_id: number;
  question_id: string;
  topic_title: string;
  question: string;
  correct_answer: string | null;
  student_answer: string;
  ai_score: number;
  ai_feedback: string;
  created_at: string;
}

// ─────────────── Career (Карьер Зөвлөгөө) ───────────────
export interface RiasecVector {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

export interface CareerItem {
  id: number;
  name: string;
  category: string;
  riasec: RiasecVector;
  description: string;
  day_in_life: string | null;
  eyesh_subjects: { subject: string; min_score: number }[] | null;
  salary_range: string | null;
  demand_score: number;
  demand_trend: string;
  is_lesser_known: boolean;
}

export interface CareerQuestionnaire {
  likert: string[];
  items: { id: string; text: string }[];
}

export interface CareerProfileRes {
  has_profile: boolean;
  riasec: RiasecVector | null;
  big5: Record<string, number> | null;
  work_values: Record<string, number> | null;
  updated_at: string | null;
  academic: { subject: string; avg: number }[];
}

export interface RoadmapStep {
  title: string;
  hint: string;
  done: boolean;
}
export interface CareerRoadmap {
  grade: number;
  steps: RoadmapStep[];
}

export interface DeepQuestionnaire {
  likert: string[];
  big5_items: { id: string; text: string }[];
  value_items: { id: string; text: string; value: string }[];
}
export interface DeepScores {
  big5: Record<string, number>;
  work_values: Record<string, number>;
}

export interface UniversityProgramAdmin {
  id: number;
  university: string;
  program: string;
  city: string;
  ownership: "state" | "private";
  eyesh_subjects: string[];
  cutoff_score: number;
  field: string | null;
  tuition_range: string | null;
  status: string;
}
export type ProgramInput = Omit<UniversityProgramAdmin, "id">;

export interface CareerRecommendationItem {
  career_id: number;
  match: number;
  interest: number;
  academic: number;
  demand: number;
  career: CareerItem;
}

export interface CareerRecommendations {
  riasec: RiasecVector;
  narrative: string | null;
  created_at: string;
  items: CareerRecommendationItem[];
}

export interface CareerDiscover {
  week_pick: CareerItem | null;
  suggestions: CareerItem[];
}

export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SchoolMatchItem {
  id: number;
  university: string;
  program: string;
  city: string;
  ownership: "state" | "private";
  field: string | null;
  tuition_range: string | null;
  cutoff_score: number;
  your_score: number;
  gap: number;
  related: boolean;
}

export interface SchoolMatches {
  subjects: string[];
  scores: Record<string, number>;
  has_scores: boolean;
  safety: SchoolMatchItem[];
  match: SchoolMatchItem[];
  reach: SchoolMatchItem[];
}

// ─────────────── Нийтийн шалгалт ───────────────
export interface ExamListItem {
  id: number;
  subject: string;
  grade: number;
  title: string;
  status: string;
  question_count: number;
  created_at: string;
  attempted: boolean;
  my_score: number | null;
}
export interface ExamTakeQuestion {
  id: string;
  topic_title: string;
  difficulty: string;
  question: string;
  options: string[];
}
export interface ExamTake {
  id: number;
  title: string;
  subject: string;
  grade: number;
  questions: ExamTakeQuestion[];
}
export interface ExamTopicScore {
  topic_id: number;
  title: string;
  correct: number;
  total: number;
}
export interface ExamSubmitResult {
  score: number;
  correct: number;
  total: number;
  per_topic: ExamTopicScore[];
  rank: number;
  totalParticipants: number;
}
export interface ExamReviewItem {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  my_answer: number | null;
  explanation: string | null;
  topic_title: string;
}
export interface ExamMyResult extends ExamSubmitResult {
  title: string;
  review: ExamReviewItem[];
}
export interface ExamLeaderboard {
  title: string;
  rows: { rank: number; name: string; school: string; score: number }[];
}

export interface ExamAdminItem {
  id: number;
  subject: string;
  grade: number;
  title: string;
  status: string;
  question_count: number;
  created_at: string;
  participants: number;
}

export const examApi = {
  list: () => api.get<ExamListItem[]>("/exams"),
  manage: () => api.get<ExamAdminItem[]>("/exams/manage"),
  take: (id: number) => api.get<ExamTake>(`/exams/${id}/take`),
  submit: (id: number, answers: Record<string, number>) =>
    api.post<ExamSubmitResult>(`/exams/${id}/submit`, { answers }),
  myResult: (id: number) => api.get<ExamMyResult>(`/exams/${id}/my-result`),
  leaderboard: (id: number) => api.get<ExamLeaderboard>(`/exams/${id}/leaderboard`),
  // Админ
  create: (dto: { subject: string; grade: number; title: string; count: number }) =>
    api.post<{ id: number }>("/exams", dto),
  setStatus: (id: number, status: "open" | "closed") =>
    api.patch<{ id: number; status: string }>(`/exams/${id}/status`, { status }),
};

export interface FocusArea {
  subject: string;
  avg: number;
  needed_for: string[];
}
export interface WeakTopic {
  title: string;
  mastery: number;
}

export const careerApi = {
  questionnaire: () => api.get<CareerQuestionnaire>("/careers/questionnaire"),
  focus: () =>
    api.get<{ areas: FocusArea[]; weak_topics: WeakTopic[] }>("/careers/focus"),
  roadmap: () => api.get<CareerRoadmap>("/careers/roadmap"),
  deepQuestionnaire: () =>
    api.get<DeepQuestionnaire>("/careers/deep-questionnaire"),
  submitDeep: (answers: Record<string, number>) =>
    api.post<DeepScores>("/careers/deep", { answers }),
  // Админ — их сургуулийн сан
  adminPrograms: () =>
    api.get<UniversityProgramAdmin[]>("/careers/admin/programs"),
  adminCreateProgram: (data: ProgramInput) =>
    api.post<UniversityProgramAdmin>("/careers/admin/programs", data),
  adminUpdateProgram: (id: number, data: ProgramInput) =>
    api.patch<UniversityProgramAdmin>(`/careers/admin/programs/${id}`, data),
  adminDeleteProgram: (id: number) =>
    api.delete<{ ok: boolean }>(`/careers/admin/programs/${id}`),
  submit: (answers: Record<string, number>) =>
    api.post<CareerProfileRes>("/careers/questionnaire", { answers }),
  profile: () => api.get<CareerProfileRes>("/careers/profile"),
  recommendations: () =>
    api.get<CareerRecommendations>("/careers/recommendations"),
  discover: () => api.get<CareerDiscover>("/careers/discover"),
  // Зөвлөхтэй чат (сервер тал түүх хадгална)
  coachHistory: () =>
    api.get<{ messages: CoachMessage[] }>("/careers/coach"),
  coach: (message: string) =>
    api.post<{ reply: string; messages: CoachMessage[] }>("/careers/coach", {
      message,
    }),
  coachClear: () => api.delete<{ messages: CoachMessage[] }>("/careers/coach"),
  // ЭЕШ → сургууль
  schools: () => api.get<SchoolMatches>("/careers/schools"),
  saveEyesh: (scores: Record<string, number>) =>
    api.post<SchoolMatches>("/careers/eyesh", { scores }),
  list: (category?: string) =>
    api.get<CareerItem[]>(
      `/careers${category ? `?category=${encodeURIComponent(category)}` : ""}`,
    ),
  get: (id: number) => api.get<CareerItem>(`/careers/${id}`),
};