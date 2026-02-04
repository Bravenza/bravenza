import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Heart, MessageCircle, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export function CommunityTrending({ onSelectPost }: CommunityTrendingProps) {
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const { data, error } = await supabase.rpc("get_trending_posts", {
        p_limit: 5,
      });
      
      if (!error && data) {
        setTrendingPosts(data as TrendingPost[]);
      }
    } catch (error) {
      console.error("Error fetching trending:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="card-premium">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Em alta
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : trendingPosts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhum post em destaque
          </p>
        ) : (
          <div className="space-y-3">
            {trendingPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectPost?.(post.id)}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <span className={`
                  flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${index === 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white' : 
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                    index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white' :
                    'bg-muted text-muted-foreground'}
                `}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {post.comments_count}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
