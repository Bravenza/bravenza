import React from "react";
import { cn } from "@/lib/utils";

interface FormattedTextProps {
  content: string;
  className?: string;
}

export function FormattedText({ content, className }: FormattedTextProps) {
  const renderFormattedText = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;

    // Combined regex for all formatting
    const formatRegex = /(\*\*(.+?)\*\*)|(_(.+?)_)|(~~(.+?)~~)|(<u>(.+?)<\/u>)|(`(.+?)`)|(\n• (.+?)(?=\n|$))|(\n\d+\. (.+?)(?=\n|$))|(\n> (.+?)(?=\n|$))|(---)|(\n)/g;
    
    let match;
    while ((match = formatRegex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={key++}>{text.slice(lastIndex, match.index)}</span>
        );
      }

      if (match[1]) {
        // Bold **text**
        parts.push(
          <strong key={key++} className="font-bold">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        // Italic _text_
        parts.push(
          <em key={key++} className="italic">
            {match[4]}
          </em>
        );
      } else if (match[5]) {
        // Strikethrough ~~text~~
        parts.push(
          <span key={key++} className="line-through text-muted-foreground">
            {match[6]}
          </span>
        );
      } else if (match[7]) {
        // Underline <u>text</u>
        parts.push(
          <span key={key++} className="underline underline-offset-2">
            {match[8]}
          </span>
        );
      } else if (match[9]) {
        // Code `text`
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm">
            {match[10]}
          </code>
        );
      } else if (match[11]) {
        // Bullet point
        parts.push(
          <div key={key++} className="flex items-start gap-2 my-1">
            <span className="text-primary mt-0.5">•</span>
            <span>{match[12]}</span>
          </div>
        );
      } else if (match[13]) {
        // Numbered list
        parts.push(
          <div key={key++} className="flex items-start gap-2 my-1">
            <span className="text-muted-foreground font-medium min-w-[1.5rem]">
              {match[13].match(/\d+/)?.[0]}.
            </span>
            <span>{match[14]}</span>
          </div>
        );
      } else if (match[15]) {
        // Quote
        parts.push(
          <blockquote key={key++} className="border-l-2 border-primary/50 pl-3 my-2 italic text-muted-foreground">
            {match[16]}
          </blockquote>
        );
      } else if (match[17] === "---") {
        // Horizontal rule
        parts.push(
          <hr key={key++} className="my-3 border-border" />
        );
      } else if (match[18] === "\n") {
        // Line break
        parts.push(<br key={key++} />);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={key++}>{text.slice(lastIndex)}</span>
      );
    }

    return parts;
  };

  // Simpler approach - parse line by line and handle inline formatting
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
    const elements: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Process formatting in order
    const patterns = [
      { regex: /\*\*(.+?)\*\*/g, render: (match: string) => <strong key={key++} className="font-bold">{match}</strong> },
      { regex: /_(.+?)_/g, render: (match: string) => <em key={key++} className="italic">{match}</em> },
      { regex: /~~(.+?)~~/g, render: (match: string) => <span key={key++} className="line-through text-muted-foreground">{match}</span> },
      { regex: /<u>(.+?)<\/u>/g, render: (match: string) => <span key={key++} className="underline underline-offset-2">{match}</span> },
      { regex: /`(.+?)`/g, render: (match: string) => <code key={key++} className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm">{match}</code> },
    ];

    // Simple sequential processing
    let processedText = text;
    const placeholders: { placeholder: string; element: React.ReactNode }[] = [];

    patterns.forEach(({ regex, render }) => {
      processedText = processedText.replace(regex, (_, content) => {
        const placeholder = `__PLACEHOLDER_${placeholders.length}__`;
        placeholders.push({ placeholder, element: render(content) });
        return placeholder;
      });
    });

    // Split by placeholders and reconstruct
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
