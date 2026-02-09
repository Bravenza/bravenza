import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DropsPost, typeConfig, placeholderGradients, formatRelativeDate, getExcerpt } from "./types";

interface DropsStoryViewerProps {
  posts: DropsPost[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

const STORY_DURATION = 8000; // 8 seconds per story
const TICK_INTERVAL = 50;

export function DropsStoryViewer({ posts, initialIndex, open, onClose }: DropsStoryViewerProps) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const post = posts[index];
  const config = post ? typeConfig[post.type] : null;

  const goNext = useCallback(() => {
    if (index < posts.length - 1) {
      setIndex(i => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [index, posts.length, onClose]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex(i => i - 1);
      setProgress(0);
    }
  }, [index]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
      setProgress(0);
      setIsPaused(false);
    }
  }, [open, initialIndex]);

  // Auto-advance timer
  useEffect(() => {
    if (!open || isPaused) return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + (100 / (STORY_DURATION / TICK_INTERVAL));
      });
    }, TICK_INTERVAL);
    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [open, isPaused, index, goNext]);

  // Touch/swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
    if (dy > 80) { onClose(); return; } // swipe down to close
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartRef.current = null;
  };

  // Tap zones (left third = prev, right third = next, center = pause)
  const handleTap = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    if (x < third) goPrev();
    else if (x > third * 2) goNext();
    else setIsPaused(p => !p);
  };

  if (!open || !post || !config) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3 pt-[max(12px,env(safe-area-inset-top))]">
          {posts.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-white/15 overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={false}
                animate={{
                  width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
                }}
                transition={{ duration: 0.05, ease: "linear" }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-[max(44px,calc(env(safe-area-inset-top)+32px))] left-4 right-4 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-2xl bg-gradient-to-br shadow-lg", config.gradient)}>
              <config.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold tracking-tight">{config.label}</p>
              <p className="text-white/50 text-xs">{formatRelativeDate(post.published_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setIsPaused(p => !p); }}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
            >
              {isPaused ? <Play className="h-4 w-4 text-white" /> : <Pause className="h-4 w-4 text-white" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Background image with parallax-like scale */}
        <AnimatePresence mode="wait">
          <motion.div
            key={post.id}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {post.cover_image ? (
              <img
                src={post.cover_image}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className={cn("absolute inset-0 bg-gradient-to-b", placeholderGradients[post.type])} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/40" />
          </motion.div>
        </AnimatePresence>

        {/* Content overlay */}
        <AnimatePresence mode="wait">
          <motion.div
            key={post.id + "-content"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="absolute bottom-0 left-0 right-0 p-6 pb-[max(32px,calc(env(safe-area-inset-bottom)+20px))] z-10"
          >
            {post.visibility !== "ALL" && (
              <Badge className="mb-3 bg-white/10 backdrop-blur-md text-white border-0 text-xs">
                🔒 {post.visibility === "BLACK_ONLY" ? "Black" : "Privilege+"}
              </Badge>
            )}
            <h2 className="text-white text-2xl sm:text-3xl font-bold leading-tight mb-3 tracking-tight">
              {post.title}
            </h2>
            <p className="text-white/60 text-sm leading-relaxed line-clamp-3 max-w-lg">
              {getExcerpt(post, 200)}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/drops/${post.id}`); }}
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all hover:gap-3 active:scale-95"
            >
              Ler matéria <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Nav hints - subtle */}
        {index > 0 && (
          <div className="absolute top-1/2 left-3 -translate-y-1/2 z-10 opacity-20">
            <ChevronLeft className="h-8 w-8 text-white" />
          </div>
        )}
        {index < posts.length - 1 && (
          <div className="absolute top-1/2 right-3 -translate-y-1/2 z-10 opacity-20">
            <ChevronRight className="h-8 w-8 text-white" />
          </div>
        )}

        {/* Pause overlay */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 p-6 rounded-full bg-black/40 backdrop-blur-lg"
            >
              <Pause className="h-8 w-8 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
