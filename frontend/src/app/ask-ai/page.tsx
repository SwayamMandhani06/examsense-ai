"use client";

import { useState, useEffect } from "react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { ChatWindow } from "@/components/ai/ChatWindow";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subjects as subjectsApi, ask } from "@/lib/api";
import type { Subject } from "@/types/subject";
import type { ChatSession, ChatMessage } from "@/types/material";

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
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: ask.deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      setActiveSessionId(undefined);
      setLoadedMessages(undefined);
      setChatKey((k) => k + 1);
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

    // Convert stored messages to ChatMessage format for display
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
    <div className="p-7 h-[calc(100vh-65px)] flex flex-col">
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 bg-card border border-border rounded-xl p-4 flex flex-col overflow-hidden">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Subject Context</h3>

          {subjectList.length === 0 ? (
            <p className="text-xs text-text-muted mb-5">No subjects available.</p>
          ) : (
            <select
              value={selectedSubject?.id ?? ""}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary transition-colors cursor-pointer mb-5"
            >
              {subjectList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Chat History</h3>
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {sessions.length === 0 ? (
              <p className="text-xs text-text-muted px-2 py-2">No past chats yet.</p>
            ) : (
              sessions.map((session) => {
                const title = session.title || "Chat";
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer transition-all ${
                      isActive
                        ? "bg-primary/12 text-primary-light"
                        : "text-text-muted hover:bg-primary/8 hover:text-text"
                    }`}
                  >
                    <MessageSquare size={12} className="flex-shrink-0" />
                    <span className="flex-1 truncate">{title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={handleNewChat}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-primary/10 text-primary-light hover:bg-primary/20 rounded-lg transition-colors"
          >
            <Plus size={13} /> New Chat
          </button>
        </div>

        {/* Chat area */}
        <div className="flex-1 min-h-0">
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
            <div className="flex items-center justify-center h-full bg-card border border-border rounded-xl text-text-muted text-sm">
              {subjectList.length === 0
                ? "No subjects added yet. Ask your admin to add subjects."
                : "Select a subject to start chatting."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
