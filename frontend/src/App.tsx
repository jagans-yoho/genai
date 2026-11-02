import React, { useState, ChangeEvent, KeyboardEvent } from "react";
import "./App.css";
import type { ChatMessage, ChatResponse, EmailDraftResponse, UploadResponse, EmailTone } from "./types";

const API_BASE = "http://localhost:8000";
const SESSION_ID = "session_user_01";

export default function App(): React.JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [tone, setTone] = useState<EmailTone>("formal");
  const [draft, setDraft] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [draftLoading, setDraftLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSendMessage = async (): Promise<void> => {
    if (!inputMsg.trim()) return;
    const userText = inputMsg;
    setInputMsg("");
    setError("");

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: SESSION_ID, message: userText }),
      });

      if (!res.ok) throw new Error("Server error occurred while chatting.");
      const data: ChatResponse = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply,
          sources: data.sources,
          toolCalls: data.tool_calls,
        },
      ]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  
  const handleUpload = async (): Promise<void> => {
    if (!file) {
      setUploadStatus("Please choose a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Document upload failed.");
      const data: UploadResponse = await res.json();
      setUploadStatus(`Uploaded: ${data.filename}`);
    } catch {
      setUploadStatus("Upload failed. Ensure backend is running.");
    }
  };

  
  const handleDraftEmail = async (): Promise<void> => {
    setError("");
    setDraftLoading(true);

    try {
      const res = await fetch(`${API_BASE}/draft-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: SESSION_ID, tone: tone }),
      });

      if (!res.ok) {
        throw new Error("Cannot draft email without session conversation history.");
      }

      const data: EmailDraftResponse = await res.json();
      setDraft(`To: ${data.recipient}\nSubject: ${data.subject}\n\n${data.body}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create email draft.");
      }
    } finally {
      setDraftLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      void handleSendMessage();
    }
  };

  return (
    <div className="container">
      <h2>Integrated AI Assistant</h2>

      
      <div className="card">
        <h4>Upload Document</h4>
        <div className="row">
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleUpload}>Upload</button>
        </div>
        {uploadStatus && <div className="status-text">{uploadStatus}</div>}
      </div>

      <div className="chat-window">
        {messages.map((m, idx) => (
          <div key={idx} className={`msg-bubble ${m.role}`}>
            <div>{m.text}</div>
            {m.sources && m.sources.length > 0 && (
              <div className="sources-tag">
                <strong>Sources:</strong> {m.sources.join(", ")}
              </div>
            )}
            {/* Bonus Challenge: Collapsible tool calls panel
            {m.toolCalls && m.toolCalls.length > 0 && (
              <details className="tool-details">
                <summary>How I got this (Tool calls)</summary>
                <pre>{JSON.stringify(m.toolCalls, null, 2)}</pre>
              </details>
            )} */}
          </div>
        ))}
      </div>

      {loading && <div className="loading-msg">Assistant is generating response...</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="row" style={{ marginTop: "10px" }}>
        <input
          type="text"
          className="chat-input"
          value={inputMsg}
          placeholder="Type your message..."
          onChange={(e: ChangeEvent<HTMLInputElement>) => setInputMsg(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleSendMessage} disabled={loading}>
          Send
        </button>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="row-between">
          <h4>Draft Email Feature (POST /draft-email)</h4>
          <div className="row">
            <label>Tone:</label>
            <select
              value={tone}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setTone(e.target.value as EmailTone)}
            >
              <option value="formal">Formal</option>
              <option value="friendly">Friendly</option>
            </select>
            <button onClick={handleDraftEmail} disabled={draftLoading}>
              {draftLoading ? "Drafting..." : "Draft Email"}
            </button>
          </div>
        </div>
        <textarea
          className="draft-area"
          readOnly
          value={draft}
          placeholder="Generated draft email with recipient, subject, and body will show here..."
        />
      </div>
    </div>
  );
}