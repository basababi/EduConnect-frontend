import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/v1/chat/completions";
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const SCHOOL_API =
  process.env.SCHOOL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

// Зардал/урвуулан ашиглалтаас хамгаалах хязгаар
const MAX_HISTORY = 20;
const MAX_MESSAGE_CHARS = 4000;

interface ToolCall {
  id: string;
  type?: string;
  function?: { name?: string; arguments?: string };
}

interface ChatMsg {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface AuthedUser {
  id: number;
  role: string;
  school?: { features?: Record<string, boolean> | null } | null;
}

interface SubjectAverage {
  subject: string;
  average_percentage: number;
}

const SYSTEM_PROMPT =
  "Чи бол EduConnect сургалтын платформын найрсаг сурган хүмүүжүүлэх туслах. " +
  "Монгол хэлээр товч, эелдэг хариул. Цаг агаарын асуултад get_weather ашигла. " +
  "Сурагч өөрийн дүнгээ асуувал get_my_grades ашиглаад, дүнг нь хараад товч, " +
  "урам зоригтой зөвлөгөө өг (сул хичээлийг онцол).\n\n" +
  "СУРГАЛТЫН ЧУХАЛ ДҮРЭМ — сурагч даалгавар, бодлого, шалгалтын асуулт, эсвэл " +
  "'энэ асуултын хариу юу вэ / бодоод өгөөч' гэж асуувал ХАРИУГ ШУУД БҮҮ ӨГ. " +
  "Оронд нь багш шиг заа: (1) эхлээд сурагчаар өөрөөр нь бодуулж, юу ойлгосныг нь асуу; " +
  "(2) шаардлагатай ойлголт/томьёог сануул, жижиг сэжүүр өг; " +
  "(3) сурагч оролдсоны дараа алхам алхмаар удирд, гэхдээ ЭЦСИЙН ХАРИУГ өөрөөр нь " +
  "бодуулж гарга. Зорилго нь суралцахад туслах, хариуг хуулуулах биш. " +
  "Хэрэв сурагч зүгээр ойлголт/жишээ асуувал (даалгавраа биш) чөлөөтэй тайлбарла. " +
  "Ерөнхий ярианд (даалгавартай холбоогүй) энгийн туслах хэвээр бай.";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Тухайн хотын одоогийн цаг агаарын мэдээллийг авах",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "Хотын нэр англиар (ж: Ulaanbaatar, London)",
          },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_grades",
      description:
        "Нэвтэрсэн сурагчийн өөрийн дүнгийн дундаж, хичээл бүрийн дүнг авах",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

/**
 * Хүсэлтийг backend-ээр баталгаажуулна. JWT-г энд decode хийгээд итгэхгүй —
 * гарын үсэг, хүчинтэй хугацаа, token_version-ийг зөвхөн backend шалгаж чадна.
 */
async function authenticate(
  req: NextRequest,
): Promise<{ user: AuthedUser; token: string } | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  try {
    const res = await fetch(`${SCHOOL_API}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return { user: (await res.json()) as AuthedUser, token };
  } catch {
    return null;
  }
}

async function getWeather(location: string): Promise<string> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return JSON.stringify({ error: "Цаг агаарын API key тохируулаагүй." });
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      location,
    )}&appid=${key}&units=metric&lang=mn`;
    const res = await fetch(url);
    if (res.status === 401) {
      return JSON.stringify({
        error: "Цаг агаарын API key буруу эсвэл идэвхжээгүй байна (засах).",
      });
    }
    if (!res.ok) {
      return JSON.stringify({ error: `"${location}" хот олдсонгүй. Англиар бичнэ үү.` });
    }
    const d = await res.json();
    return JSON.stringify({
      location: d.name,
      temp_c: Math.round(d.main?.temp),
      feels_like_c: Math.round(d.main?.feels_like),
      description: d.weather?.[0]?.description,
      humidity: d.main?.humidity,
      wind_ms: d.wind?.speed,
    });
  } catch {
    return JSON.stringify({ error: "Цаг агаарын мэдээ татахад алдаа гарлаа." });
  }
}

async function getMyGrades(userId: number, token: string): Promise<string> {
  try {
    const res = await fetch(
      `${SCHOOL_API}/api/v1/grades/student/${userId}/average`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (res.status === 401) {
      return JSON.stringify({ error: "Нэвтрэлт хүчингүй болсон. Дахин нэвтэрнэ үү." });
    }
    if (!res.ok) {
      return JSON.stringify({ error: `Дүн авахад алдаа (${res.status}).` });
    }
    const d = await res.json();
    const bySubject: SubjectAverage[] = d.by_subject ?? [];
    return JSON.stringify({
      average_percentage: d.average_percentage,
      total_grades: d.total_grades,
      subjects: bySubject,
      weak_subjects: bySubject
        .filter((s) => s.average_percentage < 60)
        .map((s) => s.subject),
    });
  } catch {
    return JSON.stringify({ error: "Дүнгийн мэдээ татахад алдаа гарлаа." });
  }
}

async function callGemini(messages: ChatMsg[], withTools: boolean) {
  const payload: Record<string, unknown> = { model: MODEL, messages, temperature: 0.6 };
  if (withTools) {
    payload.tools = TOOLS;
    payload.tool_choice = "auto";
  }
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini error ${res.status}: ${detail}`);
  }
  return res.json();
}

/** Клиентээс зөвхөн user/assistant мессеж авна — system/tool үүргийг хуурамчаар оруулахаас сэргийлнэ. */
function sanitizeHistory(raw: unknown): ChatMsg[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMsg[] = [];
  for (const m of raw) {
    const role = (m as { role?: unknown })?.role;
    const content = (m as { content?: unknown })?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    out.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) });
  }
  return out.slice(-MAX_HISTORY);
}

export async function POST(req: NextRequest) {
  // 1) Нэвтрэлт — нэвтрээгүй хүн AI квот зарцуулж чадахгүй
  const auth = await authenticate(req);
  if (!auth) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }
  // 2) Эрх — зөвхөн AI Туслах идэвхжүүлсэн төвийн сурагч
  if (auth.user.role !== "student" || auth.user.school?.features?.ai_chat !== true) {
    return NextResponse.json(
      { error: "AI Туслах танай байгууллагад идэвхжээгүй байна" },
      { status: 403 },
    );
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI одоогоор тохируулагдаагүй байна" },
      { status: 503 },
    );
  }

  try {
    const body = await req.json();
    const history = sanitizeHistory(body?.messages);
    if (history.length === 0) {
      return NextResponse.json({ error: "Мессеж хоосон байна" }, { status: 400 });
    }

    const messages: ChatMsg[] = [{ role: "system", content: SYSTEM_PROMPT }, ...history];

    let data = await callGemini(messages, true);
    let msg: ChatMsg | undefined = data?.choices?.[0]?.message;

    if (msg?.tool_calls?.length) {
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        let result = JSON.stringify({ error: "Тодорхойгүй хэрэгсэл" });
        if (tc.function?.name === "get_weather") {
          let loc = "";
          try {
            loc = JSON.parse(tc.function.arguments ?? "{}").location ?? "";
          } catch {
            loc = "";
          }
          result = await getWeather(loc);
        } else if (tc.function?.name === "get_my_grades") {
          result = await getMyGrades(auth.user.id, auth.token);
        }
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          name: tc.function?.name,
          content: result,
        });
      }

      data = await callGemini(messages, false);
      msg = data?.choices?.[0]?.message;
    }

    const reply = (msg?.content ?? "").trim() || "Уучлаарай, хариу гаргаж чадсангүй.";
    return NextResponse.json({ reply });
  } catch (err) {
    // Дотоод алдааны дэлгэрэнгүйг (Gemini-ийн хариу г.м) клиент рүү задлахгүй
    console.error("[api/gemini]", err);
    return NextResponse.json({ error: "AI хариу өгөхөд алдаа гарлаа" }, { status: 500 });
  }
}
