import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/v1/chat/completions";
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const SCHOOL_API = process.env.SCHOOL_API_URL ?? "http://localhost:3001";

interface ChatMsg {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

const SYSTEM_PROMPT =
  "Чи бол EduConnect сургуулийн платформын найрсаг туслах. " +
  "Монгол хэлээр товч, эелдэг хариул. Цаг агаарын асуултад get_weather ашигла. " +
  "Сурагч өөрийн дүнгээ асуувал get_my_grades ашиглаад, дүнг нь хараад товч, " +
  "урам зоригтой зөвлөгөө өг (сул хичээлийг онцол).";

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
        "Нэвтэрсэн сарагчийн өөрийн дүнгийн дундаж, хичээл бүрийн дүнг авах",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

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

function decodeUserId(token?: string): number | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString("utf8"),
    );
    return payload?.sub ?? null;
  } catch {
    return null;
  }
}

async function getMyGrades(token?: string): Promise<string> {
  const userId = decodeUserId(token);
  if (!token || !userId) {
    return JSON.stringify({ error: "Нэвтрээгүй байна. Дүн харахын тулд нэвтэрнэ үү." });
  }
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
    const bySubject = d.by_subject ?? [];
    return JSON.stringify({
      average_percentage: d.average_percentage,
      total_grades: d.total_grades,
      subjects: bySubject,
      weak_subjects: bySubject
        .filter((s: any) => s.average_percentage < 60)
        .map((s: any) => s.subject),
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

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY тохируулаагүй байна (.env.local)" },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const history: ChatMsg[] = body.messages ?? [];
    const userToken: string | undefined = body.token; 

    const messages: ChatMsg[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    let data = await callGemini(messages, true);
    let msg = data?.choices?.[0]?.message;

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
          result = await getMyGrades(userToken);
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI алдаа" },
      { status: 500 },
    );
  }
}
