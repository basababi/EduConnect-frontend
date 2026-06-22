const API_BASE = "http://localhost:3001/api/v1";

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

  if (res.status === 401 && retry) {
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

// ===== Auth API =====
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
  total_grades: number;
  average_percentage: number;
  average_score: number;
  by_subject: Array<{
    subject: string;
    count: number;
    total_score: number;
    total_max: number;
    average_percentage: number;
  }>;
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