"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { ChatMessage, ChatResult } from "@/lib/api";

type ChatSidebarProps = {
  onSend: (messages: ChatMessage[]) => Promise<ChatResult>;
  onBoardUpdated: (board: ChatResult["board"]) => void;
};

export const ChatSidebar = ({ onSend, onBoardUpdated }: ChatSidebarProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [failedHistory, setFailedHistory] = useState<ChatMessage[] | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [messages, isSending, error]);

  const replaceMessages = (nextMessages: ChatMessage[]) => {
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
  };

  const ask = async (history: ChatMessage[]) => {
    setError("");
    setIsSending(true);
    try {
      const result = await onSend(history);
      replaceMessages([...history, { role: "assistant", content: result.reply }]);
      onBoardUpdated(result.board);
      setFailedHistory(null);
    } catch {
      setError("The assistant could not respond. Check the service and retry.");
      setFailedHistory(history);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isSending) return;
    const history = [...messagesRef.current, { role: "user" as const, content: input.trim() }];
    replaceMessages(history);
    setInput("");
    void ask(history);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <aside className="chat-sidebar" aria-labelledby="assistant-heading">
      <header className="chat-header">
        <p className="eyebrow">Board assistant</p>
        <h2 id="assistant-heading">Ask for a board change</h2>
        <p>The assistant sees the current board and can create, edit, or move cards for you.</p>
      </header>
      <div className="chat-messages" aria-live="polite" aria-label="Assistant conversation">
        {messages.length === 0 ? (
          <p className="chat-empty">Try “Move QA micro-interactions to Done” or “Create a card for sprint planning.”</p>
        ) : null}
        {messages.map((message, index) => (
          <article key={`${message.role}-${index}`} className={`chat-message chat-message-${message.role}`}>
            <p className="chat-role">{message.role === "user" ? "You" : "Assistant"}</p>
            <p>{message.content}</p>
          </article>
        ))}
        {isSending ? <p className="chat-pending" aria-label="Assistant is responding">Assistant is thinking…</p> : null}
        {error ? (
          <div className="form-alert" role="alert">
            <span>{error}</span>
            <button type="button" className="text-button" onClick={() => failedHistory && void ask(failedHistory)} disabled={!failedHistory || isSending}>
              Retry
            </button>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
      <form noValidate className="chat-form" onSubmit={submit}>
        <label htmlFor="assistant-request">Your request</label>
        <textarea
          ref={inputRef}
          id="assistant-request"
          className="resize-none"
          rows={3}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this board…"
          disabled={isSending}
        />
        <p className="field-hint">Enter sends. Shift+Enter adds a line.</p>
        <button type="submit" className="button button-primary" disabled={isSending || !input.trim()} aria-busy={isSending}>
          {isSending ? "Sending…" : "Send request"}
        </button>
      </form>
    </aside>
  );
};
