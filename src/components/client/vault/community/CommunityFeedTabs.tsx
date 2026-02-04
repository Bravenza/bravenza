import { motion } from "framer-motion";
import { Sparkles, Users } from "lucide-react";

interface CommunityFeedTabsProps {
  activeTab: "for_you" | "following";
  onTabChange: (tab: "for_you" | "following") => void;
  followingCount?: number;
}

export function CommunityFeedTabs({ activeTab, onTabChange, followingCount = 0 }: CommunityFeedTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg border border-border/50">
      <button
        onClick={() => onTabChange("for_you")}
        className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
          activeTab === "for_you"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground/80"
        }`}
      >
        {activeTab === "for_you" && (
          <motion.div
            layoutId="feedTab"
            className="absolute inset-0 bg-card border border-border/50 rounded-md shadow-sm"
            transition={{ type: "spring", duration: 0.3 }}
          />
        )}
        <span className="relative flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Para Você
        </span>
      </button>
      
      <button
        onClick={() => onTabChange("following")}
        className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
          activeTab === "following"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground/80"
        }`}
      >
        {activeTab === "following" && (
          <motion.div
            layoutId="feedTab"
            className="absolute inset-0 bg-card border border-border/50 rounded-md shadow-sm"
            transition={{ type: "spring", duration: 0.3 }}
          />
        )}
        <span className="relative flex items-center gap-2">
          <Users className="h-4 w-4" />
          Seguindo
          {followingCount > 0 && (
            <span className="text-xs text-muted-foreground">({followingCount})</span>
          )}
        </span>
      </button>
    </div>
  );
}
