"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import {
  createProjectMessage,
  fetchProjectMessages,
  formatMessageTime,
  getMessageErrorMessage,
  type ProjectMessageSummary,
} from "@/lib/messages";
import { connectProjectRealtime } from "@/lib/project-realtime";
import { getInitials } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import { useDeferredEffect } from "@/lib/use-deferred-effect";

type DiscussionViewProps = {
  projectId: string;
  projectName: string;
  userId: string;
};

export function DiscussionView({
  projectId,
  projectName,
  userId,
}: DiscussionViewProps) {
  const [messages, setMessages] = useState<ProjectMessageSummary[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProjectMessages(projectId);
      setMessages(data);
    } catch (err) {
      setMessages([]);
      setError(getMessageErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const refreshMessagesQuietly = useCallback(async () => {
    try {
      const data = await fetchProjectMessages(projectId);
      setMessages(data);
    } catch {
      // Ignore background refresh errors.
    }
  }, [projectId]);

  useDeferredEffect(() => loadMessages(), [loadMessages]);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      scrollToBottom();
    }
  }, [isLoading, messages.length, scrollToBottom]);

  useEffect(() => {
    let disconnect: (() => Promise<void>) | undefined;
    let cancelled = false;

    void connectProjectRealtime(projectId, (envelope) => {
      if (envelope.event === "message.posted" && envelope.actorId !== userId) {
        void refreshMessagesQuietly();
      }
    }).then((cleanup) => {
      if (cancelled) {
        void cleanup();
        return;
      }
      disconnect = cleanup;
    });

    return () => {
      cancelled = true;
      void disconnect?.();
    };
  }, [projectId, refreshMessagesQuietly, userId]);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const created = await createProjectMessage(projectId, trimmed);
      setMessages((current) => [...current, created]);
      setBody("");
      requestAnimationFrame(() => scrollToBottom());
    } catch (err) {
      setError(getMessageErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="discussion-view space-y-4">
      <p className="text-sm text-[var(--wlx-muted)]">
        Team discussion for{" "}
        <span className="font-medium text-[var(--wlx-text)]">{projectName}</span>
      </p>

      {error ? (
        <p className="rounded-md bg-[#ffebe6] px-3 py-2 text-sm text-[#bf2600]" role="alert">
          {error}
        </p>
      ) : null}

      <section className="dashboard-panel discussion-panel">
        {isLoading ? (
          <LoadingState label="Loading discussion…" />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Start the conversation with a quick update or question for the team."
          />
        ) : (
          <ul className="discussion-message-list">
            {messages.map((message) => {
              const isOwn = message.authorId === userId;
              return (
                <li
                  key={message.id}
                  className={cn(
                    "discussion-message",
                    isOwn && "discussion-message-own",
                  )}
                >
                  <div
                    className="discussion-message-avatar"
                    aria-hidden="true"
                  >
                    {getInitials(message.authorName)}
                  </div>
                  <div className="discussion-message-body">
                    <div className="discussion-message-meta">
                      <span className="discussion-message-author">
                        {isOwn ? "You" : message.authorName}
                      </span>
                      <span className="discussion-message-time">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="discussion-message-text">{message.body}</p>
                  </div>
                </li>
              );
            })}
            <div ref={listEndRef} />
          </ul>
        )}

        <form
          className="discussion-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
        >
          <textarea
            className="discussion-composer-input"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message for the team"
            rows={3}
            maxLength={2000}
            disabled={isSending}
          />
          <div className="discussion-composer-actions">
            <p className="text-xs text-[var(--wlx-muted)]">
              Press Enter to send, Shift+Enter for a new line
            </p>
            <Button type="submit" disabled={isSending || !body.trim()}>
              <Send className="size-4" />
              {isSending ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
