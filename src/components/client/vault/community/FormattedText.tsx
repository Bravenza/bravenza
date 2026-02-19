import React from "react";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

interface FormattedTextProps {
  content: string;
  className?: string;
}

export function FormattedText({ content, className }: FormattedTextProps) {
  // Check if content appears to be HTML (contains HTML tags)
  const isHTML = /<[a-z][\s\S]*>/i.test(content);

  if (isHTML) {
    // Render HTML content safely (already formatted by WYSIWYG editor)
    return (
      <div 
        className={cn("formatted-html-content", className)}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    );
  }

  // Parse markdown-style content for backward compatibility
  const parseContent = (text: string): React.ReactNode => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIndex) => {
      const key = `line-${lineIndex}`;

      // Check for special line types
      if (line === "---") {
        elements.push(<hr key={key} className="my-3 border-border" />);
        return;
      }

      if (line.startsWith("> ")) {
        elements.push(
          <blockquote key={key} className="border-l-2 border-primary/50 pl-3 my-2 italic text-muted-foreground">
            {parseInlineFormatting(line.slice(2))}
          </blockquote>
        );
        return;
      }

      if (line.startsWith("• ")) {
        elements.push(
          <div key={key} className="flex items-start gap-2 my-0.5">
            <span className="text-primary mt-0.5">•</span>
            <span>{parseInlineFormatting(line.slice(2))}</span>
          </div>
        );
        return;
      }

      const numberedMatch = line.match(/^(\d+)\. (.+)/);
      if (numberedMatch) {
        elements.push(
          <div key={key} className="flex items-start gap-2 my-0.5">
            <span className="text-muted-foreground font-medium min-w-[1.5rem]">{numberedMatch[1]}.</span>
            <span>{parseInlineFormatting(numberedMatch[2])}</span>
          </div>
        );
        return;
      }

      // Regular line
      if (line.trim()) {
        elements.push(
          <p key={key} className="my-0.5">{parseInlineFormatting(line)}</p>
        );
      } else if (lineIndex < lines.length - 1) {
        elements.push(<br key={key} />);
      }
    });

    return elements;
  };

  const parseInlineFormatting = (text: string): React.ReactNode => {
    const patterns = [
      { regex: /\*\*(.+?)\*\*/g, render: (match: string, key: number) => <strong key={key} className="font-bold">{match}</strong> },
      { regex: /_(.+?)_/g, render: (match: string, key: number) => <em key={key} className="italic">{match}</em> },
      { regex: /~~(.+?)~~/g, render: (match: string, key: number) => <span key={key} className="line-through text-muted-foreground">{match}</span> },
      { regex: /<u>(.+?)<\/u>/g, render: (match: string, key: number) => <span key={key} className="underline underline-offset-2">{match}</span> },
      { regex: /`(.+?)`/g, render: (match: string, key: number) => <code key={key} className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm">{match}</code> },
    ];

    let processedText = text;
    const placeholders: { placeholder: string; element: React.ReactNode }[] = [];
    let keyCounter = 0;

    patterns.forEach(({ regex, render }) => {
      processedText = processedText.replace(regex, (_, content) => {
        const placeholder = `__PLACEHOLDER_${placeholders.length}__`;
        placeholders.push({ placeholder, element: render(content, keyCounter++) });
        return placeholder;
      });
    });

    if (placeholders.length === 0) {
      return text;
    }

    const parts = processedText.split(/(__PLACEHOLDER_\d+__)/g);
    return parts.map((part, i) => {
      const placeholderMatch = placeholders.find(p => p.placeholder === part);
      if (placeholderMatch) {
        return <React.Fragment key={i}>{placeholderMatch.element}</React.Fragment>;
      }
      return part ? <React.Fragment key={i}>{part}</React.Fragment> : null;
    });
  };

  return (
    <div className={cn("whitespace-pre-wrap break-words", className)}>
      {parseContent(content)}
    </div>
  );
}
