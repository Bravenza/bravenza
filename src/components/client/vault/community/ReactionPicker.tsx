import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type ReactionType = "like" | "fire" | "clap" | "wow" | "love";

interface Reaction {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}

const reactions: Reaction[] = [
  { type: "like", emoji: "👍", label: "Curtir", color: "bg-blue-500" },
  { type: "fire", emoji: "🔥", label: "Fogo", color: "bg-orange-500" },
  { type: "clap", emoji: "👏", label: "Aplaudir", color: "bg-green-500" },
  { type: "wow", emoji: "🤯", label: "Uau", color: "bg-purple-500" },
  { type: "love", emoji: "❤️", label: "Amor", color: "bg-red-500" },
];

interface ReactionPickerProps {
  onSelect: (type: ReactionType) => void;
  userReactions?: ReactionType[];
  summary?: Record<string, number>;
  size?: "sm" | "md";
  showLabels?: boolean;
}

export function ReactionPicker({ 
  onSelect, 
  userReactions = [], 
  summary = {},
  size = "md",
  showLabels = false
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const totalReactions = Object.values(summary).reduce((a, b) => a + b, 0);
  const topReactions = reactions
    .filter(r => (summary[r.type] || 0) > 0)
    .sort((a, b) => (summary[b.type] || 0) - (summary[a.type] || 0))
    .slice(0, 3);

  const hasUserReacted = userReactions.length > 0;

  return (
    <div className="relative">
      {/* Trigger area */}
      <div 
        className="flex items-center gap-1"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Reaction summary bubbles */}
        {topReactions.length > 0 && (
          <div className="flex -space-x-1 mr-1">
            {topReactions.map((r) => (
              <motion.span
                key={r.type}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "flex items-center justify-center rounded-full border-2 border-background",
                  size === "sm" ? "w-5 h-5 text-xs" : "w-6 h-6 text-sm",
                  userReactions.includes(r.type) && "ring-2 ring-primary ring-offset-1"
                )}
              >
                {r.emoji}
              </motion.span>
            ))}
          </div>
        )}

        {/* Count */}
        {totalReactions > 0 && (
          <span className={cn(
            "text-muted-foreground font-medium",
            size === "sm" ? "text-xs" : "text-sm"
          )}>
            {totalReactions}
          </span>
        )}

        {/* Add reaction button */}
        {topReactions.length === 0 && (
          <button 
            className={cn(
              "flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors",
              size === "sm" ? "text-xs" : "text-sm"
            )}
          >
            <span className={size === "sm" ? "text-sm" : "text-base"}>😀</span>
            {showLabels && <span>Reagir</span>}
          </button>
        )}
      </div>

      {/* Picker popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 z-50"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="bg-card border border-border rounded-full shadow-xl px-2 py-1.5 flex gap-1">
              {reactions.map((reaction, i) => {
                const isActive = userReactions.includes(reaction.type);
                const count = summary[reaction.type] || 0;
                
                return (
                  <motion.button
                    key={reaction.type}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      onSelect(reaction.type);
                    }}
                    className={cn(
                      "relative flex flex-col items-center p-1.5 rounded-full transition-all",
                      "hover:bg-muted hover:scale-125",
                      isActive && "bg-primary/20"
                    )}
                    title={reaction.label}
                  >
                    <span className={size === "sm" ? "text-lg" : "text-2xl"}>
                      {reaction.emoji}
                    </span>
                    {count > 0 && (
                      <span className="absolute -bottom-1 -right-1 bg-card border border-border rounded-full text-[10px] px-1 min-w-[16px] text-center">
                        {count}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to display reaction summary inline
export function ReactionSummary({ 
  summary, 
  userReactions = [],
  onClick,
  size = "sm" 
}: { 
  summary: Record<string, number>; 
  userReactions?: ReactionType[];
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  const totalReactions = Object.values(summary).reduce((a, b) => a + b, 0);
  const topReactions = reactions
    .filter(r => (summary[r.type] || 0) > 0)
    .sort((a, b) => (summary[b.type] || 0) - (summary[a.type] || 0))
    .slice(0, 3);

  if (totalReactions === 0) return null;

  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-1 hover:underline"
    >
      <div className="flex -space-x-1">
        {topReactions.map((r) => (
          <span
            key={r.type}
            className={cn(
              "flex items-center justify-center rounded-full bg-muted",
              size === "sm" ? "w-4 h-4 text-[10px]" : "w-5 h-5 text-xs"
            )}
          >
            {r.emoji}
          </span>
        ))}
      </div>
      <span className={cn(
        "text-muted-foreground",
        size === "sm" ? "text-xs" : "text-sm"
      )}>
        {totalReactions}
      </span>
    </button>
  );
}
