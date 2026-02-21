import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Supplier {
  id: string;
  name: string;
  country: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  website: string | null;
  specialties: string[] | null;
  payment_methods: string[] | null;
  average_shipping_days: number | null;
  rating: number | null;
  notes: string | null;
  is_active: boolean;
}

const emptySupplier: Partial<Supplier> = {
  name: "",
  country: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  contact_whatsapp: "",
  website: "",
  specialties: [],
  payment_methods: [],
  average_shipping_days: null,
  rating: null,
  notes: "",
  is_active: true,
};

export default function SupplierFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;

  const [supplier, setSupplier] = useState<Partial<Supplier>>({ ...emptySupplier });
  const [specialtiesInput, setSpecialtiesInput] = useState("");
  const [paymentMethodsInput, setPaymentMethodsInput] = useState("");
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      (async () => {
        const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
        if (error) {
          toast({ title: "Erro", description: "Fornecedor não encontrado.", variant: "destructive" });
          navigate("/admin/fornecedores");
          return;
        }
        setSupplier(data);
        setSpecialtiesInput(data.specialties?.join(", ") || "");
        setPaymentMethodsInput(data.payment_methods?.join(", ") || "");
        setIsLoading(false);
      })();
    }
  }, [id]);

  const handleSave = async () => {
    if (!supplier.name || !supplier.country) {
      toast({ title: "Campos obrigatórios", description: "Nome e país são obrigatórios.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const specialtiesArray = specialtiesInput.split(",").map(s => s.trim()).filter(Boolean);
      const paymentMethodsArray = paymentMethodsInput.split(",").map(s => s.trim()).filter(Boolean);

      const payload = {
        name: supplier.name,
        country: supplier.country,
        contact_name: supplier.contact_name,
        contact_email: supplier.contact_email,
        contact_phone: supplier.contact_phone,
        contact_whatsapp: supplier.contact_whatsapp,
        website: supplier.website,
        specialties: specialtiesArray,
        payment_methods: paymentMethodsArray,
        average_shipping_days: supplier.average_shipping_days,
        rating: supplier.rating,
        notes: supplier.notes,
        is_active: supplier.is_active ?? true,
      };

      if (isEditing) {
        const { error } = await supabase.from("suppliers").update(payload).eq("id", id);
        if (error) throw error;
        toast({ title: "Fornecedor atualizado com sucesso!" });
      } else {
        const { error } = await supabase.from("suppliers").insert([payload]);
        if (error) throw error;
        toast({ title: "Fornecedor cadastrado com sucesso!" });
      }

      navigate("/admin/fornecedores");
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast({ title: "Erro", description: "Não foi possível salvar o fornecedor.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/fornecedores">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}</h1>
          <p className="text-muted-foreground">Preencha as informações do fornecedor</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" value={supplier.name || ""} onChange={(e) => setSupplier({ ...supplier, name: e.target.value })} placeholder="Nome do fornecedor" className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País *</Label>
                <Input id="country" value={supplier.country || ""} onChange={(e) => setSupplier({ ...supplier, country: e.target.value })} placeholder="Ex: Estados Unidos" className="bg-secondary/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={supplier.website || ""} onChange={(e) => setSupplier({ ...supplier, website: e.target.value })} placeholder="https://fornecedor.com" className="bg-secondary/50" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="is_active" checked={supplier.is_active ?? true} onCheckedChange={(checked) => setSupplier({ ...supplier, is_active: checked })} />
              <Label htmlFor="is_active">Fornecedor ativo</Label>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Nome do Contato</Label>
              <Input id="contact_name" value={supplier.contact_name || ""} onChange={(e) => setSupplier({ ...supplier, contact_name: e.target.value })} placeholder="Nome da pessoa de contato" className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email</Label>
              <Input id="contact_email" type="email" value={supplier.contact_email || ""} onChange={(e) => setSupplier({ ...supplier, contact_email: e.target.value })} placeholder="email@fornecedor.com" className="bg-secondary/50" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefone</Label>
                <Input id="contact_phone" value={supplier.contact_phone || ""} onChange={(e) => setSupplier({ ...supplier, contact_phone: e.target.value })} placeholder="+1 555 123-4567" className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_whatsapp">WhatsApp</Label>
                <Input id="contact_whatsapp" value={supplier.contact_whatsapp || ""} onChange={(e) => setSupplier({ ...supplier, contact_whatsapp: e.target.value })} placeholder="+1 555 123-4567" className="bg-secondary/50" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specialties */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Especialidades & Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="specialties">Especialidades (separadas por vírgula)</Label>
              <Input id="specialties" value={specialtiesInput} onChange={(e) => setSpecialtiesInput(e.target.value)} placeholder="Nike, Adidas, Jordan, New Balance" className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_methods">Métodos de Pagamento (separados por vírgula)</Label>
              <Input id="payment_methods" value={paymentMethodsInput} onChange={(e) => setPaymentMethodsInput(e.target.value)} placeholder="Wire Transfer, PayPal, Crypto" className="bg-secondary/50" />
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Performance & Observações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="average_shipping_days">Prazo Médio de Envio (dias)</Label>
                <Input id="average_shipping_days" type="number" value={supplier.average_shipping_days || ""} onChange={(e) => setSupplier({ ...supplier, average_shipping_days: e.target.value ? parseInt(e.target.value) : null })} placeholder="15" className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Avaliação (0-5)</Label>
                <Input id="rating" type="number" step="0.1" min="0" max="5" value={supplier.rating || ""} onChange={(e) => setSupplier({ ...supplier, rating: e.target.value ? parseFloat(e.target.value) : null })} placeholder="4.5" className="bg-secondary/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" value={supplier.notes || ""} onChange={(e) => setSupplier({ ...supplier, notes: e.target.value })} placeholder="Informações adicionais sobre o fornecedor..." className="bg-secondary/50" rows={3} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Link to="/admin/fornecedores">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={handleSave} className="btn-gold" disabled={isSaving}>
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : <><Save className="mr-2 h-4 w-4" />{isEditing ? "Salvar Alterações" : "Cadastrar"}</>}
        </Button>
      </div>
    </div>
  );
}
