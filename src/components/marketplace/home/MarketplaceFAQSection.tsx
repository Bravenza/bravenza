import { memo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { STALE, GC_TIME } from "@/lib/query-config";
import { motion } from "framer-motion";
import { HelpCircle, Search, Users, ShoppingBag, Store } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  persona: string | null;
  tags: string[] | null;
  rank?: number;
}

const PERSONA_FILTERS = [
  { id: "all", label: "Todos", icon: Users },
  { id: "comprador", label: "Comprador", icon: ShoppingBag },
  { id: "vendedor", label: "Vendedor", icon: Store },
];

// Fallback static FAQs
const STATIC_FAQS: FAQ[] = [
  { id: "1", question: "Como funciona a compra no marketplace?", answer: "Escolha o sneaker desejado, selecione o tamanho e finalize a compra com pagamento protegido. Dependendo da modalidade, o vendedor envia direto para você ou para o Hub Bravenza, onde nossa equipe realiza a inspeção de autenticidade antes do envio. O pagamento só é liberado ao vendedor após a confirmação de recebimento.", category: "geral", persona: "comprador", tags: null },
  { id: "2", question: "O marketplace é seguro?", answer: "100%. O pagamento fica retido até você receber e aprovar o produto. Se o item não passar na inspeção obrigatória (acima de R$ 2.000) ou opcional, você recebe reembolso total automaticamente. Zero fraudes registradas desde o início da operação.", category: "geral", persona: "comprador", tags: null },
  { id: "3", question: "Como vender meus sneakers?", answer: "Crie seu perfil de vendedor (com verificação de identidade), cadastre seus itens com fotos e preço, e aguarde compradores. Após a venda, envie o sneaker conforme a modalidade escolhida. O repasse do valor é feito em até 8 dias úteis após a confirmação de recebimento pelo comprador.", category: "geral", persona: "vendedor", tags: null },
  { id: "4", question: "Qual a taxa de comissão?", answer: "A taxa varia de 8% a 14% dependendo do seu nível de vendedor (Bronze, Prata, Ouro ou Elite). Quanto mais vendas bem sucedidas, menor a comissão e mais rápido o repasse.", category: "geral", persona: "vendedor", tags: null },
  { id: "5", question: "A verificação de autenticidade é obrigatória?", answer: "Sim, para itens acima de R$ 2.000. Abaixo desse valor, a verificação é opcional e pode ser contratada por R$ 49,90. Em ambos os casos, a verificação técnica é opinativa e segue um processo rigoroso de 6 etapas, incluindo inspeção visual, verificação de códigos e certificação digital.", category: "geral", persona: null, tags: null },
  { id: "6", question: "E se o produto não for autêntico?", answer: "Se nossa equipe identificar qualquer irregularidade durante a inspeção, a venda é cancelada e o comprador recebe reembolso integral. O vendedor é notificado e pode estar sujeito a penalidades conforme as regras do marketplace.", category: "geral", persona: null, tags: null },
];

export const MarketplaceFAQSection = memo(function MarketplaceFAQSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activePersona, setActivePersona] = useState("all");
  const [searchResults, setSearchResults] = useState<FAQ[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data: dbFaqs } = useQuery({
    queryKey: ["marketplace-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("id, question, answer, category, persona, tags")
        .eq("is_active", true)
        .order("order_index");
      if (error || !data || data.length === 0) return null;
      return data as FAQ[];
    },
    staleTime: STALE.STATIC,
    gcTime: GC_TIME.LONG,
  });

  const faqs = searchResults || dbFaqs || STATIC_FAQS;
  const hasLoadedDb = !!dbFaqs;

  // Search with RPC
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.rpc("search_faqs", {
        p_query: query,
        ...(activePersona !== "all" ? { p_persona: activePersona } : {}),
      });
      if (!error && data && (data as any[]).length > 0) {
        setSearchResults((data as any[]).map((d: any) => ({
          id: d.id,
          question: d.question,
          answer: d.answer,
          category: d.category,
          persona: d.persona,
          tags: d.tags,
          rank: d.rank,
        })));
      } else if (!error) {
        setSearchResults([]);
      }
    } catch {
      // Keep current
    } finally {
      setIsSearching(false);
    }
  }, [activePersona, hasLoadedDb]);

  // Filter by persona
  const filteredFaqs = activePersona === "all"
    ? faqs
    : faqs.filter((f) => !f.persona || f.persona === activePersona);

  return (
    <section className="py-16 md:py-20 border-t border-border/30">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-5">
            <HelpCircle className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2 font-display">
            Perguntas frequentes
          </h2>
          <p className="text-sm text-muted-foreground">
            Tire suas dúvidas sobre o marketplace Bravenza
          </p>
        </motion.div>

        {/* Search + Persona filter */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="space-y-3 mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar dúvidas..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex gap-2">
            {PERSONA_FILTERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePersona(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activePersona === p.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <p.icon className="h-3 w-3" />
                {p.label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {isSearching ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Buscando...</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma pergunta encontrada</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tente buscar com outros termos</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-3">
              {filteredFaqs.map((faq, i) => (
                <AccordionItem
                  key={faq.id}
                  value={`faq-${faq.id}`}
                  className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm px-5 data-[state=open]:border-primary/20 data-[state=open]:shadow-md data-[state=open]:shadow-primary/5 transition-all"
                >
                  <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4">
                    <span className="flex items-center gap-2 text-left">
                      {faq.question}
                      {faq.persona && (
                        <Badge variant="outline" className="text-[9px] shrink-0 font-normal">
                          {faq.persona === "comprador" ? "Comprador" : "Vendedor"}
                        </Badge>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                    {faq.answer}
                    {faq.tags && faq.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {faq.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[9px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </motion.div>
      </div>
    </section>
  );
});
