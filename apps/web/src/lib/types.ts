export type Role = "user" | "assistant" | "system";

export interface Citation {
  source: string;
  page: number | string | null;
  label: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  citations?: Citation[];
  createdAt: number;
  streaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
  createdAt: number;
}

export interface HealthResponse {
  status: string;
  knowledge_base_ready: boolean;
  candidate?: string;
}

export type StreamEvent =
  | { type: "citations"; citations: Citation[] }
  | { type: "token"; content: string }
  | { type: "error"; message: string }
  | { type: "done" };
