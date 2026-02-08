import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { marketplaceRequest } from "./api";

export function useMarketplaceSeller(cpf: string | null) {
  const { toast } = useToast();

  const checkOnboardingStatus = useCallback(async () => {
    if (!cpf) return { onboarded: false, seller: null };
    try {
      return await marketplaceRequest(cpf, "seller-onboarding-status");
    } catch {
      return { onboarded: false, seller: null };
    }
  }, [cpf]);

  const completeOnboarding = useCallback(
    async (data: any, documents?: { front: File | null; back: File | null; selfie: File | null }) => {
      if (!cpf) return false;
      try {
        let docUrls: { id_front_url?: string; id_back_url?: string; id_selfie_url?: string } = {};
        if (documents?.front && documents?.back && documents?.selfie) {
          const { supabase } = await import("@/integrations/supabase/client");
          const timestamp = Date.now();
          const sanitizedCpf = cpf.replace(/\D/g, "");

          const uploadDoc = async (file: File, type: string) => {
            const ext = file.name.split(".").pop() || "jpg";
            const path = `${sanitizedCpf}/${type}_${timestamp}.${ext}`;
            const { error } = await supabase.storage.from("seller-kyc-docs").upload(path, file, { upsert: true });
            if (error) throw new Error(`Erro ao enviar ${type}: ${error.message}`);
            return path;
          };

          const [frontPath, backPath, selfiePath] = await Promise.all([
            uploadDoc(documents.front, "front"),
            uploadDoc(documents.back, "back"),
            uploadDoc(documents.selfie, "selfie"),
          ]);

          docUrls = { id_front_url: frontPath, id_back_url: backPath, id_selfie_url: selfiePath };
        }

        await marketplaceRequest(cpf, "seller-onboarding", "POST", { ...data, ...docUrls });
        toast({
          title: "Cadastro enviado!",
          description: "Seus documentos serão analisados pela equipe Bravenza. Você será notificado quando for aprovado.",
        });
        return true;
      } catch (err: any) {
        toast({ title: "Erro no cadastro", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  return { checkOnboardingStatus, completeOnboarding };
}
