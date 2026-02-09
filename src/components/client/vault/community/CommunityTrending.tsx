import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Heart, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface TrendingPost {
  id: string;
  title: string;
  author_name: string;
  likes_count: number;
  comments_count: number;
}

interface CommunityTrendingProps {
  onSelectPost?: (postId: string) => void;
  onProfileClick?: (memberId: string) => void;
}

export function CommunityTrending({ onSelectPost }: CommunityTrendingProps) {
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const { data, error } = await supabase.rpc("get_trending_posts", { p_limit: 5 });
      if (!error && data) setTrendingPosts(data as TrendingPost[]);
    } catch {} finally { setIsLoading(false); }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-3 w-20 bg-muted/20 rounded animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (trendingPosts.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Em alta</span>
      </div>

      <div className="space-y-3">
        {trendingPosts.map((post, index) => (
          <motion.button
            key={post.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectPost?.(post.id)}
            className="block w-full text-left group"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-[10px] font-bold text-muted-foreground/40 mt-0.5 shrink-0 w-4">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                    <Heart className="h-2.5 w-2.5" /> {post.likes_count}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                    <MessageCircle className="h-2.5 w-2.5" /> {post.comments_count}
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
