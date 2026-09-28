# EduConnect Mongolia

EduConnect Mongolia нь Монгол Улсын хувийн ерөнхий боловсролын сургуулийн ахлах ангийн (10–12) сурагчдад зориулсан **олон түрээслэгчтэй (multi-tenant) B2B2C SaaS платформ** юм.

Систем нь сургуулийн удирдлага, багш, сурагч болон эцэг эхийн өдөр тутмын үйл ажиллагааг нэг платформд төвлөрүүлж, сургалтын удирдлага болон AI-д суурилсан хувийн сургалтын боломжуудыг нэгтгэдэг.

## Системийн ерөнхий бүтэц

EduConnect нь хэрэглэгчийн эрх, сургуулийн харьяалалд үндэслэн өгөгдөл болон үйлдлийг тусгаарлах бүтэцтэй.

Системийн үндсэн хэрэглэгчийн дүрүүд:

* `super_admin` — платформын түвшний удирдлага
* `admin` — сургуулийн удирдлага
* `teacher` — багш
* `student` — сурагч
* `parent` — эцэг эх

Систем нь multi-tenant архитектур ашигладаг бөгөөд сургуулийн түвшний өгөгдлийг `school_id`-ээр тусгаарладаг.

## Үндсэн функциональ боломжууд

### Сургуулийн удирдлага

* Хэрэглэгч болон эрхийн удирдлага
* Сурагч, анги, хичээлийн удирдлага
* Excel файлаар сурагчдыг бөөнөөр импортлох
* Хэрэглэгч урих болон бүртгэл удирдах
* Хичээлийн жил, улирлын удирдлага
* Сургуулийн тайлан болон аналитик

### Багш

* Хичээл болон анги удирдах
* Ирц бүртгэх
* Дүн бүртгэх болон жигнэсэн дундаж тооцох
* Даалгавар үүсгэх, хүлээн авах, дүгнэх
* Хичээлийн материал байрлуулах
* Эцэг эхтэй харилцах
* Сурагчийн гүйцэтгэлийн тайлан харах
* AI асуултын санг хянах, баталгаажуулах

### Сурагч

* Хичээлийн хуваарь
* Даалгавар хүлээн авах болон илгээх
* Хичээлийн материал ашиглах
* Дүн болон ирц харах
* Сургалтын ахиц хянах
* AI-д суурилсан сургалтын систем ашиглах

### Эцэг эх

* Хүүхдийн ирц харах
* Дүн болон сургалтын ахиц хянах
* Багштай харилцах
* Сурагчийн эрсдэлийн үзүүлэлтүүдийг харах

### Харилцаа холбоо

Систем нь Socket.IO ашиглан real-time харилцааг хэрэгжүүлдэг.

Үүнд:

* Хувийн мессеж
* Conversation
* Зарлал
* Мэдэгдэл
* Мессеж болон зарлалын уншсан төлөв

багтана.

## AI сургалтын систем

EduConnect-ийн AI сургалтын хэсэг нь сурагчийн мэдлэгийн түвшинг тодорхойлж, сул сэдэвт үндэслэн дараагийн сургалтын агуулгыг санал болгох зориулалттай.

Одоогийн хэрэгжилтийн үндсэн чиглэл нь **Математик 11-р анги** юм.

### Диагностик үнэлгээ

Сурагч тодорхой сэдвээр диагностик тест өгнө.

Дэмжигдэх хэлбэрүүд:

* Сонгох хариулттай асуулт
* Нээлттэй хариулттай асуулт
* Түвшин өөрчлөгдөх боломжтой асуултууд
* Сэдэв тус бүрийн гүйцэтгэлийн үнэлгээ

### Үнэлгээ

Сонгох хариулттай асуултыг детерминист аргаар шалгана.

Нээлттэй хариултыг AI-д суурилсан rubric ашиглан үнэлэх боломжтой бөгөөд багшийн хяналт, баталгаажуулалтын давхарга ашиглана.

### Алдаанд суурилсан сургалт

Үнэлгээний үр дүнгээр сурагчийн сул сэдвүүдийг тодорхойлж, тухайн сэдэвт чиглэсэн сургалтын дараалал үүсгэнэ.

Ерөнхий урсгал:

```text
Үнэлгээ
   ↓
Алдаатай сэдэв тодорхойлох
   ↓
Ойлголтын тайлбар
   ↓
Бодсон жишээ
   ↓
Дадлага
   ↓
Дахин үнэлгээ
```

### Сургалтын ахиц

Систем дараах үзүүлэлтүүдийг бүртгэнэ:

* Сэдвийн эзэмшилт
* Ахицын тренд
* Дадлагын түүх
* Streak
* Spaced repetition-тэй холбоотой мэдээлэл
* Сэдэв түвшний learning gap

### Багшийн хяналт

Багш:

* AI үүсгэсэн асуултыг шалгах
* Асуултын санг баталгаажуулах
* Ангийн learning gap харах
* Сурагчдын гүйцэтгэлийг шинжлэх

боломжтой.

Асуултын сангийн үндсэн урсгал:

```text
AI үүсгэнэ
    ↓
Багш хянана
    ↓
Баталгаажсан асуултын сан
    ↓
Сурагчийн үнэлгээ
    ↓
Гүйцэтгэлийн өгөгдөл
    ↓
Learning gap шинжилгээ
```

AI сургалтын шийдэл нь mastery learning, retrieval practice, worked-example effect, misconception-driven remediation болон spaced repetition зэрэг сургалтын зарчмуудыг архитектурын түвшинд ашиглахаар төлөвлөгдсөн.

## Системийн архитектур

EduConnect-ийн backend нь **modular monolith** архитектуртай.

Frontend болон backend нь тусдаа application хэлбэрээр ажиллана.

```text
Хэрэглэгч
    │
    ▼
Next.js Frontend
    │
    ├── REST API
    │
    └── WebSocket
            │
            ▼
       NestJS Backend
            │
            ├── Authentication
            ├── Authorization
            ├── School Management
            ├── Academic Management
            ├── Communication
            ├── Analytics
            ├── AI Learning Tutor
            └── Career Services
                    │
                    ▼
                PostgreSQL
```

## Multi-Tenant архитектур

Сургуулийн түвшний entity-үүдэд `school_id` ашиглан tenant тусгаарлалтыг хэрэгжүүлдэг.

Authenticated хэрэглэгчийн хүсэлт боловсруулах үед тухайн хэрэглэгчийн харьяалагдах сургуулийн хүрээнд өгөгдөл шүүгдэнэ.

Архитектурын хувьд дараах өгөгдлийг ялгана:

* Platform-level өгөгдөл
* School-level өгөгдөл
* User-level өгөгдөл
* Global өгөгдөл

`exams` болон `exam_attempts` зэрэг нийтийн шалгалтын өгөгдөл нь cross-school үйл ажиллагааг дэмжих зорилгоор global байдлаар ажиллана.

## Authentication ба Authorization

Нэвтрэлт нь JWT access token болон refresh token ашигладаг.

Мөн Google OAuth дэмжигдсэн.

Эрхийн хяналтыг RBAC загвараар хэрэгжүүлнэ.

```text
Request
   │
   ▼
JWT Authentication
   │
   ▼
Role Validation
   │
   ▼
Ownership / Tenant Validation
   │
   ▼
Controller
   │
   ▼
Service
   │
   ▼
Database
```

Backend талд дараах механизм ашиглагдана:

* `JwtAuthGuard`
* `RolesGuard`
* `@Roles()`
* `@CurrentUser()`
* `OwnershipService`

## API

Backend API нь versioning ашиглан дараах үндсэн prefix-тэй:

```text
/api/v1
```

Үндсэн domain module-ууд:

```text
/auth
/schools
/users
/students
/classes
/subjects
/grades
/attendance
/assignments
/submissions
/materials
/messages
/notifications
/calendar
/files
/analytics
/ai
/exams
/careers
```

API баримтжуулалтад Swagger ашиглана.

## Технологийн стек

### Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS v4
* shadcn/ui
* Radix UI
* Recharts
* KaTeX
* Socket.IO Client
* `date-fns`
* `next-themes`

Frontend нь Next.js App Router ашиглана.

API хүсэлтүүдийг төвлөрсөн API client-ээр дамжуулж, JWT token болон token refresh үйлдлийг нэг түвшинд удирдана.

### Backend

* NestJS 11
* Node.js
* TypeScript
* TypeORM
* PostgreSQL
* JWT
* Passport
* Google OAuth
* Socket.IO
* Class Validator
* Class Transformer

Нийтлэг backend infrastructure:

* Helmet
* CORS
* Rate limiting
* Idempotency
* Audit logging
* Health check
* Scheduled jobs
* Sentry

### AI

AI үйлчилгээнд Google Gemini ашиглана.

AI хэсгийн үндсэн үйлдлүүд:

* Диагностик үнэлгээ үүсгэх
* AI-assisted үнэлгээ
* Сургалтын тайлбар
* Hint үүсгэх
* Алдаанд суурилсан хичээл үүсгэх
* Learning gap шинжилгээ
* Карьерын зөвлөмж

AI гаралтыг curriculum болон системийн өгөгдлөөр grounding хийх зарчим баримтална.

### File Storage

Файл хадгалалтын abstraction нь дараах storage provider-уудыг дэмжихээр зохион байгуулагдсан:

* AWS S3
* Cloudflare R2
* Local storage

Development орчинд local storage ашиглах боломжтой.

## Өгөгдлийн сан

PostgreSQL нь системийн үндсэн relational database юм.

Өгөгдлийн үндсэн домэйнүүд:

```text
Core
├── schools
├── users
├── students
├── classes
└── terms

Academic
├── subjects
├── subject_enrollments
├── grades
├── attendance
├── assignments
├── submissions
└── materials

Communication
├── messages
├── announcements
├── announcement_reads
└── notifications

Scheduling
├── calendar_events
└── timetable_slots

AI Learning
├── ai_assessments
├── ai_lessons
├── question_bank
├── curriculum_units
└── curriculum_topics

Career
├── careers
├── career_profiles
├── career_recommendations
├── career_coach_sessions
└── university_programs

Examinations
├── exams
└── exam_attempts

System
├── audit_logs
└── idempotency_records
```

Database schema-ийн өөрчлөлтийг TypeORM migration-ээр удирдана.

Production орчинд автомат `synchronize` ашиглахгүй.

## Аюулгүй байдал

Системийн аюулгүй байдлыг олон түвшинд хэрэгжүүлсэн.

* JWT authentication
* Refresh token
* Role-based authorization
* Multi-tenant isolation
* Ownership validation
* `bcrypt` password hashing
* Helmet
* CORS
* Rate limiting
* Request validation
* Idempotency protection
* Audit logging
* Sentry error monitoring

Multi-tenant тусгаарлалтыг service болон data access түвшинд хэрэгжүүлж, нэг сургуулийн хэрэглэгч өөр сургуулийн өгөгдөлд хандахаас хамгаална.

## Real-Time архитектур

Real-time functionality-д Socket.IO ашиглана.

Үндсэн хэрэглээ:

* Хувийн мессеж
* Conversation update
* Notification
* Багш–сурагчийн харилцаа
* Багш–эцэг эхийн харилцаа

Ердийн CRUD болон бизнес логикийн үндсэн үйлдлүүд REST API-ээр дамжина.

## Deployment

Frontend болон backend нь тусдаа deployment хийцтэй.

### Frontend

```text
Next.js
   ↓
Vercel
```

### Backend

```text
NestJS
   ↓
Railway
   ↓
PostgreSQL
```

Backend нь Docker ашиглан container хэлбэрээр deploy хийх боломжтой.

Орчны тохиргоог environment variable-уудаар удирдана.

```env
DATABASE_URL=
JWT_SECRET=
GEMINI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STORAGE_PROVIDER=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
SENTRY_DSN=
```

## Development орчин

Frontend dependency суулгах:

```bash
npm install
```

`.env.local` файлд backend API хаягийг тохируулна:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Development server ажиллуулах:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Backend нь тусдаа NestJS application хэлбэрээр ажиллана.

## Production Build

Production build үүсгэх:

```bash
npm run build
```

Production server ажиллуулах:

```bash
npm run start
```

Deployment процессыг Git repository-ийн үндсэн branch-тэй холбон автоматжуулах боломжтой.

## Төслийн одоогийн төлөв

Одоогийн хэрэгжилтэд сургуулийн үндсэн удирдлага, академик үйл ажиллагаа, multi-tenant архитектур, RBAC, real-time communication, AI Learning Tutor болон нийтийн шалгалтын үндсэн функциональ боломжууд багтсан.

Дараагийн хөгжүүлэлтийн үе шатанд production infrastructure, AI evaluation, curriculum-ийн хамрах хүрээ, системийн тест болон нэмэлт сургалтын боломжуудыг өргөтгөхөөр төлөвлөсөн.

## Лиценз

Хувийн төсөл. Бүх эрх хуулиар хамгаалагдсан.

EduConnect Mongolia нь Монголын боловсролын байгууллагуудын сургалтын болон удирдлагын үйл ажиллагааг нэг системд төвлөрүүлэх зорилготой.
