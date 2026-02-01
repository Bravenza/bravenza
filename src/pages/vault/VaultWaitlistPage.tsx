import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function VaultWaitlistPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    interests: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e email",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("vault_waitlist")
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          city: formData.city || null,
          interests: formData.interests || null,
          referral_source: "landing_page",
        });
      
      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Email já cadastrado",
            description: "Este email já está na lista de espera",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }
      
      setIsSuccess(true);
    } catch (error) {
      console.error("Waitlist error:", error);
      toast({
        title: "Erro ao cadastrar",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Você está na lista!</h1>
          <p className="text-zinc-400 mb-8">
            Entraremos em contato quando houver uma vaga disponível no Vault Club. 
            Fique atento ao seu email.
          </p>
          <Button asChild variant="outline" className="border-zinc-700">
            <Link to="/vault">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao início
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="p-4 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/vault" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <Link to="/vault" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <span className="font-semibold">Vault Club</span>
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="py-16 px-4">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Lista de espera</CardTitle>
                <CardDescription className="text-zinc-400">
                  Preencha seus dados para entrar na fila do Vault Club
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">WhatsApp</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="São Paulo, SP"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="interests">Quais tênis você procura?</Label>
                    <Textarea
                      id="interests"
                      value={formData.interests}
                      onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 min-h-[100px]"
                      placeholder="Ex: Air Jordan 1, Dunks raros, New Balance colaborações..."
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Entrar na lista de espera"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}