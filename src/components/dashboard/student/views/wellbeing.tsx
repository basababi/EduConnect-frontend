"use client";

import { useEffect, useRef, useState } from "react";
import { Send, AlertCircle, Phone, Loader2, Heart, Bot, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type Emotion = "happy" | "sad" | "angry" | "anxious";

const EMOTIONS: { id: Emotion; label: string; emoji: string }[] = [
  { id: "happy", label: "Эвтэй", emoji: "😊" },
  { id: "sad", label: "Гутарсан", emoji: "😢" },
  { id: "angry", label: "Уурласан", emoji: "😠" },
  { id: "anxious", label: "Түгшсэн", emoji: "😰" },
];

const EMOTION_LABELS: Record<Emotion, string> = {
  happy: "Эвтэй",
  sad: "Гутарсан",
  angry: "Уурласан",
  anxious: "Түгшсэн",
};

const TOPICS = ["Буллинг", "Сэтгэл гутрал", "Шалгалтын стрес", "Гэр бүлийн асуудал"];

const CRISIS_KEYWORDS = ["үхмээр", "амиа", "тэвчихгүй", "үхье", "амь тас"];

// === Mock AI Сэтгэл зүйч ===
function mockCounselorResponse(
  userMessage: string,
  emotion: Emotion | null,
  topic: string | null,
): string {
  const lower = userMessage.toLowerCase();

  // Crisis
  if (CRISIS_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "Таны энэ мэдрэмжийг хүлээн зөвшөөрч байна. Энэ бол түр зуурын бөгөөд тусламж авах боломжтой. Одоо 108 утсанд залгана уу (Хүүхдийн утас, 24/7 үнэгүй). Та ганцаараа биш.";
  }

  // Bullying
  if (lower.includes("буллинг") || lower.includes("дээрэлх") || lower.includes("дарж")) {
    return `Буллингийн талаар ярьж байгаад танд баярлалаа. Энэ бол таны буруу биш. ${topic ? `Сонгосон сэдэв: ${topic}. ` : ""}Юу тохиолдож байгаа нь тодорхой хэлээд өгнө үү? Бид хамт шийдвэл болно.`;
  }

  // Depression / sad
  if (lower.includes("гутар") || lower.includes("урам") || lower.includes("гутр") || emotion === "sad") {
    return `Гутралын мэдрэмжийг хүлээн зөвшөөрч байна. ${emotion === "sad" ? "Та өнөөдөр гутарсан байна гэж сонгосон. " : ""}Жижиг зүйлээс эхэл: өнөөдөр нарны гэрэлд 10 минут явах, дуртай хоолоо идэх, итгэлтэй найзтайгаа ярих. Эдгээр мэдрэмж өнгөрнө.`;
  }

  // Stress / exam
  if (lower.includes("стрес") || lower.includes("шалгалт") || lower.includes("айж") || topic === "Шалгалтын стрес") {
    return `Шалгалтын стресийг мэдэрч байна. Амьсгалын дасгал хий: 4 секундын амьсгал, 4 секунд барих, 4 секунд гаргах. Энэ нь мэдрэлийн системийг тайвшруулна. Хамгийн хэцүү хичээлээ яриад өгнө үү?`;
  }

  // Family
  if (lower.includes("гэр бүл") || lower.includes("ээж") || lower.includes("аав") || lower.includes("хэрэлд") || topic === "Гэр бүлийн асуудал") {
    return `Гэр бүлийн асуудал хүнд байдаг. Та өөрийгөө буруутгах хэрэггүй. Эцэг эхтэйгээ ярих боломжгүй бол итгэлтэй том хүнээс (багш, нийгмийн ажилтан) тусламж гуйх хэрэгтэй. Та хэн дотроо ярихыг хүсч байна вэ?`;
  }

  // Anger
  if (emotion === "angry" || lower.includes("уур") || lower.includes("загна")) {
    return 'Уур хилэн — биеэр мэдэрдэг. Эхлээд амьсгалаа тоологт: 1-10 хүртэл. Дараа нь "Би 10 минут хүлээж байж шийдэе" гэж өөртөө хэлээрэй. Юу болсон бэ?';
  }

  // Anxious
  if (emotion === "anxious" || lower.includes("түгш") || lower.includes("айдас")) {
    return "Түгшүүр — биеийн хариу үйлдэл. Одоо 5-4-3-2-1 дасгал хийе: 5 зүйл хар, 4 зүйл сонс, 3 зүйл хүр, 2 үнэрлэ, 1 амтал. Юу танаас айлгаад байна?";
  }

  // Happy
  if (emotion === "happy" || lower.includes("баяр") || lower.includes("баярл")) {
    return "Энэ мэдрэмжийг сонсож байгаадаа таатай байна! Юу ингэж сайхан байгааг хуваалцана уу?";
  }

  // Default — gentle probing
  return `Таны хэлснийг сонсож байна. ${topic ? `Сонгосон сэдэв: ${topic}. ` : ""}Дэлгэрэнгүй ярьж өгнө үү? Юу бодогдож байна вэ?`;
}

function buildInitialMessage(emotion: Emotion | null, topic: string | null): string {
  let msg = "Сайн байна уу? Би таны хувийн сэтгэл зүйч. Яриа нь бүрэн хувийн шинжтэй — хадгалагдахгүй.";
  if (emotion) msg += ` Өнөөдөр таны сэтгэл хөдлөл: ${EMOTION_LABELS[emotion]}.`;
  if (topic) msg += ` Ярилцах сэдэв: ${topic}.`;
  msg += " Юу ярилцахыг хүсч байна вэ?";
  return msg;
}

function hasCrisisKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function StudentWellbeing() {
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: buildInitialMessage(null, null),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Эхний мессежийг emotion/topic өөрчлөгдөхөд шинэчилнэ
  useEffect(() => {
    setMessages([{ role: "assistant", content: buildInitialMessage(emotion, topic) }]);
  }, [emotion, topic]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");

    if (hasCrisisKeyword(text)) setShowCrisis(true);

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // === MOCK AI: төлөв шинжлэх + хариулт үүсгэх ===
    // Үг үгээр "streaming" хийж байгаа мэтээр үзүүлнэ
    const fullResponse = mockCounselorResponse(text, emotion, topic);
    const words = fullResponse.split(" ");
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    for (let i = 0; i < words.length; i++) {
      await new Promise((r) => setTimeout(r, 50));
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const chunk = i === 0 ? words[i] : " " + words[i];
        if (hasCrisisKeyword(words[i])) setShowCrisis(true);
        return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
      });
    }
    setIsLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-[#1B2B4B]">AI Сэтгэл Зүйч</h1>
        <p className="text-sm text-gray-500 mt-0.5">Хувийн яриа — хадгалагдахгүй, нууцлал баталгаатай</p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">
        {/* Crisis banner */}
        {showCrisis && (
          <div className="bg-red-600 text-white p-4 rounded-xl flex items-center gap-3 flex-shrink-0 shadow-lg">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Яаралтай тусламж шаардлагатай!</p>
              <p className="text-sm text-red-100">Та одоо 108 утсанд залгаарай (Хүүхдийн утас — 24/7 үнэгүй)</p>
            </div>
            <button
              onClick={() => setShowHelpModal(true)}
              className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap hover:bg-red-50 transition-colors"
            >
              Тусламж авах
            </button>
            <button onClick={() => setShowCrisis(false)} className="text-red-200 hover:text-white ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Emotion + Topic selector */}
        <div className="bg-white rounded-xl border p-4 flex-shrink-0">
          <p className="text-sm font-medium text-gray-600 mb-3">Одоо ямар байна вэ?</p>
          <div className="flex gap-2 flex-wrap">
            {EMOTIONS.map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => setEmotion(emotion === id ? null : id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  emotion === id
                    ? "bg-[#F5A623] border-[#F5A623] text-[#1B2B4B] shadow-sm"
                    : "border-gray-200 text-gray-600 hover:border-[#F5A623] hover:bg-amber-50"
                }`}
              >
                <span className="text-lg">{emoji}</span>
                {label}
              </button>
            ))}
          </div>

          <p className="text-sm font-medium text-gray-600 mt-4 mb-2">Сэдэв</p>
          <div className="flex gap-2 flex-wrap">
            {TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(topic === t ? null : t)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                  topic === t
                    ? "bg-[#1B2B4B] border-[#1B2B4B] text-white"
                    : "border-gray-200 text-gray-600 hover:border-[#1B2B4B] hover:bg-gray-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-[#1B2B4B] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Heart className="w-4 h-4 text-[#F5A623]" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#1B2B4B] text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-800 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                  {msg.role === "assistant" && i === messages.length - 1 && isLoading && (
                    <span className="inline-block w-1.5 h-4 bg-gray-400 ml-1 animate-pulse rounded-sm" />
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-[#F5A623] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-[#1B2B4B]" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>

        {/* Input */}
        <div className="flex gap-2 flex-shrink-0">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Юу санааж байна вэ? (Enter = илгээх)"
            className="resize-none min-h-[44px] max-h-32"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-[#1B2B4B] hover:bg-[#243d6b] text-white px-4 self-end"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400 flex-shrink-0">
          <Bot className="w-3 h-3 inline mr-1" />
          Энэ яриа хадгалагдахгүй. Яаралтай тусламж хэрэгтэй бол 108 утсанд залгана уу.
        </p>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-[#1B2B4B]">Тусламж авах</h2>
            </div>

            <div className="space-y-3">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-red-700 text-lg leading-none">108</p>
                  <p className="text-xs text-red-500 mt-0.5">Хүүхдийн утас — 24/7 үнэгүй</p>
                </div>
                <a
                  href="tel:108"
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Залгах
                </a>
              </div>

              <button className="w-full border-2 border-[#1B2B4B] text-[#1B2B4B] py-3 rounded-xl font-semibold hover:bg-[#1B2B4B] hover:text-white transition-colors text-sm">
                Сэтгэл зүйч захиалах
                <span className="ml-2 text-xs font-normal opacity-60">(Удахгүй)</span>
              </button>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-5 w-full text-gray-400 text-sm hover:text-gray-600 transition-colors"
            >
              Хаах
            </button>
          </div>
        </div>
      )}
    </div>
  );
}