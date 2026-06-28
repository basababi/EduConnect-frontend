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

async function tryRefresh(): Promise<boolean> {
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
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
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
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "super_admin" | "admin" | "teacher" | "parent" | "student";
  school_id: number;
  phone?: string | null;
  is_active?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

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
  name: string;
  grade_level: string;
  academic_year: number;
  is_active: boolean;
  created_at: string;
}

export interface Student {
  id: number;
  school_id: number;
  class_id: number | null;
  class?: { id: number; name: string; grade_level: string } | null;
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
  is_active: boolean;
  enrolled_at: string;
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
  is_active: boolean;
  created_at: string;
}

export interface TimetableSlot {
  id: number;
  class_id: number;
  day_of_week: number; // 1=Даваа .. 7=Ням
  period: number;
  subject: string;
  teacher_id: number | null;
  room: string | null;
  start_time: string | null;
  end_time: string | null;
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
    average: number;
    grade_count: number;
  }>;
  by_subject: Array<{ subject: string; average: number }>;
  top: Array<{ student_id: number; student_code: string | null; average: number }>;
  bottom: Array<{ student_id: number; student_code: string | null; average: number }>;
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
export interface CreateClassDto {
  name: string;
  grade_level: string;
  academic_year: number;
  teacher_id?: number;
}
export interface CreateStudentDto {
  first_name?: string;
  last_name?: string;
  class_id?: number;
  student_code?: string;
  date_of_birth?: string;
}
export interface UpsertSlotDto {
  class_id: number;
  day_of_week: number;
  period: number;
  subject: string;
  teacher_id?: number;
  room?: string;
  start_time?: string;
  end_time?: string;
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
  registerSchool: (dto: RegisterSchoolDto) =>
    api.post<{ school: School; admin: User; invitation?: Invitation }>(
      "/registration/school",
      dto,
    ),
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
  update: (id: number, dto: Partial<School>) =>
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

export const classesApi = {
  list: (teacherId?: number) =>
    api.get<ClassRoom[]>(`/classes${teacherId ? `?teacher_id=${teacherId}` : ""}`),
  get: (id: number) => api.get<ClassRoom>(`/classes/${id}`),
  create: (dto: CreateClassDto) => api.post<ClassRoom>("/classes", dto),
  update: (id: number, dto: Partial<CreateClassDto>) =>
    api.patch<ClassRoom>(`/classes/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/classes/${id}`),
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
    }>,
  ) =>
    api.post<{
      created: number;
      failed: number;
      errors: Array<{ row: number; reason: string }>;
    }>("/students/bulk", { students }),
  update: (id: number, dto: Partial<CreateStudentDto>) =>
    api.patch<Student>(`/students/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/students/${id}`),
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
  upsertSlot: (dto: UpsertSlotDto) =>
    api.post<TimetableSlot>("/calendar/timetable", dto),
  deleteSlot: (id: number) => api.delete<void>(`/calendar/timetable/${id}`),
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