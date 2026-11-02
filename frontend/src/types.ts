export interface ToolCall {
  tool: string;
  status?: string;
  top_k?: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  sources?: string[];
  toolCalls?: ToolCall[];
}

export interface ChatResponse {
  reply: string;
  sources: string[];
  tool_calls: ToolCall[];
}

export interface EmailDraftResponse {
  recipient: string;
  subject: string;
  body: string;
}

export interface UploadResponse {
  filename: string;
  message: string;
}

export type EmailTone = "formal" | "friendly";