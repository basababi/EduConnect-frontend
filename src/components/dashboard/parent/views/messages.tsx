"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { api, type Conversation, type Message } from "@/lib/api";

export function ParentMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get<Conversation[]>("/messages/conversations")
      .then((data) => {
        setConversations(data);
        if (data.length > 0) setActiveConvId(data[0].user.id);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeConvId === null) return;
    api
      .get<Message[]>(`/messages/conversation/${activeConvId}`)
      .then(setMessages)
      .catch(() => null);
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending || activeConvId === null) return;
    setSending(true);
    try {
      const msg = await api.post<Message>("/messages", {
        receiver_id: activeConvId,
        content: text,
      });
      setMessages((prev) => [...prev, msg]);
      setInput("");
    } catch {
      // noop
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const activeConv = conversations.find((c) => c.user.id === activeConvId);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B2B4B]">Мессеж</h1>
        <p className="text-sm text-gray-500 mt-0.5">Багш нартай харилцах</p>
      </div>

      {conversations.length === 0 ? (
        <Card className="border-dashed flex-1">
          <CardContent className="flex flex-col items-center justify-center h-full py-12 gap-3">
            <MessageSquare className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-400">Харилцаа байхгүй байна</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Conversation list */}
          <div className="w-64 shrink-0 space-y-1">
            {conversations.map((c) => (
              <button
                key={c.user.id}
                onClick={() => setActiveConvId(c.user.id)}
                className={`w-full text-left rounded-xl p-3 transition-colors ${
                  activeConvId === c.user.id
                    ? "bg-[#1B2B4B] text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={`text-xs font-bold ${
                        activeConvId === c.user.id
                          ? "bg-[#F5A623] text-[#1B2B4B]"
                          : "bg-[#1B2B4B] text-white"
                      }`}
                    >
                      {c.user.first_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm font-medium truncate ${
                          activeConvId === c.user.id ? "text-white" : "text-[#1B2B4B]"
                        }`}
                      >
                        {c.user.first_name} {c.user.last_name}
                      </p>
                      {c.unread_count > 0 && (
                        <Badge className="bg-red-500 text-white text-[10px] h-4 px-1 ml-1 shrink-0">
                          {c.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        activeConvId === c.user.id ? "text-white/60" : "text-gray-400"
                      }`}
                    >
                      {c.user.role === "teacher" ? "Багш" : c.user.role}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Chat area */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            {activeConv && (
              <div className="border-b px-4 py-3 flex items-center gap-3 shrink-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-[#1B2B4B] text-white text-sm">
                    {activeConv.user.first_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-[#1B2B4B]">
                    {activeConv.user.first_name} {activeConv.user.last_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {activeConv.user.role === "teacher" ? "Багш" : activeConv.user.role}
                  </p>
                </div>
              </div>
            )}

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMine = msg.sender_id !== activeConvId;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                        isMine
                          ? "bg-[#1B2B4B] text-white rounded-tr-sm"
                          : "bg-gray-100 text-gray-800 rounded-tl-sm"
                      }`}
                    >
                      {msg.content}
                      <p className={`text-[10px] mt-1 ${isMine ? "text-white/50" : "text-gray-400"}`}>
                        {new Date(msg.created_at).toLocaleTimeString("mn-MN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </CardContent>

            <div className="border-t p-3 flex gap-2 shrink-0">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Мессеж бичих..."
                className="resize-none min-h-[40px] max-h-24 text-sm"
                rows={1}
                disabled={sending}
              />
              <Button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="bg-[#1B2B4B] hover:bg-[#243d6b] text-white px-3 self-end"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
