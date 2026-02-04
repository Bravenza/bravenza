import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

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
      <div className="min-h-screen bg-background text-foreground relative flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md relative"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-4">Você está na lista!</h1>
          <p className="text-muted-foreground mb-8">
            Entraremos em contato quando houver uma vaga disponível no Vault Club. 
            Fique atento ao seu email.
          </p>
          <Button asChild variant="outline" className="border-border">
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
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-radial-glow pointer-events-none" />
      
      {/* Header */}
      <header className="relative border-b border-border/30 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
          <Link to="/vault" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <Link to="/vault" className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-muted-foreground font-medium hidden sm:inline">Vault</span>
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="relative py-16 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="max-w-md mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="card-premium-gold">
              <CardHeader className="text-center">
                <CardTitle className="font-display text-2xl">Lista de espera</CardTitle>
                <CardDescription className="text-muted-foreground">
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
                      className="bg-secondary/30 border-border/50"
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
                      className="bg-secondary/30 border-border/50"
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
                      className="bg-secondary/30 border-border/50"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-secondary/30 border-border/50"
                      placeholder="São Paulo, SP"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="interests">Quais tênis você procura?</Label>
                    <Textarea
                      id="interests"
                      value={formData.interests}
                      onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                      className="bg-secondary/30 border-border/50 min-h-[100px]"
                      placeholder="Ex: Air Jordan 1, Dunks raros, New Balance colaborações..."
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-gold"
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
