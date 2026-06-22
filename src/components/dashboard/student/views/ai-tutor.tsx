"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, BookOpen, CheckCircle2, ChevronRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MATH_10TH_GRADE, type Topic } from "@/lib/curriculum";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function StudentAITutor() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSelectTopic(topic: Topic) {
    setSelectedTopic(topic);
    setMessages([
      {
        role: "assistant",
        content: `Та "${topic.name}" сэдвийг сонголоо. Боловсролын яамны стандартаар та ${topic.standard}\n\nБи танд алхам алхмаар зааж өгнө. Эхэлж ${topic.steps[0]}`,
      },
    ]);
    setCurrentStep(0);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // AI багшийн логик (Mock)
    let aiResponse = "";
    const lowerText = text.toLowerCase();

    if (lowerText.includes("ойлгохгүй") || lowerText.includes("тэгээд") || lowerText.includes("яагаад")) {
      aiResponse = "Зүгээрээ, арай гэж бодъё. Та надад яг аль хэсэг нь төвөгтэй байгааг хэлээч? Бид үүнийг маш амар болгох болно.";
    } else if (lowerText.includes("ойлголоо") || lowerText.includes("мэдлээ")) {
      const nextStep = currentStep + 1;
      if (nextStep < selectedTopic!.steps.length) {
        aiResponse = `Гайхалтай! Тэгвэл дараагийн алхам руу оръё:\n\n${selectedTopic!.steps[nextStep]}`;
        setCurrentStep(nextStep);
      } else {
        aiResponse = `Баяр хүргэе! Та "${selectedTopic!.name}" сэдвийн бүх агуулгыг амжилттай сурлаа. Одоо бид жинхэнэ бодлого бодож үзэх үү?`;
      }
    } else {
      // Бусад үед тухайн алхамыг дэлгэрэнгүй тайлбарлана
      aiResponse = `Таны асуулт маш сайн байна. ${selectedTopic!.steps[currentStep]} гэдгийг дэлгэрүүлье:\n\nЖишээ нь: x² - 5x + 6 = 0 тэгшитгэл авъя. Энд a=1, b=-5, c=6 гэж олж байна. Та өөрөө D-ийг олж үзэх үү?`;
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
      setIsLoading(false);
    }, 800);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* Зүүн тал: Сэдвийн жагсаалт (Стандарт) */}
      <div className="lg:w-80 flex-shrink-0 overflow-y-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-[#1B2B4B] flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#F5A623]" />
            10-р анги - Математик
          </h1>
          <p className="text-xs text-gray-500 mt-1">Боловсролын яамны стандартаар заавал үзэх агуулга</p>
        </div>

        <div className="space-y-3">
          {MATH_10TH_GRADE.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleSelectTopic(topic)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedTopic?.id === topic.id
                  ? "bg-[#1B2B4B] text-white border-[#1B2B4B] shadow-lg"
                  : "bg-white border-gray-200 hover:border-[#F5A623] hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className={`font-semibold text-sm ${selectedTopic?.id === topic.id ? "text-white" : "text-[#1B2B4B]"}`}>
                  {topic.name}
                </h3>
                {selectedTopic?.id === topic.id && <CheckCircle2 className="w-4 h-4 text-[#F5A623] flex-shrink-0" />}
              </div>
              <p className={`text-xs mt-1 ${selectedTopic?.id === topic.id ? "text-gray-300" : "text-gray-500"}`}>
                {topic.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Баруун тал: Чатны хэсэг */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[500px]">
        {!selectedTopic ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-[#1B2B4B]/5 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-[#1B2B4B]/40" />
            </div>
            <h2 className="text-lg font-semibold text-[#1B2B4B]">AI Хичээлийн Дагуул</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-xs">
              Зүүн талаас өөрт хэрэгтэй сэдвээ сонгоно уу. Би таны хоцрогдлыг арилгаж, багшийн оронд алхам алхмаар зааж өгнө.
            </p>
          </div>
        ) : (
          <>
            {/* Чат Header */}
            <div className="border-b px-6 py-3 flex items-center gap-2 bg-gray-50">
              <Badge className="bg-[#F5A623]/20 text-[#F5A623] border-0">10-р анги</Badge>
              <span className="font-semibold text-sm text-[#1B2B4B]">{selectedTopic.name}</span>
            </div>

            {/* Мессежүүд */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === "user" ? "bg-[#1B2B4B] text-white rounded-tr-sm" : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Оролтын хэсэг */}
            <div className="border-t p-4 bg-white">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Мэдэхгүй байгаа зүйлээ энд асуугаарай... (Эцэг эхээс асуух шаардлагагүй)"
                  className="resize-none min-h-[44px] max-h-32 border-gray-200 focus:border-[#1B2B4B]"
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
              <div className="flex items-center gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={() => setInput("Би энэ алхмыг ойлголоо, дараагийн алхам руу оръё")} className="text-xs text-gray-500">
                  Ойлголоо <ChevronRight className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setInput("Энэ хэсэг нь ойлгохгүй байна, дэлгэрэнгүй тайлбарлаж өгөөч")} className="text-xs text-gray-500">
                  Ойлгохгүй байна <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}