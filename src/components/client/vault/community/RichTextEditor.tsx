import { useState, useRef, useCallback } from "react";
import { 
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Quote, Code, Link2, Smile, Hash, AtSign, Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
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
  { icon: Bold, label: "Negrito", prefix: "**", suffix: "**" },
  { icon: Italic, label: "Itálico", prefix: "_", suffix: "_" },
  { icon: Underline, label: "Sublinhado", prefix: "<u>", suffix: "</u>" },
  { icon: Strikethrough, label: "Riscado", prefix: "~~", suffix: "~~" },
  { icon: Code, label: "Código", prefix: "`", suffix: "`" },
];

const blockActions = [
  { icon: List, label: "Lista", prefix: "\n• " },
  { icon: ListOrdered, label: "Lista numerada", prefix: "\n1. " },
  { icon: Quote, label: "Citação", prefix: "\n> " },
  { icon: Minus, label: "Separador", prefix: "\n---\n" },
];

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Escreva sua mensagem...",
  maxLength = 2000,
  minHeight = "120px"
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Smileys");

  const insertText = useCallback((prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = prefix + selectedText + suffix;
    const newValue = value.substring(0, start) + newText + value.substring(end);
    
    onChange(newValue);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length + selectedText.length + suffix.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }, [value, onChange]);

  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newValue = value.substring(0, start) + text + value.substring(start);
    
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + text.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }, [value, onChange]);

  const handleFormat = (action: typeof formatActions[0]) => {
    insertText(action.prefix, action.suffix);
  };

  const handleBlock = (action: typeof blockActions[0]) => {
    insertAtCursor(action.prefix);
  };

  const handleEmojiSelect = (emoji: string) => {
    insertAtCursor(emoji);
    setShowEmojis(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          insertText("**", "**");
          break;
        case "i":
          e.preventDefault();
          insertText("_", "_");
          break;
        case "u":
          e.preventDefault();
          insertText("<u>", "</u>");
          break;
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 rounded-lg bg-secondary/50 border border-border">
        {/* Formatting */}
        <div className="flex items-center">
          {formatActions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleFormat(action)}
              className="h-8 w-8 p-0"
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Block formatting */}
        <div className="flex items-center">
          {blockActions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleBlock(action)}
              className="h-8 w-8 p-0"
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Special insertions */}
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertAtCursor("#")}
            className="h-8 w-8 p-0"
            title="Hashtag"
          >
            <Hash className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertAtCursor("@")}
            className="h-8 w-8 p-0"
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
                className="h-8 w-8 p-0"
                title="Emoji"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-2" 
              align="start"
              side="top"
            >
              {/* Category tabs */}
              <div className="flex gap-1 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                {Object.keys(EMOJI_CATEGORIES).map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant={activeCategory === category ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveCategory(category)}
                    className="text-xs px-2 py-1 h-7 whitespace-nowrap"
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
                    className="w-7 h-7 flex items-center justify-center text-lg hover:bg-secondary rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="ml-auto hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
          <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Ctrl</kbd>+
          <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">B</kbd>
          <span className="text-muted-foreground/60">Negrito</span>
        </div>
      </div>

      {/* Text area */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="resize-none text-base"
        style={{ minHeight }}
        maxLength={maxLength}
      />
      
      {/* Character count and formatting help */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="hidden sm:block">
          **negrito** | _itálico_ | ~~riscado~~ | `código`
        </span>
        <span>{value.length}/{maxLength}</span>
      </div>
    </div>
  );
}
