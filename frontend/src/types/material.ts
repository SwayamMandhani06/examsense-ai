export interface AskRequest {
  question: string;
  subjectId: string;
  sessionId?: string;
}

export interface Source {
  documentId: string;
  fileName: string;
  relevantChunk: string;
  similarityScore: number;
  pageNumber?: number;
}

export interface AskResponse {
  answer: string;
  sources: Source[];
  sessionId?: string;
  session_id?: string;
  confidence?: number;
  relatedTopics?: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: string;
}

export interface ChatSession {
  id: string;
  subjectId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
