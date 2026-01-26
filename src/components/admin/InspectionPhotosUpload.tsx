import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InspectionPhotosUploadProps {
  orderId: string;
  existingPhotos: string[];
  onPhotosChange: (photos: string[]) => void;
  isEditing?: boolean;
}

export const InspectionPhotosUpload = ({
  orderId,
  existingPhotos,
  onPhotosChange,
  isEditing = false,
}: InspectionPhotosUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>(existingPhotos || []);

  // Sync with external existingPhotos
  useEffect(() => {
    setPhotos(existingPhotos || []);
  }, [existingPhotos]);

  const savePhotosToOrder = async (updatedPhotos: string[]) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ inspection_photos: updatedPhotos })
        .eq("order_id", orderId);

      if (error) {
        console.error("Error saving photos:", error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar as fotos no pedido.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error saving photos:", err);
      return false;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newPhotos: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Arquivo inválido",
            description: `${file.name} não é uma imagem válida.`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name} excede o limite de 5MB.`,
            variant: "destructive",
          });
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${orderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from("inspection-photos")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Upload error:", error);
          toast({
            title: "Erro no upload",
            description: `Falha ao enviar ${file.name}.`,
            variant: "destructive",
          });
          continue;
        }

        // Get public URL
        const { data: publicUrl } = supabase.storage
          .from("inspection-photos")
          .getPublicUrl(data.path);

        newPhotos.push(publicUrl.publicUrl);
      }

      if (newPhotos.length > 0) {
        const updatedPhotos = [...photos, ...newPhotos];
        setPhotos(updatedPhotos);
        onPhotosChange(updatedPhotos);

        // Save directly to database
        const saved = await savePhotosToOrder(updatedPhotos);
        
        if (saved) {
          toast({
            title: "Fotos enviadas!",
            description: `${newPhotos.length} foto(s) adicionada(s) e salva(s) com sucesso.`,
          });
        }
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar as fotos.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async (photoUrl: string) => {
    try {
      // Extract path from URL
      const urlParts = photoUrl.split("/inspection-photos/");
      if (urlParts.length > 1) {
        const path = urlParts[1];
        await supabase.storage.from("inspection-photos").remove([path]);
      }

      const updatedPhotos = photos.filter((p) => p !== photoUrl);
      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos);

      // Save directly to database
      const saved = await savePhotosToOrder(updatedPhotos);

      if (saved) {
        toast({
          title: "Foto removida",
          description: "A foto foi removida com sucesso.",
        });
      }
    } catch (error) {
      console.error("Error removing photo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a foto.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="h-5 w-5 text-green-500" />
          <span>Fotos da Inspeção</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Adicione fotos mostrando o produto em perfeitas condições antes do despacho.
        </p>

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={photo}
                  alt={`Inspeção ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-border"
                />
                <button
                  onClick={() => handleRemovePhoto(photo)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {photos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma foto de inspeção adicionada</p>
          </div>
        )}

        {/* Upload button - always visible */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full border-dashed"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Adicionar Fotos
            </>
          )}
        </Button>

        {photos.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {photos.length} foto(s) adicionada(s)
          </p>
        )}
      </CardContent>
    </Card>
  );
};
