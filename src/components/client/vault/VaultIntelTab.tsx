import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Newspaper, Radar, BookOpen, AlertTriangle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface IntelPost {
  id: string;
  type: "RADAR" | "GUIDE" | "ALERT" | "EVENT";
  title: string;
  content: string;
  visibility: "ALL" | "PRIVILEGE_PLUS" | "BLACK_ONLY";
  published_at: string;
}

interface VaultIntelTabProps {
  clientCpf: string;
}

const typeConfig = {
  RADAR: { icon: Radar, label: "Radar", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  GUIDE: { icon: BookOpen, label: "Guia", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  ALERT: { icon: AlertTriangle, label: "Alerta", color: "text-amber-500", bgColor: "bg-amber-500/10" },
  EVENT: { icon: Calendar, label: "Evento", color: "text-purple-500", bgColor: "bg-purple-500/10" },
};

export function VaultIntelTab({ clientCpf }: VaultIntelTabProps) {
  const [posts, setPosts] = useState<IntelPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchPosts();
  }, [clientCpf]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_vault_intel_posts", { p_cpf: clientCpf });
      
      if (!error && data) {
        setPosts(data as unknown as IntelPost[]);
      }
    } catch (error) {
      console.error("Error fetching intel posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredPosts = filter === "all" 
    ? posts 
    : posts.filter(p => p.type === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="RADAR">
            <Radar className="h-4 w-4 mr-1" />
            Radar
          </TabsTrigger>
          <TabsTrigger value="GUIDE">
            <BookOpen className="h-4 w-4 mr-1" />
            Guias
          </TabsTrigger>
          <TabsTrigger value="ALERT">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="EVENT">
            <Calendar className="h-4 w-4 mr-1" />
            Eventos
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Newspaper className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum conteúdo disponível</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter !== "all" ? "Tente outro filtro" : "Em breve teremos novidades"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post, index) => {
            const config = typeConfig[post.type];
            
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                          <config.icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${config.bgColor} ${config.color} border-0`}>
                              {config.label}
                            </Badge>
                            {post.visibility !== "ALL" && (
                              <Badge variant="outline" className="text-xs">
                                {post.visibility === "BLACK_ONLY" ? "Black" : "Privilege+"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(post.published_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                    <div 
                      className="text-sm text-muted-foreground prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
