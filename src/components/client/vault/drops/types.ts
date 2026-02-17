import { Radar, BookOpen, AlertTriangle, Calendar } from "lucide-react";

export interface DropsPost {
  id: string;
  type: "RADAR" | "GUIDE" | "ALERT" | "EVENT";
  title: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  media_urls: string[] | null;
  video_url: string | null;
  external_link: string | null;
  read_time_min: number | null;
  is_featured: boolean | null;
  visibility: "ALL" | "PRIVILEGE_PLUS" | "BLACK_ONLY";
  published_at: string;
  likes_count?: number;
}

export const typeConfig = {
  RADAR: { icon: Radar, label: "Radar", gradient: "from-blue-600 to-cyan-500", color: "text-blue-400", bg: "bg-blue-500/10" },
  GUIDE: { icon: BookOpen, label: "Guia", gradient: "from-emerald-600 to-teal-500", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ALERT: { icon: AlertTriangle, label: "Alerta", gradient: "from-amber-600 to-orange-500", color: "text-amber-400", bg: "bg-amber-500/10" },
  EVENT: { icon: Calendar, label: "Evento", gradient: "from-purple-600 to-pink-500", color: "text-purple-400", bg: "bg-purple-500/10" },
} as const;

export const placeholderGradients: Record<string, string> = {
  RADAR: "from-blue-900 via-blue-800 to-cyan-900",
  GUIDE: "from-emerald-900 via-emerald-800 to-teal-900",
  ALERT: "from-amber-900 via-orange-800 to-red-900",
  EVENT: "from-purple-900 via-purple-800 to-pink-900",
};

export const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 1) return "Agora";
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

export const getExcerpt = (post: DropsPost, maxLen = 120) => {
  if (post.excerpt) return post.excerpt;
  const text = post.content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
};
