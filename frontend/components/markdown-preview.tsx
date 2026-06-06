"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownPreviewProps = {
  content: string;
  emptyMessage?: string;
};

export function MarkdownPreview({
  content,
  emptyMessage = "Nothing to preview yet. Switch to Write and add markdown.",
}: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <p className="docs-markdown-preview docs-markdown-empty">{emptyMessage}</p>
    );
  }

  return (
    <div className="docs-markdown-preview">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
