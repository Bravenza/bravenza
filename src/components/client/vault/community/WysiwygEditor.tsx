import { useState, useRef, useCallback, useEffect } from "react";
import { 
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Quote, Smile, Hash, AtSign, Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  minHeight?: string;
}

const EMOJI_CATEGORIES = {
  "Smileys": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋", "😛", "🤪", "😜", "😎", "🤓", "🧐", "🤔", "🤫", "🤭", "🫡", "🤗", "🤤"],
  "Gestures": ["👍", "👎", "👊", "✊", "🤛", "🤜", "🤝", "👏", "🙌", "🤲", "🙏", "✌️", "🤞", "🤟", "🤘", "🤙", "💪", "🦾", "👐", "🫶"],
  "Objects": ["👟", "👞", "👠", "👡", "🩴", "👢", "🥾", "👕", "👔", "🧥", "🥼", "👗", "👘", "💰", "💎", "🏆", "🥇", "🎯", "🔥", "⭐", "✨", "💫", "💥", "💯"],
  "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💝"],
};

const formatActions = [
  { command: "bold", icon: Bold, label: "Negrito", shortcut: "Ctrl+B" },
  { command: "italic", icon: Italic, label: "Itálico", shortcut: "Ctrl+I" },
  { command: "underline", icon: Underline, label: "Sublinhado", shortcut: "Ctrl+U" },
  { command: "strikeThrough", icon: Strikethrough, label: "Riscado" },
];

export function WysiwygEditor({ 
  value, 
  onChange, 
  placeholder = "Escreva sua mensagem...",
  maxLength = 2000,
  minHeight = "120px"
}: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Smileys");
  const [charCount, setCharCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  // Sync external value to editor on mount
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
      updateCharCount();
    }
  }, []);

  const updateCharCount = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || "";
      setCharCount(text.length);
    }
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || "";
      
      // Check max length
      if (text.length > maxLength) {
        // Truncate content
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        
        // Simple truncation by restoring previous content
        return;
      }
      
      updateCharCount();
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange, maxLength, updateCharCount]);

  const execCommand = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }, [handleInput]);

  const insertHTML = useCallback((html: string) => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    handleInput();
  }, [handleInput]);

  const handleFormat = (command: string) => {
    execCommand(command);
  };

  const handleList = (ordered: boolean) => {
    execCommand(ordered ? "insertOrderedList" : "insertUnorderedList");
  };

  const handleQuote = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const text = selection.toString();
      if (text) {
        insertHTML(`<blockquote class="editor-quote">${text}</blockquote>`);
      } else {
        insertHTML('<blockquote class="editor-quote">Citação</blockquote>');
      }
    }
  };

  const handleSeparator = () => {
    insertHTML('<hr class="editor-hr" />');
  };

  const handleEmojiSelect = (emoji: string) => {
    insertHTML(emoji);
    setShowEmojis(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          execCommand("bold");
          break;
        case "i":
          e.preventDefault();
          execCommand("italic");
          break;
        case "u":
          e.preventDefault();
          execCommand("underline");
          break;
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    handleInput();
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 rounded-xl bg-secondary/30 border border-border/50 backdrop-blur-sm">
        {/* Text Formatting */}
        <div className="flex items-center">
          {formatActions.map((action) => (
            <Button
              key={action.command}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleFormat(action.command)}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
              title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Lists & Blocks */}
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleList(false)}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            title="Lista"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleList(true)}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleQuote}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            title="Citação"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSeparator}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            title="Separador"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Special insertions */}
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHTML("#")}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            title="Hashtag"
          >
            <Hash className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHTML("@")}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            title="Menção"
          >
            <AtSign className="h-4 w-4" />
          </Button>
          
          {/* Emoji Picker */}
          <Popover open={showEmojis} onOpenChange={setShowEmojis}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                title="Emoji"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-3 bg-card/95 backdrop-blur-xl border-border/50" 
              align="start"
              side="top"
            >
              {/* Category tabs */}
              <div className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                {Object.keys(EMOJI_CATEGORIES).map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant={activeCategory === category ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveCategory(category)}
                    className="text-xs px-2.5 py-1 h-7 whitespace-nowrap"
                  >
                    {category}
                  </Button>
                ))}
              </div>
              
              {/* Emoji grid */}
              <div className="grid grid-cols-10 gap-0.5 max-h-40 overflow-y-auto">
                {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="w-7 h-7 flex items-center justify-center text-lg hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="ml-auto hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
          <kbd className="px-1.5 py-0.5 rounded bg-muted/50 font-mono">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted/50 font-mono">B</kbd>
          <span className="ml-1">Negrito</span>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        className={cn(
          "wysiwyg-editor relative w-full rounded-xl border bg-background/50 px-4 py-3 text-base",
          "ring-offset-background transition-all duration-200",
          "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/20",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none",
          "overflow-y-auto",
          isFocused ? "border-primary/50 ring-2 ring-ring/20" : "border-border/60"
        )}
        style={{ minHeight }}
        suppressContentEditableWarning
      />
      
      {/* Character count */}
      <div className="flex items-center justify-end">
        <span className={cn(
          "text-xs transition-colors",
          charCount > maxLength * 0.9 ? "text-destructive" : "text-muted-foreground"
        )}>
          {charCount}/{maxLength}
        </span>
      </div>

      {/* Editor styles */}
      <style>{`
        .wysiwyg-editor {
          line-height: 1.6;
        }
        .wysiwyg-editor b, .wysiwyg-editor strong {
          font-weight: 700;
        }
        .wysiwyg-editor i, .wysiwyg-editor em {
          font-style: italic;
        }
        .wysiwyg-editor u {
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .wysiwyg-editor s, .wysiwyg-editor strike {
          text-decoration: line-through;
          opacity: 0.7;
        }
        .wysiwyg-editor ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .wysiwyg-editor ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .wysiwyg-editor li {
          margin: 0.25rem 0;
        }
        .wysiwyg-editor blockquote, .wysiwyg-editor .editor-quote {
          border-left: 3px solid hsl(var(--primary) / 0.5);
          padding-left: 1rem;
          margin: 0.75rem 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        .wysiwyg-editor hr, .wysiwyg-editor .editor-hr {
          border: none;
          border-top: 1px solid hsl(var(--border));
          margin: 1rem 0;
        }
        .wysiwyg-editor:empty:before {
          display: block;
        }
      `}</style>
    </div>
  );
}
