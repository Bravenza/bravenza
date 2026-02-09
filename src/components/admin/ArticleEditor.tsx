import { useState, useRef, useCallback, useEffect } from "react";
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Quote, Smile, Minus, Image, Link2, Video, Heading2, Heading3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ArticleEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  minHeight?: string;
}

const EMOJI_CATEGORIES = {
  Smileys: ["😀", "😄", "😁", "😎", "🤩", "🔥", "⭐", "✨", "💯", "🏆", "💎", "👟", "👍", "👏", "🙌", "💪", "🎯", "💰", "📈", "📉"],
};

const formatActions = [
  { command: "bold", icon: Bold, label: "Negrito", shortcut: "Ctrl+B" },
  { command: "italic", icon: Italic, label: "Itálico", shortcut: "Ctrl+I" },
  { command: "underline", icon: Underline, label: "Sublinhado", shortcut: "Ctrl+U" },
  { command: "strikeThrough", icon: Strikethrough, label: "Riscado" },
];

export function ArticleEditor({
  value,
  onChange,
  placeholder = "Escreva o conteúdo do artigo...",
  maxLength = 50000,
  minHeight = "400px",
}: ArticleEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
      updateCharCount();
    }
  }, []);

  const updateCharCount = useCallback(() => {
    if (editorRef.current) {
      setCharCount((editorRef.current.innerText || "").length);
    }
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      updateCharCount();
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange, updateCharCount]);

  const execCommand = useCallback((command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  }, [handleInput]);

  const insertHTML = useCallback((html: string) => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    handleInput();
  }, [handleInput]);

  const handleHeading = (level: 2 | 3) => {
    execCommand("formatBlock", `h${level}`);
  };

  const handleInsertImage = () => {
    if (imageUrl) {
      insertHTML(`<img src="${imageUrl}" alt="Imagem do artigo" style="max-width:100%;border-radius:12px;margin:16px 0;" />`);
      setImageUrl("");
      setShowImageDialog(false);
    }
  };

  const handleInsertLink = () => {
    if (linkUrl) {
      const text = linkText || linkUrl;
      insertHTML(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color:hsl(45,100%,50%);text-decoration:underline;">${text}</a>`);
      setLinkUrl("");
      setLinkText("");
      setShowLinkDialog(false);
    }
  };

  const handleInsertVideo = () => {
    if (videoUrl) {
      let embedUrl = videoUrl;
      if (videoUrl.includes("youtube.com/watch")) {
        embedUrl = videoUrl.replace("watch?v=", "embed/");
      } else if (videoUrl.includes("youtu.be/")) {
        embedUrl = videoUrl.replace("youtu.be/", "youtube.com/embed/");
      }
      insertHTML(`<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:16px 0;"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>`);
      setVideoUrl("");
      setShowVideoDialog(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b": e.preventDefault(); execCommand("bold"); break;
        case "i": e.preventDefault(); execCommand("italic"); break;
        case "u": e.preventDefault(); execCommand("underline"); break;
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    // Allow HTML paste for richer content
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    if (html) {
      document.execCommand("insertHTML", false, html);
    } else {
      document.execCommand("insertText", false, text);
    }
    handleInput();
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 rounded-xl bg-secondary/30 border border-border/50 backdrop-blur-sm">
        {/* Headings */}
        <Button type="button" variant="ghost" size="sm" onClick={() => handleHeading(2)} className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Título">
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => handleHeading(3)} className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Subtítulo">
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Text Formatting */}
        {formatActions.map((action) => (
          <Button key={action.command} type="button" variant="ghost" size="sm" onClick={() => execCommand(action.command)}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ""}`}>
            <action.icon className="h-4 w-4" />
          </Button>
        ))}

        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Lists */}
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("insertUnorderedList")} className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Lista">
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("insertOrderedList")} className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Lista numerada">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertHTML('<blockquote style="border-left:3px solid hsl(45,100%,50%,0.5);padding-left:1rem;margin:0.75rem 0;font-style:italic;color:hsl(45,10%,60%);">Citação</blockquote>')}
          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Citação">
          <Quote className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertHTML('<hr style="border:none;border-top:1px solid hsl(0,0%,18%);margin:1rem 0;" />')}
          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Separador">
          <Minus className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Media insertions */}
        <Popover open={showImageDialog} onOpenChange={setShowImageDialog}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Inserir imagem">
              <Image className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3 bg-card border-border/50" align="start">
            <p className="text-xs font-medium mb-2">URL da imagem</p>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="mb-2" />
            <Button size="sm" onClick={handleInsertImage} disabled={!imageUrl} className="w-full">Inserir imagem</Button>
          </PopoverContent>
        </Popover>

        <Popover open={showVideoDialog} onOpenChange={setShowVideoDialog}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Inserir vídeo">
              <Video className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3 bg-card border-border/50" align="start">
            <p className="text-xs font-medium mb-2">URL do vídeo (YouTube ou direto)</p>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="mb-2" />
            <Button size="sm" onClick={handleInsertVideo} disabled={!videoUrl} className="w-full">Inserir vídeo</Button>
          </PopoverContent>
        </Popover>

        <Popover open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Inserir link">
              <Link2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3 bg-card border-border/50" align="start">
            <p className="text-xs font-medium mb-2">Inserir link</p>
            <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Texto do link" className="mb-2" />
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="mb-2" />
            <Button size="sm" onClick={handleInsertLink} disabled={!linkUrl} className="w-full">Inserir link</Button>
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Emoji */}
        <Popover open={showEmojis} onOpenChange={setShowEmojis}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Emoji">
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-card/95 backdrop-blur-xl border-border/50" align="start" side="top">
            <div className="grid grid-cols-10 gap-0.5 max-h-32 overflow-y-auto">
              {EMOJI_CATEGORIES.Smileys.map((emoji) => (
                <button key={emoji} type="button" onClick={() => { insertHTML(emoji); setShowEmojis(false); }}
                  className="w-7 h-7 flex items-center justify-center text-lg hover:bg-primary/10 rounded-lg transition-colors">
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Editor area */}
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
          "article-editor relative w-full rounded-xl border bg-background/50 px-5 py-4 text-base",
          "ring-offset-background transition-all duration-200",
          "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/20",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none",
          "overflow-y-auto",
          isFocused ? "border-primary/50 ring-2 ring-ring/20" : "border-border/60"
        )}
        style={{ minHeight }}
        suppressContentEditableWarning
      />

      <div className="flex items-center justify-end">
        <span className={cn("text-xs transition-colors", charCount > maxLength * 0.9 ? "text-destructive" : "text-muted-foreground")}>
          {charCount.toLocaleString()}/{maxLength.toLocaleString()}
        </span>
      </div>

      <style>{`
        .article-editor { line-height: 1.8; font-size: 15px; }
        .article-editor h2 { font-size: 1.5em; font-weight: 700; margin: 1.5rem 0 0.75rem; }
        .article-editor h3 { font-size: 1.25em; font-weight: 600; margin: 1.25rem 0 0.5rem; }
        .article-editor b, .article-editor strong { font-weight: 700; }
        .article-editor i, .article-editor em { font-style: italic; }
        .article-editor u { text-decoration: underline; text-underline-offset: 2px; }
        .article-editor s, .article-editor strike { text-decoration: line-through; opacity: 0.7; }
        .article-editor ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .article-editor ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .article-editor li { margin: 0.25rem 0; }
        .article-editor blockquote { border-left: 3px solid hsl(45 100% 50% / 0.5); padding-left: 1rem; margin: 0.75rem 0; font-style: italic; }
        .article-editor hr { border: none; border-top: 1px solid hsl(0 0% 18%); margin: 1rem 0; }
        .article-editor img { max-width: 100%; border-radius: 12px; margin: 16px 0; }
        .article-editor a { color: hsl(45 100% 50%); text-decoration: underline; }
        .article-editor iframe { border-radius: 12px; }
        .article-editor:empty:before { display: block; }
      `}</style>
    </div>
  );
}