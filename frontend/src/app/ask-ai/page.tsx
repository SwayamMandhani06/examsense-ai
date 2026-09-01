"use client";

import { useState, useEffect } from "react";
import { Plus, MessageSquare, Trash2, Sparkles, BookOpen, Layers, Bot, Clock } from "lucide-react";
import { ChatWindow } from "@/components/ai/ChatWindow";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subjects as subjectsApi, ask } from "@/lib/api";
import type { Subject } from "@/types/subject";
import type { ChatSession, ChatMessage } from "@/types/material";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";

export default function AskAIPage() {
  const queryClient = useQueryClient();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const [loadedMessages, setLoadedMessages] = useState<ChatMessage[] | undefined>();
  const [chatKey, setChatKey] = useState(0);

  const { data: subjectList = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsApi.getAll,
  });

  useEffect(() => {
    if (subjectList.length > 0 && !selectedSubject) {
      setSelectedSubject(subjectList[0]);
    }
  }, [subjectList, selectedSubject]);

  const { data: sessions = [] } = useQuery<ChatSession[]>({
    queryKey: ["chat-sessions"],
    queryFn: ask.getSessions,
    refetchInterval: 6000,
  });

  const deleteMutation = useMutation({
    mutationFn: ask.deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      setActiveSessionId(undefined);
      setLoadedMessages(undefined);
      setChatKey((k) => k + 1);
      toast.success("Chat session deleted.");
    },
  });

  const handleNewChat = () => {
    setActiveSessionId(undefined);
    setLoadedMessages(undefined);
    setChatKey((k) => k + 1);
  };

  const handleSubjectChange = (subjectId: string) => {
    const s = subjectList.find((s) => s.id === subjectId);
    if (s) {
      setSelectedSubject(s);
      setActiveSessionId(undefined);
      setLoadedMessages(undefined);
      setChatKey((k) => k + 1);
    }
  };

  const handleSessionClick = (session: ChatSession) => {
    setActiveSessionId(session.id);
    const restored: ChatMessage[] = (session.messages ?? []).map((m: any, i: number) => ({
      id: `restored-${session.id}-${i}`,
      role: m.role as "user" | "assistant",
      content: m.content,
      timestamp: "",
    }));
    setLoadedMessages(restored);
    setChatKey((k) => k + 1);
  };

  const handleSessionCreated = (sessionId: string) => {
    setActiveSessionId(sessionId);
    queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-64px)] flex flex-col overflow-hidden max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Left Sessions & Context Sidebar */}
        <div className="w-full md:w-72 shrink-0 glass-card rounded-3xl p-4 flex flex-col border border-border overflow-hidden bg-card/70">
          {/* Subject Context Selector */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={12} className="text-primary-light" /> Subject Focus
              </label>
              {selectedSubject && (
                <span className="text-[10px] text-text-subtle font-mono font-bold">
                  Year {selectedSubject.year}
                </span>
              )}
            </div>

            {subjectList.length === 0 ? (
              <p className="text-xs text-text-muted p-2 rounded-xl bg-surface">
                No subjects available.
              </p>
            ) : (
              <select
                value={selectedSubject?.id ?? ""}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-semibold text-text focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                {subjectList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Year {s.year})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* New Chat Button */}
          <Button
            size="sm"
            variant="primary"
            onClick={handleNewChat}
            className="w-full mb-4"
            leftIcon={<Plus size={15} />}
          >
            Start New Chat
          </Button>

          {/* Sessions List */}
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Clock size={11} /> Saved Sessions
            </span>
            <span className="text-[10px] text-text-subtle">{sessions.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-xs text-text-muted">
                No previous chat sessions. Ask a question to begin.
              </div>
            ) : (
              sessions.map((session) => {
                const title = session.title || "Academic Query";
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                      isActive
                        ? "bg-primary-gradient text-white shadow-glow-sm"
                        : "text-text-muted hover:text-text hover:bg-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare size={13} className="shrink-0" />
                      <span className="truncate">{title}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(session.id);
                      }}
                      className={`p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-danger/20 hover:text-rose-400 transition-all shrink-0 ${
                        isActive ? "text-white hover:text-rose-200" : "text-text-muted"
                      }`}
                      title="Delete session"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Chat Canvas */}
        <div className="flex-1 min-h-0 h-full">
          {selectedSubject ? (
            <ChatWindow
              key={chatKey}
              subjectId={selectedSubject.id}
              subjectName={selectedSubject.name}
              sessionId={activeSessionId}
              initialMessages={loadedMessages}
              onSessionCreated={handleSessionCreated}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full glass-card rounded-3xl border border-border text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary-light flex items-center justify-center mb-3">
                <Bot size={28} />
              </div>
              <h3 className="font-bold text-base text-text">Select a Subject</h3>
              <p className="text-xs text-text-muted mt-1 max-w-sm">
                Choose an academic subject from the sidebar to activate the citation-grounded Groq AI Tutor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
