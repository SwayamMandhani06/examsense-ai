"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { ask } from "@/lib/api";
import type { ChatMessage } from "@/types/material";
import { MessageBubble } from "./MessageBubble";

interface Props {
  subjectId: string;
  subjectName: string;
  sessionId?: string;
  initialMessages?: ChatMessage[];
  onSessionCreated?: (sessionId: string) => void;
}

export function ChatWindow({ subjectId, subjectName, sessionId, initialMessages, onSessionCreated }: Props) {
  const [input, setInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId);

  const welcomeMessage: ChatMessage = {
    id: "welcome",
    role: "assistant",
    content: `Hello! I'm ExamSense AI. I have access to all materials from **${subjectName}**. Ask me anything — past paper questions, concept explanations, or exam trend predictions.`,
    timestamp: new Date().toISOString(),
  };

  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages && initialMessages.length > 0
      ? initialMessages  // restored session — show old messages
      : [welcomeMessage] // new chat — show welcome
  );

  const bottomRef = useRef<HTMLDivElement>(null);
  const isRestoredSession = initialMessages && initialMessages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const mutation = useMutation({
    mutationFn: (data: { question: string; subject_id: string; session_id?: string }) =>
      ask.sendQuestion(data),
    onSuccess: (data) => {
      const newSessionId = data.session_id ?? data.sessionId;
      if (newSessionId) {
        setCurrentSessionId(String(newSessionId));
        onSessionCreated?.(String(newSessionId));
      }
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(aiMsg));
    },
    onError: () => {
      setMessages((prev) =>
        prev.filter((m) => m.id !== "typing").concat({
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
        })
      );
    },
  });

  const sendMessage = () => {
    const text = input.trim();
    if (!text || mutation.isPending) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    const typingMsg: ChatMessage = {
      id: "typing",
      role: "assistant",
      content: "__typing__",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, typingMsg]);
    mutation.mutate({
      question: text,
      subject_id: subjectId,
      session_id: currentSessionId,
    });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
        <span className="text-sm font-semibold">ExamSense AI</span>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success/12 text-[#4ade80] border border-success/25 uppercase tracking-wide">Online</span>
        {isRestoredSession && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary-light border border-primary/20">
            Restored session
          </span>
        )}
        <span className="ml-auto text-xs text-text-muted">{subjectName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2.5 p-4 border-t border-border flex-shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={isRestoredSession ? "Continue this conversation..." : "Ask about topics, past questions, or exam trends..."}
          rows={1}
          className="flex-1 bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary resize-none transition-colors"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || mutation.isPending}
          className="w-11 h-11 flex-shrink-0 rounded-lg bg-primary-gradient text-white flex items-center justify-center hover:opacity-85 transition-opacity disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
