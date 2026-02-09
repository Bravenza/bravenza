import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropsPost, typeConfig } from "./types";

interface DropsStoriesProps {
  posts: DropsPost[];
  onOpenStory: (index: number) => void;
}

export function DropsStories({ posts, onOpenStory }: DropsStoriesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  if (posts.length === 0) return null;

  return (
    <div className="relative group">
      {/* Scroll buttons */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-[36px] -translate-y-1/2 z-10 p-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border/40 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 hover:scale-110"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-[36px] -translate-y-1/2 z-10 p-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border/40 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 hover:scale-110"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-3 px-1"
      >
        {posts.map((post, i) => {
          const config = typeConfig[post.type];
          return (
            <motion.button
              key={post.id}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
              onClick={() => onOpenStory(i)}
              className="flex flex-col items-center gap-2 shrink-0 group/story"
            >
              {/* Ring with gradient */}
              <div className="relative">
                <div className={cn(
                  "p-[2.5px] rounded-full bg-gradient-to-br transition-shadow duration-300 group-hover/story:shadow-[0_0_20px_rgba(255,200,0,0.2)]",
                  config.gradient
                )}>
                  <div className="w-[66px] h-[66px] rounded-full bg-background p-[2.5px]">
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full rounded-full object-cover group-hover/story:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className={cn(
                        "w-full h-full rounded-full bg-gradient-to-br flex items-center justify-center",
                        config.gradient
                      )}>
                        <config.icon className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                {/* Pulse indicator for new */}
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background animate-pulse" />
              </div>
              <span className="text-[10px] text-muted-foreground max-w-[76px] truncate group-hover/story:text-foreground transition-colors font-medium">
                {post.title.length > 12 ? post.title.slice(0, 12) + "…" : post.title}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
