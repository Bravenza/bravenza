import { motion } from "framer-motion";
import { Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunityFeedTabsProps {
  activeTab: "for_you" | "following";
  onTabChange: (tab: "for_you" | "following") => void;
  followingCount?: number;
}

export function CommunityFeedTabs({ activeTab, onTabChange, followingCount = 0 }: CommunityFeedTabsProps) {
  const tabs = [
    { id: "for_you" as const, label: "Para você", icon: Sparkles },
    { id: "following" as const, label: "Seguindo", icon: Users, count: followingCount },
  ];

  return (
    <div className="flex border-b border-border/30">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors min-h-[48px]",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="text-[10px] text-muted-foreground/60">({tab.count})</span>
            )}
            {isActive && (
              <motion.div
                layoutId="community-feed-indicator"
                className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-primary rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
