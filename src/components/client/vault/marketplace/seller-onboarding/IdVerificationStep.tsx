import { useState, useRef } from "react";
import { Camera, Upload, CheckCircle2, AlertCircle, X, CreditCard, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface IdDocuments {
  front: File | null;
  back: File | null;
  selfie: File | null;
}

interface IdVerificationStepProps {
  documents: IdDocuments;
  setDocuments: (docs: IdDocuments) => void;
}

const DOCUMENT_TYPES = [
  {
    key: "front" as const,
    label: "Frente do documento",
    description: "RG, CNH ou outro documento oficial com foto",
    icon: CreditCard,
  },
  {
    key: "back" as const,
    label: "Verso do documento",
    description: "Parte de trás do mesmo documento",
    icon: CreditCard,
  },
  {
    key: "selfie" as const,
    label: "Selfie com documento",
    description: "Segure o documento ao lado do rosto",
    icon: User,
  },
];

function DocumentUploadCard({
  docKey,
  label,
  description,
  icon: Icon,
  file,
  onSelect,
  onRemove,
}: {
  docKey: string;
  label: string;
  description: string;
  icon: React.ElementType;
  file: File | null;
  onSelect: (f: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo 10MB.");
      return;
    }
    if (!f.type.startsWith("image/")) {
      alert("Apenas imagens são aceitas.");
      return;
    }
    onSelect(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleRemove = () => {
    onRemove();
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Card className={`border transition-colors ${file ? "border-primary/40 bg-primary/5" : "border-border"}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${file ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
            {file ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-sm font-medium">{label}</h4>
              {file && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Enviado</Badge>}
            </div>
            <p className="text-[11px] text-muted-foreground">{description}</p>

            {preview && (
              <div className="relative mt-2 w-full max-w-[160px]">
                <img src={preview} alt={label} className="rounded-md border border-border/50 object-cover w-full h-20" />
                <button onClick={handleRemove} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {!file && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Enviar foto
              </Button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture={docKey === "selfie" ? "user" : undefined}
          className="hidden"
          onChange={handleFile}
        />
      </CardContent>
    </Card>
  );
}

export function IdVerificationStep({ documents, setDocuments }: IdVerificationStepProps) {
  const handleSelect = (key: keyof IdDocuments, file: File) => {
    setDocuments({ ...documents, [key]: file });
  };

  const handleRemove = (key: keyof IdDocuments) => {
    setDocuments({ ...documents, [key]: null });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Para sua segurança e dos compradores, precisamos verificar sua identidade.
        </p>
        <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-accent/50 border border-accent">
          <AlertCircle className="h-4 w-4 text-accent-foreground shrink-0" />
          <p className="text-[11px] text-accent-foreground">
            Seus documentos serão analisados pela equipe Bravenza antes da liberação para venda.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {DOCUMENT_TYPES.map((doc) => (
          <DocumentUploadCard
            key={doc.key}
            docKey={doc.key}
            label={doc.label}
            description={doc.description}
            icon={doc.icon}
            file={documents[doc.key]}
            onSelect={(f) => handleSelect(doc.key, f)}
            onRemove={() => handleRemove(doc.key)}
          />
        ))}
      </div>
    </div>
  );
}
