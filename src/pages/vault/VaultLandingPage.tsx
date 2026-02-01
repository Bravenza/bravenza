import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Crown, Sparkles, Users, Search, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const tiers = [
  {
    name: "Vault Access",
    icon: Shield,
    color: "text-zinc-400",
    bgColor: "bg-zinc-900",
    borderColor: "border-zinc-700",
    benefits: [
      "Até 3 itens na wishlist",
      "1 busca ativa por vez",
      "2 convites por semestre",
      "Curadoria dedicada",
    ],
  },
  {
    name: "Vault Privilege",
    icon: Crown,
    color: "text-amber-400",
    bgColor: "bg-zinc-900",
    borderColor: "border-amber-500/30",
    benefits: [
      "Wishlist ilimitada",
      "3 buscas ativas simultâneas",
      "3 convites por semestre",
      "SLA prioritário",
      "Conteúdo exclusivo",
    ],
    featured: true,
  },
  {
    name: "Vault Black",
    icon: Sparkles,
    color: "text-white",
    bgColor: "bg-gradient-to-br from-zinc-900 to-black",
    borderColor: "border-white/20",
    benefits: [
      "Acesso total ao clube",
      "5 buscas ativas simultâneas",
      "5 convites por semestre",
      "Atendimento VIP",
      "Conteúdo Black exclusivo",
      "Janela de decisão estendida",
    ],
    exclusive: true,
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Descreva o que procura",
    description: "Adicione o tênis dos seus sonhos à sua wishlist com todos os detalhes",
    icon: Search,
  },
  {
    step: 2,
    title: "Nossa curadoria busca",
    description: "Ativamos a busca e vasculhamos o mercado global com fornecedores verificados",
    icon: Users,
  },
  {
    step: 3,
    title: "Você decide",
    description: "Apresentamos as melhores opções na Match Room para sua decisão",
    icon: CheckCircle2,
  },
  {
    step: 4,
    title: "Receba com certificado",
    description: "Seu tênis chega com Vault ID único, certificado e verificação por QR code",
    icon: Shield,
  },
];

export default function VaultLandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
        >
          <Badge variant="outline" className="mb-6 border-amber-500/30 text-amber-400">
            <Lock className="w-3 h-3 mr-1" />
            Acesso por convite
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
            Bravenza{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              Vault Club
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Curadoria global exclusiva de tênis para colecionadores. 
            Não existe catálogo. Existe a sua busca e a nossa dedicação.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              <Link to="/vault/redeem">
                Recebi um convite
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-zinc-700 hover:bg-zinc-900">
              <Link to="/vault/waitlist">
                Entrar na lista de espera
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como funciona</h2>
            <p className="text-zinc-400">Curadoria personalizada do início ao fim</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-zinc-900 border-zinc-800 h-full">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                      <item.icon className="h-6 w-6 text-amber-500" />
                    </div>
                    <div className="text-sm text-amber-500 font-medium mb-2">Passo {item.step}</div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-zinc-400">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers Section */}
      <section className="py-24 px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Níveis do clube</h2>
            <p className="text-zinc-400">Evolua conforme sua jornada no Vault</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${tier.bgColor} border ${tier.borderColor} h-full ${tier.featured ? 'ring-2 ring-amber-500/30' : ''} ${tier.exclusive ? 'ring-2 ring-white/20' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <tier.icon className={`h-6 w-6 ${tier.color}`} />
                      <h3 className="text-xl font-bold">{tier.name}</h3>
                    </div>
                    {tier.exclusive && (
                      <Badge className="mb-4 bg-white/10 text-white border-0">
                        Somente por convite
                      </Badge>
                    )}
                    <ul className="space-y-3">
                      {tier.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2 text-sm text-zinc-300">
                          <CheckCircle2 className={`h-4 w-4 ${tier.color} flex-shrink-0 mt-0.5`} />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-t from-zinc-900 to-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <Shield className="h-16 w-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para entrar no Vault?
          </h2>
          <p className="text-zinc-400 mb-8">
            Se você tem um convite, resgate agora. Se não, entre na lista de espera 
            e aguarde sua vez de fazer parte do clube.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              <Link to="/vault/redeem">Resgatar convite</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-zinc-700 hover:bg-zinc-900">
              <Link to="/vault/waitlist">Lista de espera</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Bravenza Vault Club. Todos os direitos reservados.
          </div>
          <div className="flex gap-6">
            <Link to="/termos" className="text-sm text-zinc-500 hover:text-white transition">
              Termos
            </Link>
            <Link to="/politicas" className="text-sm text-zinc-500 hover:text-white transition">
              Privacidade
            </Link>
            <Link to="/" className="text-sm text-zinc-500 hover:text-white transition">
              Bravenza Store
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}