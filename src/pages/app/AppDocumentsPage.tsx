import { Helmet } from "react-helmet-async";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AppContext {
  cpf: string | null;
  profile: { full_name?: string; cpf?: string } | null;
}

export default function AppDocumentsPage() {
  const { cpf } = useOutletContext<AppContext>();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["client-documents", cpf],
    queryFn: async () => {
      if (!cpf) return [];
      const { data, error } = await supabase
        .from("client_documents")
        .select("*")
        .eq("client_cpf", cpf)
        .order("generated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!cpf,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Helmet>
        <title>Documentos | BRAVENZA</title>
      </Helmet>
      <h1 className="text-xl font-bold mb-6">Documentos</h1>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : !documents?.length ? (
        <div className="text-center py-16">
          <File className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum documento disponível</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Laudos de autenticidade e recibos aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card hover:bg-secondary/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.document_name}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.document_type} · {formatDistanceToNow(new Date(doc.generated_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                asChild
              >
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
