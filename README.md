# EduConnect Mongolia

> Монголын ерөнхий боловсролын ахлах ангийн (10–12) хувийн сургуулиудад зориулсан
> **B2B2C сургуулийн удирдлагын SaaS платформ.** Сургуулийн удирдлага, багш, эцэг эх,
> сурагч — нэг платформ дээр. **AI хиймэл оюунд суурилсан хувийн багштай.**

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)

---

## ✨ Онцлог боломжууд

### 👨‍🏫 Багш
Хичээл үүсгэх · ирц бүртгэл (анги бүхэлд) · дүн + жигнэсэн дундаж · даалгавар ба дүгнэлт · хичээлийн материал · эцэг эхтэй real-time чат · тайлан

### 🎓 Сурагч
Хуваарь · даалгавар илгээх · хичээлийн материал · дүнгээ харах · **AI Tutor (хувийн багш)**

### 👨‍👩‍👧 Эцэг эх
Хүүхдийн дүн/ирц real-time хяналт · багштай чат · эрсдэлийн үнэлгээ

### 🏫 Админ / Супер админ
Хэрэглэгч урих/удирдах · анги/сурагч удирдах (Excel импорт) · олон сургуулийн удирдлага · тайлан

---

## 🤖 AI Tutor — гол ялгарал

Бодит сурах бичгийн агуулгад тулгуурласан **хувийн AI багш** (Математик 11 пилот):

- **Диагностик тест** — сэдэв сонгож, adaptive хүндрэлтэй тест (сонголттой + гараар бичих асуулт)
- **Ухаалаг үнэлгээ** — сонголттойг детерминист кодоор, нээлттэйг AI rubric-аар (багшийн баталгаатай)
- **Алдаанд суурилсан хичээл** — сул сэдэв бүрд тайлбар + бодсон жишээ + дадлага
- **Дэд ур чадварын gap** — юу мэдэхгүйг тодорхойлж, Монголын үнэлгээний стандартад буулгах
- **Ахицын хяналт** — эзэмшилтийн трэнд, streak, зайтай давталт
- **Багшийн хяналт** — question bank батлах, ангийн gap dashboard

> Сурах ухааны онолд суурилсан: mastery learning, retrieval practice, worked-example effect,
> misconception-driven remediation, spaced repetition.

---

## 🛠 Технологи

**Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · recharts · KaTeX · sonner

**Backend:** NestJS 11 · TypeORM · PostgreSQL · JWT + Google OAuth · Google Gemini (AI)

**Deploy:** Frontend → Vercel · Backend + DB → Railway

---

## 🏗 Архитектур

- **Multi-tenant** — сургууль бүр `school_id`-аар тусгаарлагдсан
- **RBAC** — super_admin / admin / teacher / parent / student дүрийн эрх
- **AI grounding-first** — бүх AI гаралт curriculum агуулгад тулгуурлана (hallucination-аас сэргийлнэ)
- **Question bank** — AI үүсгэнэ → багш батлана → зардал буурч чанар тогтворжино

---

## 🚀 Ажиллуулах (dev)

```bash
# Хамаарлыг суулгах
npm install

# Орчны хувьсагч (.env.local)
# NEXT_PUBLIC_API_URL=http://localhost:3001   # backend хаяг (/api/v1-гүй)

# Хөгжүүлэлтийн сервер
npm run dev
```

Апп `http://localhost:3000` дээр ажиллана. Backend (NestJS) тусдаа `EduConnect` repo-д.

## 📦 Build & Deploy

```bash
npm run build   # production build
npm run start   # production сервер
```

Vercel дээр автомат deploy (`main` салбар руу push хийхэд).

---

## 📄 Лиценз

Хувийн төсөл — бүх эрх хуулиар хамгаалагдсан.

*Монголын боловсролд зориулав.*
