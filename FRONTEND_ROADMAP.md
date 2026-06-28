# EduConnect — Frontend хийх ажлын төлөвлөгөө (Backend-тэй зөрүүний анализ)

> **Зорилго:** Backend дээр бэлэн болсон БҮХ боломжийг frontend дээр ашиглах.
> **Огноо:** 2026-06-25 · **Хувилбар:** v2.0
> **Аргачлал:** `EduConnect/src/modules/**/*.controller.ts` бүх endpoint-ийг
> `educonnect-frontend/src/components/dashboard/**` view-үүдтэй тулгаж зөрүүг гаргав.
>
> 🟢 **2026-06-25 шинэчлэл (v2.0):** **Phase A, B, C бүгд хийгдэж дууссан**, `next build` цэвэр (exit 0). Зөвхөн Phase D (AI Tutor/Career — хүсэлтээр хойшлуулсан) болон жижиг polish (messages read-marking) үлдсэн. Дэлгэрэнгүйг §3 доорх **ГҮЙЦЭТГЭЛИЙН ТЭМДЭГЛЭЛ**-үүдээс үзнэ үү.

---

## 0. Гүйцэтгэлийн нэгдсэн зураг (TL;DR)

| Хэсэг | Backend | Frontend | Төлөв |
|---|---|---|---|
| Login / refresh / logout | ✅ | ✅ | **Бүрэн** |
| Дүн (grades) — CRUD | ✅ | ✅ | **Бүрэн** (багш, эцэг эх, сурагч) |
| Ирц (attendance) | ✅ | ✅ | Багш бүртгэх + analytics-д статистик/түүх (B2/B4) |
| Даалгавар (assignments) | ✅ | ✅ | Багш CRUD + файл upload |
| Мессеж (messages) | ✅ | ⚠️ | Багш/эцэг эх ✅; **сурагч алга** |
| Анги (classes) | ✅ | ✅ | **Бүрэн** — CRUD + анги дотор сурагч (Phase A) |
| Хэрэглэгч (users) | ✅ | ✅ | **Бүрэн** — жагсаалт + урих + урилга удирдах (Phase A) |
| Сурагч (students) | ✅ | ✅ | **Бүрэн** — анги дотроос нэмэх/устгах (Phase A) |
| **Onboarding (урилга/бүртгэл)** | ✅ | ✅ | **Бүрэн (Phase A)** — accept хуудас + урих + сургууль бүртгэх |
| **Сургууль удирдах (schools)** | ✅ | ✅ | **Бүрэн (Phase A)** — super_admin бүртгэх/идэвхжүүлэх |
| **Analytics (dashboard, at-risk)** | ✅ | ✅ | **Бүрэн (B2)** — багш reports + admin dashboard |
| **Хуваарь/Календарь (calendar)** | ✅ | ✅ | **Бүрэн (B1)** — багш засвар + сурагч харах + эвент |
| **Даалгаврын илгээлт (submissions)** | ✅ | ✅ | **Бүрэн (B3)** — сурагч илгээх + багш дүгнэх |
| **Зарлал (announcements)** | ✅ | ✅ | **Бүрэн (B6)** — бүх role харах, admin/багш үүсгэх |
| **Мэдэгдэл (notifications)** | ✅ | ✅ | **Бүрэн (B5)** — бодит хонх + dropdown + read |
| **Файл (files)** | ✅ | ✅ | Submissions-д upload; татах polish үлдсэн |
| **Аккаунт хамгаалалт (sessions/email)** | ✅ | ✅ | **Бүрэн (C3)** — профайл + сесс + email verify + Google |

> **Дүгнэлт:** Үндсэн CRUD урсгал холбогдсон. Гэхдээ backend-ийн **8+ бүтэн модуль** frontend дээр ашиглагдаагүй байна. Хамгийн эгзэгтэй нь **onboarding (хэрэглэгч нэмэх) урсгал** — энэгүйгээр систем бодит ажиллахгүй.

---

## 1. Backend-ийн бэлэн endpoint-ийн бүрэн жагсаалт

> Frontend хөгжүүлэхэд ашиглах "API лавлах". Бүгд `/api/v1` prefix-тэй.

### 1.1 Auth (`/auth`)
| Method | Path | Эрх | Frontend |
|---|---|---|---|
| POST | `/auth/login` | Public | ✅ |
| POST | `/auth/refresh` | Public | ✅ |
| POST | `/auth/logout` | Public | ✅ |
| GET | `/auth/me` | Auth | ⚠️ (login дээр user хадгалдаг) |
| GET | `/auth/sessions` | Auth | ❌ |
| DELETE | `/auth/sessions/:id` | Auth | ❌ |
| POST | `/auth/logout-all` | Auth | ❌ |
| POST | `/auth/email/verify/request` | Auth | ❌ |
| POST | `/auth/email/verify/:token` | Public | ❌ |
| GET | `/auth/google` + `/google/callback` | Public | ❌ (Google login товч алга) |

### 1.2 Registration & Invitations (Onboarding)
| Method | Path | Эрх | Frontend |
|---|---|---|---|
| POST | `/registration/school` | super_admin | ❌ |
| POST | `/invitations` | admin, super_admin | ❌ |
| POST | `/invitations/bulk` | admin, super_admin | ❌ |
| GET | `/invitations` | admin, super_admin | ❌ |
| GET | `/invitations/token/:token` | Public | ❌ |
| POST | `/invitations/token/:token/accept` | Public | ❌ |
| PATCH | `/invitations/:id/revoke` | admin, super_admin | ❌ |

### 1.3 Schools (`/schools`) — super_admin
| Method | Path | Frontend |
|---|---|---|
| POST / GET / GET :id / PATCH :id / DELETE :id / POST :id/restore | ❌ бүгд |

### 1.4 Users (`/users`)
| Method | Path | Эрх | Frontend |
|---|---|---|---|
| POST | `/users` | admin | ❌ |
| GET | `/users` | admin | ✅ (read) |
| GET | `/users/:id` | Auth | ❌ |
| PATCH | `/users/:id` | Auth/admin | ❌ |
| DELETE | `/users/:id` | admin | ❌ |

### 1.5 Classes (`/classes`)
| Method | Path | Эрх | Frontend |
|---|---|---|---|
| POST | `/classes` | admin | ❌ |
| GET | `/classes` | Auth | ✅ |
| GET | `/classes/:id` | Auth | ⚠️ |
| PATCH | `/classes/:id` | admin | ❌ |
| DELETE | `/classes/:id` | admin | ❌ |

### 1.6 Students (`/students`)
| Method | Path | Эрх | Frontend |
|---|---|---|---|
| POST | `/students` | admin, teacher | ❌ |
| GET | `/students` (`?class_id=`) | admin, teacher | ✅ |
| GET | `/students/:id` | admin, teacher, parent | ⚠️ |
| PATCH | `/students/:id` | admin, teacher | ❌ |
| DELETE | `/students/:id` | admin | ❌ |

### 1.7 Grades (`/grades`)
| Method | Path | Эрх | Frontend |
|---|---|---|---|
| POST `/grades`, PATCH/DELETE `:id` | admin, teacher | ✅ (post); засах/устгах ⚠️ |
| GET `/grades/class/:id` | admin, teacher | ✅ |
| GET `/grades/student/:id` | бүгд | ✅ |
| GET `/grades/student/:id/average` | бүгд | ✅ |

### 1.8 Attendance (`/attendance`)
| Method | Path | Эрх | Frontend |
|---|---|---|---|
| POST `/attendance/mark-class` | admin, teacher | ✅ |
| GET `/attendance/class/:id` | admin, teacher | ❌ (бүртгэдэг ч буцааж харуулдаггүй) |
| GET `/attendance/summary/:classId` | admin, teacher | ❌ |
| GET `/attendance/student/:id` | бүгд | ⚠️ (эцэг эх ✅, сурагч ❌) |
| PATCH `:id`, DELETE `:id` | admin/teacher | ❌ |

### 1.9 Assignments (`/assignments`)
| Method | Path | Эрх | Frontend |
|---|---|---|---|
| POST `/assignments`, PATCH/DELETE `:id` | admin, teacher | ✅/⚠️ |
| POST `/assignments/upload` | admin, teacher | ✅ |
| GET `/assignments/my` | admin, teacher | ✅ |
| GET `/assignments/class/:id` | бүгд | ✅ (эцэг эх) ⚠️ (сурагч) |
| GET `/assignments/:id` | бүгд | ⚠️ |

### 1.10 Submissions (`/submissions`) — БҮГД ❌
| Method | Path | Эрх |
|---|---|---|
| POST `/submissions/assignment/:assignmentId` | student |
| GET `/submissions/mine` | student |
| GET `/submissions/assignment/:assignmentId` | teacher, admin |
| POST `/submissions/:id/grade` | teacher, admin |

### 1.11 Messages (`/messages`)
| Method | Path | Эрх | Frontend |
|---|---|---|---|
| POST `/messages` | admin, teacher, parent | ✅ |
| GET `/messages/conversations` | admin, teacher, parent | ✅ |
| GET `/messages/conversation/:otherUserId` | admin, teacher, parent | ⚠️ |
| PATCH read / read-all / read-bulk | admin, teacher, parent | ❌ |
| GET `/messages` (admin) | admin | ❌ |
| DELETE `:id` | admin, teacher, parent | ❌ |

> ⚠️ **Сурагч мессежийн эрхгүй** — backend `student`-ийг оруулаагүй. Сурагчид багштай чатлахыг хүсвэл backend өөрчлөх шаардлагатай.

### 1.12 Notifications (`/notifications`) — БҮГД ❌
| Method | Path | Эрх |
|---|---|---|
| POST `/notifications` | admin, super_admin |
| GET `/notifications` (`?type=&is_read=&limit=&offset=`) | Auth |
| PATCH `:id/read`, `read-all` | Auth |
| DELETE `:id` | Auth |

### 1.13 Announcements (`/announcements`) — БҮГД ❌
| POST / GET / POST :id/read / GET :id/reads |

### 1.14 Analytics (`/analytics`) — БҮГД ❌
| GET `/analytics/class/:id/performance` · `/class/:id/attendance` · `/students/at-risk` · `/school/dashboard` |

### 1.15 Calendar (`/calendar`) — БҮГД ❌
| POST/DELETE `/calendar/timetable` · GET `/timetable/class/:id` · GET `/timetable/mine` · POST/GET/DELETE `/events` |

### 1.16 Files (`/files`) — БҮГД ❌
| POST `/files` · GET `:id` · GET `:id/download` · DELETE `:id` |

### 1.17 Parent-Student (`/parent-student`)
| GET `/my-children` ✅ · бусад admin CRUD ❌ |

---

## 2. Frontend view-үүдийн одоогийн байдал

### Багш (Teacher)
| View | Файл | Төлөв |
|---|---|---|
| Overview | `teacher/views/overview.tsx` | ✅ Холбогдсон |
| Attendance | `teacher/views/attendance.tsx` | ⚠️ Бүртгэдэг; харах/засах дутуу |
| Grades | `teacher/views/grades.tsx` | ✅ |
| Assignments | `teacher/views/assignments.tsx` | ✅ (+ илгээлт харах дутуу) |
| Messages | `teacher/views/messages.tsx` | ✅ (read-mark дутуу) |
| **Schedule** | `teacher/views/schedule.tsx` | ❌ Hardcoded — `/calendar` алга |
| **Reports** | `teacher/views/reports.tsx` | ❌ Mock — `/analytics` алга |
| **Settings** | `teacher/views/settings.tsx` | ❌ Static |

### Сурагч (Student)
| View | Төлөв |
|---|---|
| Overview | ✅ |
| AI Chat | ✅ (Gemini) |
| AI Tutor / Career | ⏸️ Дараа (хүсэлтээр хойшлуулсан) |
| **Schedule** | ❌ Placeholder — `/calendar/timetable/mine` алга |
| **Messages** | ❌ Placeholder (+ backend эрх алга) |
| **Submissions** | ❌ Огт алга — даалгавар илгээх боломжгүй |

### Эцэг эх (Parent)
| View | Төлөв |
|---|---|
| Overview / Grades / Attendance / Messages | ✅ Бүгд холбогдсон |

### Админ / Супер админ (нэг shell ашигладаг)
| View | Төлөв |
|---|---|
| Overview | ✅ (гэхдээ `/analytics/school/dashboard` ашиглаагүй) |
| **Users** | ⚠️ Зөвхөн жагсаалт — **нэмэх/урих алга** |
| **Classes** | ⚠️ Зөвхөн жагсаалт — **үүсгэх/засах алга** |
| **Reports** | ❌ Placeholder |
| **Settings** | ❌ Placeholder |
| **Super admin тусгай UI** | ❌ Сургууль бүртгэх/удирдах огт алга |

---

## 3. Хийх ажлууд — Тэргүүлэх дарааллаар

> AI Tutor болон Career-ийг (хүсэлтийн дагуу) ХАМГИЙН СҮҮЛД хийнэ.

### ✅ PHASE A — Onboarding урсгал (ДУУССАН)
> Энэгүйгээр систем бодит ашиглагдахгүй. super_admin → админ → багш → сурагч.

- [x] **A1.** `api.ts`-д wrapper нэмэх: `registrationApi`, `invitationsApi`, `schoolsApi`, `usersApi`, `classesApi`, `studentsApi` + 17 модулийн typed wrapper + `uploadFile`
- [x] **A2.** **Урилга accept хуудас** (`/invite/[token]`) — Public. Токен preview → нэр/нууц үг → данс үүсгэх.
- [x] **A3.** **Admin → Users** — Tabs (Хэрэглэгчид/Урилгууд), урих модал (role+анги), урилга жагсаалт + цуцлах + холбоос хуулах
- [x] **A4.** **Admin → Сурагч** — анги дотроос нэмэх/устгах (Sheet дотор)
- [x] **A5.** **Admin → Анги CRUD** UI (grid card + засах/устгах + дэлгэрэнгүй Sheet)
- [x] **A6.** **Super admin Сургуулиуд** — бүртгэх (`POST /registration/school`) + идэвхжүүлэх/идэвхгүй + тусдаа nav
- [ ] **A7.** **Parent-Student холбоо** удирдах (admin) — `POST /parent-student` *(хойшлуулсан, доод ач холбогдол)*

> #### 🟢 ГҮЙЦЭТГЭЛИЙН ТЭМДЭГЛЭЛ (2026-06-25)
> **Status:** Phase A бүрэн хийгдсэн · `tsc --noEmit` цэвэр · `next build` **exit 0**.
>
> **Үүсгэсэн/өөрчилсөн файлууд:**
> - `src/lib/api.ts` — 17 модулийн typed wrapper, бүх DTO/response type, `uploadFile` (multipart), 401 refresh-аар дамждаг
> - `src/app/invite/[token]/page.tsx` — урилга accept (split-panel, preview, хүчингүй/хугацаа дууссан төлөв)
> - `src/components/dashboard/admin/views/users.tsx` — Tabs + InviteDialog + урилга revoke/copy
> - `src/components/dashboard/admin/views/classes.tsx` — анги CRUD + ClassDetailSheet + StudentDialog
> - `src/components/dashboard/admin/views/schools.tsx` — SuperAdminSchools + RegisterSchoolDialog
> - `src/components/dashboard/admin/admin-shell.tsx` — super_admin nav (Сургуулиуд), SidebarContent fix
> - `src/app/page.tsx` — `schools` view wiring
>
> **Дизайн/чанар:**
> - React 19 lint (`set-state-in-effect`, `static-components`) бүгд зассан — lazy initializer + key-remount хэв маяг
> - **Товчны өнгөний систем** ([cross-cutting](#4-х-нд-х-нд-л-н-огтлох-cross-cutting-сайжруулалт)): `amber`=хуудас CTA, `success`=идэвхжүүлэх/баталгаажуулах, `destructive`=устгах/цуцлах
>
> **Бодитоор ажиллах урсгал:** super_admin → сургууль бүртгэх → холбоос → админ нэвтрэх → багш урих → accept → анги үүсгэх → сурагч нэмэх. ✅ Гинж бүрэн.
>
> **Урьдчилсан нөхцөл:** super_admin-аар нэвтрэхийн тулд backend дээр `npm run seed:superadmin` ажиллуулна (`superadmin@educonnect.mn` / `SuperAdmin@2026`).

### ✅ PHASE B — Үндсэн дутуу хэсгүүд (ДУУССАН)
- [x] **B1.** **Calendar/Schedule:** багшийн `schedule.tsx` → 7 хоногийн засварладаг хүснэгт (`/calendar/timetable`); сурагч `schedule.tsx` → `/timetable/mine` + эвентүүд.
- [x] **B2.** **Analytics:** багш `reports.tsx` → class performance + ирц + at-risk (recharts); admin `reports.tsx` → `/analytics/school/dashboard` + at-risk жагсаалт.
- [x] **B3.** **Submissions:** сурагч илгээх (`/submissions/assignment/:id` + файл `/files`); багш илгээлт харах + дүгнэх (assignments Sheet).
- [x] **B4.** **Attendance:** багшийн ангийн ирц/статистик/байнга тасалдагсад analytics reports-д багтсан. *(Сурагчийн өөрийн ирц — RBAC-аар student `/students`-д хандах эрхгүй тул хязгаартай, §5 үзнэ үү.)*
- [x] **B5.** **Notifications хонх:** `NotificationBell` бодит `GET /notifications` + dropdown + read/read-all + 60с polling. DashboardShell ба admin-shell-д суулгав.
- [x] **B6.** **Announcements:** `AnnouncementsView` — бүх role харах + admin/багш үүсгэх + уншсан тэмдэглэх. Бүх shell-д nav нэмэв.

> #### 🟢 ГҮЙЦЭТГЭЛИЙН ТЭМДЭГЛЭЛ — Phase B (2026-06-25)
> **Status:** B1–B6 бүрэн · `next build` **exit 0**. Үүсгэсэн: `teacher/views/schedule.tsx` (rewrite), `student/views/schedule.tsx`, `student/views/submissions.tsx`, `teacher/views/assignments.tsx` (submissions Sheet нэмэв), `teacher/views/reports.tsx` (rewrite, recharts), `admin/views/reports.tsx`, `notification-bell.tsx`, `announcements-view.tsx`. Бүх shell-д Хуваарь/Даалгавар/Зарлал nav нэмэв.

### ✅ PHASE C — Гүйцэтгэлийг сайжруулах (ИХЭНХ ДУУССАН)
- [~] **C1.** **Messages polish:** send/list/conversation ажиллаж байна; read-marking/delete/real-time нь жижиг polish-оор үлдсэн.
- [ ] **C2.** **Сурагчийн messages** — backend `student` эрхгүй (§5). Backend шийдвэр хүлээж байна.
- [x] **C3.** **Settings:** `AccountSettings` — профайл засах (`PATCH /users/:id`), **идэвхтэй сессүүд** (`/auth/sessions`, revoke, logout-all), **имэйл баталгаажуулалт**. Teacher+admin settings-д суулгав.
- [x] **C4.** **Google login** — login хуудсанд товч (`/auth/google`) + `/auth/google/success` callback хуудас (Suspense-тэй, токен URL-аас уншина).
- [~] **C5.** **Файл татах:** submissions-д upload (`/files`) ажиллаж байна; ерөнхий download компонент polish-оор үлдсэн.

### 🟢 PHASE D — Сүүлд (хүсэлтийн дагуу)
- [ ] **D1.** AI Tutor-ийг backend Gemini provider дээр холбох (одоо frontend туршилт)
- [ ] **D2.** Career хуудсыг бодит дата дээр (backend `careers` модуль хийгдсэн дараа)

---

## 4. Хөндлөн огтлох (cross-cutting) сайжруулалт

- [x] **`api.ts`-д бүх модулийн typed wrapper** төвлөрүүлэх — 17 модулийн wrapper нэмэгдсэн (Phase A).
- [x] **Товчны өнгөний систем (үйлдлээр)** — `button.tsx`-д `amber`, `success`, `destructive-solid` variant нэмэв. Хэрэглээ: `amber`=хуудасны үндсэн CTA (урих/нэмэх/бүртгэх), `success`=эерэг (идэвхжүүлэх/баталгаажуулах), `destructive`=аюултай (устгах/цуцлах), `default(navy)`=форм submit, `outline`=болих. Shared Button учир бүх хуудсанд үйлчилнэ.
- [x] **Role-based nav** — super_admin-д тусдаа nav (Сургуулиуд) нэмэгдсэн (Phase A). *(Бүрэн тусдаа shell хэрэгтэй бол дараа.)*
- [ ] **Алдаа/хоосон/ачааллах төлөв** жигдрүүлэх (одоо зарим view `.catch(() => null)` чимээгүй залгидаг — хэрэглэгчид алдаа харагдахгүй).
- [x] **`unreadNotifications` hardcoded** — `NotificationBell` бодит API-аар сольсон (B5).
- [x] **Токен 401 refresh** `api.ts`-д бий ✅ — шинэ wrapper-ууд үүгээр дамждаг.
- [x] **Орчны хувьсагч:** `API_BASE` нь `NEXT_PUBLIC_API_URL ?? localhost:3001` болсон; `GOOGLE_AUTH_URL` export нэмэв.

---

## 5. Backend талд гарсан тэмдэглэл (frontend-д нөлөөлөх)

- **Сурагч messages эрхгүй** (`/messages` нь admin/teacher/parent). Сурагчийн чат хэрэгтэй бол backend засна.
- **Урилгад `student` role байхгүй** — сурагч нь "Student бичлэг"-ээр үүснэ, имэйл урилгаар биш. UI үүнийг тусгана.
- **super_admin** ихэнх admin endpoint-д `@Roles('admin')`-аар хязгаарлагдсан — super_admin-д тусдаа эрх/урсгал төлөвлөх.
- **Grade/Attendance entity-д `school_id` байхгүй** — class_id-аар scope хийдэг (frontend-д шууд нөлөөгүй, мэдэхэд хэрэгтэй).

---

## 6. Санал болгож буй гүйцэтгэлийн дараалал (нэг мөрөөр)

**A (onboarding) → B (calendar/analytics/submissions/notifications) → C (settings/messages бүрэн) → D (AI/career).**

> Эхлэх цэг: **A1 (api.ts wrapper) + A2 (accept хуудас) + A3 (урих UI)** — энэ гурав хийгдсэнээр систем эхний удаа "бодит" болж, бусад өгөгдөл бодитоор орж ирж эхэлнэ.
