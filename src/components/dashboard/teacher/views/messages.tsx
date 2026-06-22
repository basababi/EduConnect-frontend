"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, MessageSquare } from "lucide-react";
import { api, type Conversation, type Message } from "@/lib/api";
import { toast } from "sonner";

export function TeacherMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get<Conversation[]>("/messages/conversations")
      .then((c) => setConversations(c))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      api
        .get<Message[]>(`/messages/conversation/${selectedUserId}`)
        .then(setMessages)
        .catch(() => setMessages([]));
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !selectedUserId) return;
    setSending(true);
    try {
      const msg = await api.post<Message>("/messages", {
        receiver_id: selectedUserId,
        content: newMsg,
      });
      setMessages((prev) => [...prev, msg]);
      setNewMsg("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Илгээж чадсангүй");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="h-96 animate-pulse rounded-xl bg-muted" />;

  return (
    <Card className="h-[calc(100vh-12rem)] overflow-hidden">
      <div className="flex h-full">
        {/* Conversations list */}
        <div className="w-64 border-r flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Хайх..." className="pl-9" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {conversations.map((c) => (
                <button
                  key={c.user.id}
                  onClick={() => setSelectedUserId(c.user.id)}
                  className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                    selectedUserId === c.user.id
                      ? "bg-primary/10"
                      : "hover:bg-muted"
                  }`}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {c.user.first_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {c.user.first_name} {c.user.last_name}
                      </p>
                      {c.unread_count > 0 && (
                        <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.last_message.content}
                    </p>
                  </div>
                </button>
              ))}
              {conversations.length === 0 && (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Харилцаа алга
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedUserId ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b p-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {conversations.find((c) => c.user.id === selectedUserId)?.user.first_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {conversations.find((c) => c.user.id === selectedUserId)?.user.first_name}{" "}
                    {conversations.find((c) => c.user.id === selectedUserId)?.user.last_name}
                  </p>
                  <p className="text-xs text-green-600">Онлайн</p>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {messages.map((m) => {
                  const isMe = m.sender_id !== selectedUserId;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border"
                        }`}
                      >
                        <p className="text-sm">{m.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(m.created_at).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Мессеж байхгүй
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
                <Input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  placeholder="Мессеж бичих..."
                  disabled={sending}
                />
                <Button type="submit" size="icon" disabled={sending || !newMsg.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Харилцаа сонгоно уу</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}