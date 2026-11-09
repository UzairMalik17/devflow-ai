"use client";

import { IngestionStatus } from "@/constants/enums";
import { useState, useRef, useEffect, type SubmitEvent } from "react";
import { Repository } from "../workspace/AppSidebar";
import { ingestionStatusStyles } from "../workspace/AppSidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type RepositoryChatProps = {
  repositoryId: string;
};

export function RepositoryChat({ repositoryId }: RepositoryChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [repository, setRepository] = useState<Repository | null>(null);
  const [isRepositoryLoading, setIsRepositoryLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    async function fetchRepository() {
      try {
        setIsRepositoryLoading(true);

        const response = await fetch(`/api/repositories/${repositoryId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch repository.");
        }

        const data: { repository: Repository } = await response.json();

        setRepository(data.repository);
      } catch (error) {
        console.error("Failed to fetch repository:", error);
      } finally {
        setIsRepositoryLoading(false);
      }
    }

    fetchRepository();
  }, [repositoryId]);

  const isChatEnabled =
    repository?.ingestionStatus === IngestionStatus.COMPLETED;

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = input.trim();

    if (!question || isLoading || !isChatEnabled) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: question,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/repositories/${repositoryId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: question,
        }),
      });

      const data: { message?: string; answer: string; sources?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to get an answer.");
      }

      if (!data.answer) {
        throw new Error("The server returned an empty response.");
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-white/10 px-5 py-4 sm:px-8">
        <h1 className="text-base font-semibold">Repository chat</h1>
      </div>

      <div className="border-b border-white/10 px-5 py-3 sm:px-8">
        {isRepositoryLoading ? (
          <p className="text-xs text-[#a3a3a3]">Loading repository status...</p>
        ) : repository ? (
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                ingestionStatusStyles[repository.ingestionStatus].className
              }`}
            >
              {ingestionStatusStyles[repository.ingestionStatus].label}
            </span>

            <p className="text-xs text-[#a3a3a3]">
              {repository.ingestionStatus === IngestionStatus.COMPLETED
                ? "Repository is ready. Start asking questions."
                : repository.ingestionStatus === IngestionStatus.FAILED
                  ? "Repository processing failed."
                  : "Chat will be available once repository processing is complete."}
            </p>
          </div>
        ) : (
          <p className="text-xs text-red-400">
            Could not load repository details. Please refresh the page.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
            <div className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-[#1d1d1d] text-xl">
              {"</>"}
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Ask about this codebase
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-[#a3a3a3]">
              Ask questions about the repository&apos;s architecture,
              implementation, functions, or files.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-[#f2f0eb] text-[#171717]"
                      : "border border-white/10 bg-[#1d1d1d] text-[#f2f0eb]"
                  }`}
                >
                  <p className="mb-2 text-xs font-medium opacity-60">
                    {message.role === "user" ? "You" : "DevFlow AI"}
                  </p>

                  {message.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none text-sm leading-6 text-[#f2f0eb]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="text-sm text-[#a3a3a3]" role="status">
                DevFlow AI is thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-white/10 px-5 py-4 sm:px-8">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-3xl items-end gap-3"
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={
              isChatEnabled
                ? "Ask a question about this repository..."
                : "Chat is unavailable until ingestion is complete."
            }
            aria-label="Message"
            rows={2}
            disabled={!isChatEnabled || isLoading}
            className="min-h-12 flex-1 resize-y rounded-xl border border-white/15 bg-[#171717] px-4 py-3 text-sm outline-none placeholder:text-[#737373] focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading || !isChatEnabled}
            className="rounded-xl bg-[#f2f0eb] px-4 py-3 text-sm font-medium text-[#171717] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-[#333333] disabled:text-[#737373]"
          >
            Send
          </button>
        </form>

        {error && (
          <p
            role="alert"
            className="mx-auto mt-3 max-w-3xl text-sm text-red-400"
          >
            {error}
          </p>
        )}

        {isChatEnabled && (
          <p className="mx-auto mt-2 max-w-3xl text-xs text-[#737373]">
            Enter to send · Shift + Enter for a new line
          </p>
        )}
      </div>
    </section>
  );
}
