"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Send, MessageSquare, Plus, BookOpen } from "lucide-react";
import {
  messagesApi,
  classesApi,
  getStoredUser,
  type Conversation,
  type Message,
} from "@/lib/api";
import { toast } from "sonner";

interface TeacherOption {
  id: number;
  first_name: string;
  last_name: string;
  className?: string;
}

export function StudentMessages() {
  const me = getStoredUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      messagesApi.conversations().catch(() => [] as Conversation[]),
      classesApi.list().catch(() => []),
    ])
      .then(([convs, classes]) => {
        setConversations(convs);
        // Багш нарыг ангиудаас гаргана (сурагч /users-д хандах эрхгүй)
        const map = new Map<number, TeacherOption>();
        for (const c of classes) {
          if (c.teacher) {
            map.set(c.teacher.id, {
              id: c.teacher.id,
              first_name: c.teacher.first_name,
              last_name: c.teacher.last_name,
              className: c.name,
            });
          }
        }
        setTeachers([...map.values()]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      messagesApi
        .conversation(selectedUserId)
        .then(setMessages)
        .catch(() => setMessages([]));
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  function openChat(userId: number, name: string) {
    setSelectedUserId(userId);
    setSelectedName(name);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !selectedUserId) return;
    setSending(true);
    try {
      const msg = await messagesApi.send({
        receiver_id: selectedUserId,
        content: newMsg,
      });
      setMessages((prev) => [...prev, msg]);
      setNewMsg("");
      // Шинэ харилцаа бол жагсаалтад нэмэгдэхийн тулд дахин татна
      messagesApi.conversations().then(setConversations).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Илгээж чадсангүй");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="m-6 h-[70vh] animate-pulse rounded-xl bg-muted" />;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Мессеж</h1>
          <p className="text-sm text-muted-foreground">Багш нартай харилцах</p>
        </div>
        <Button variant="amber" className="gap-2" onClick={() => setPickerOpen(true)}>
          <Plus className="h-4 w-4" />
          Шинэ харилцаа
        </Button>
      </div>

      <Card className="h-[calc(100vh-14rem)] overflow-hidden">
        <div className="flex h-full">
          {/* Conversations */}
          <div className="flex w-64 flex-col border-r">
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {conversations.map((c) => (
                  <button
                    key={c.user.id}
                    onClick={() => openChat(c.user.id, `${c.user.first_name} ${c.user.last_name}`)}
                    className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                      selectedUserId === c.user.id ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {c.user.first_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium">
                          {c.user.first_name} {c.user.last_name}
                        </p>
                        {c.unread_count > 0 && (
                          <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.last_message.content}
                      </p>
                    </div>
                  </button>
                ))}
                {conversations.length === 0 && (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    Харилцаа алга. &quot;Шинэ харилцаа&quot; дарж багштай холбогдоорой.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat */}
          <div className="flex flex-1 flex-col">
            {selectedUserId ? (
              <>
                <div className="flex items-center gap-3 border-b p-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {selectedName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">{selectedName}</p>
                </div>

                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
                  {messages.map((m) => {
                    const isMe = m.sender_id === me?.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isMe ? "bg-primary text-primary-foreground" : "border bg-background"
                          }`}
                        >
                          <p className="text-sm">{m.content}</p>
                          <p
                            className={`mt-1 text-[10px] ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                          >
                            {new Date(m.created_at).toLocaleTimeString("mn-MN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Мессеж бичиж эхлээрэй
                    </div>
                  )}
                </div>

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
              <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="mb-3 h-12 w-12 opacity-50" />
                <p className="text-sm">Харилцаа сонгоно уу</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Teacher picker */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Багш сонгох</DialogTitle>
            <DialogDescription>Холбогдох багшаа сонгоно уу.</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {teachers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Багш олдсонгүй
              </p>
            ) : (
              teachers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    openChat(t.id, `${t.first_name} ${t.last_name}`);
                    setPickerOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {t.first_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {t.first_name} {t.last_name}
                    </p>
                    {t.className && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        {t.className}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
