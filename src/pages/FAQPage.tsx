import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, Package, CreditCard, Shield, Truck, MessageCircle, Search } from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Helmet } from "react-helmet-async";
import { Input } from "@/components/ui/input";

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  order_index: number;
}

const CATEGORY_ICONS: Record<string, any> = {
  importacao: Package,
  curadoria: Package,
  pagamentos: CreditCard,
  prazos: Truck,
  garantia: Shield,
  pagamento: CreditCard,
  envio: Truck,
  geral: HelpCircle,
};

const CATEGORY_LABELS: Record<string, string> = {
  importacao: "Curadoria",
  curadoria: "Curadoria",
  pagamentos: "Pagamentos",
  prazos: "Prazos",
  garantia: "Garantia",
  pagamento: "Pagamento",
  envio: "Envio",
  geral: "Geral",
};

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const fetchFAQs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_active", true)
        .order("order_index");
      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const categories = useMemo(() => [...new Set(faqs.map((faq) => faq.category))], [faqs]);

  const filteredFaqs = useMemo(() => {
    let result = faqs;
    if (activeCategory !== "all") {
      result = result.filter((faq) => faq.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (faq) =>
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q)
      );
    }
    return result;
  }, [faqs, activeCategory, search]);

  const faqsByCategory = useMemo(
    () =>
      filteredFaqs.reduce((acc, faq) => {
        if (!acc[faq.category]) acc[faq.category] = [];
        acc[faq.category].push(faq);
        return acc;
      }, {} as Record<string, FAQ[]>),
    [filteredFaqs]
  );

  const displayCategories = activeCategory === "all" ? categories : [activeCategory];

  return (
    <PublicLayout>
      <Helmet>
        <title>Perguntas Frequentes | BRAVENZA</title>
        <meta
          name="description"
          content="Encontre respostas para as dúvidas mais comuns sobre curadoria, pagamentos, prazos e garantia na BRAVENZA."
        />
        <link rel="canonical" href="https://bravenza.com.br/faq" />
      </Helmet>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 md:mb-14"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Perguntas <span className="text-gradient-gold">Frequentes</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-8">
              Encontre respostas para as dúvidas mais comuns sobre nossos serviços
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar perguntas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          {isLoading ? (
            <div className="max-w-3xl mx-auto space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {/* Category Tabs */}
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <div className="overflow-x-auto -mx-4 px-4 mb-8">
                  <TabsList className="inline-flex w-max md:w-full md:flex md:flex-wrap md:justify-center gap-2 bg-transparent h-auto p-1">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap px-3 py-2 text-sm"
                    >
                      <HelpCircle className="h-4 w-4 mr-1.5" />
                      Todas
                    </TabsTrigger>
                    {categories.map((category) => {
                      const Icon = CATEGORY_ICONS[category] || HelpCircle;
                      return (
                        <TabsTrigger
                          key={category}
                          value={category}
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap px-3 py-2 text-sm"
                        >
                          <Icon className="h-4 w-4 mr-1.5" />
                          {CATEGORY_LABELS[category] || category}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>

                {/* "All" tab content */}
                <TabsContent value="all">
                  {displayCategories.map((category) => (
                    <div key={category} className="mb-8">
                      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        {(() => {
                          const Icon = CATEGORY_ICONS[category] || HelpCircle;
                          return <Icon className="h-5 w-5 text-primary" />;
                        })()}
                        {CATEGORY_LABELS[category] || category}
                      </h2>
                      <Accordion type="single" collapsible className="space-y-3">
                        {faqsByCategory[category]?.map((faq, index) => (
                          <motion.div
                            key={faq.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <AccordionItem
                              value={faq.id}
                              className="border border-border/50 rounded-lg px-3 md:px-4 bg-card/50 hover:bg-card transition-colors"
                            >
                              <AccordionTrigger className="text-left hover:no-underline py-3 md:py-4">
                                <span className="font-medium text-sm md:text-base pr-2">
                                  {faq.question}
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground pb-3 md:pb-4 text-sm md:text-base">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          </motion.div>
                        ))}
                      </Accordion>
                    </div>
                  ))}
                  {filteredFaqs.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">
                      Nenhuma pergunta encontrada para "{search}"
                    </p>
                  )}
                </TabsContent>

                {/* Individual category tabs */}
                {categories.map((category) => (
                  <TabsContent key={category} value={category}>
                    <Accordion type="single" collapsible className="space-y-3">
                      {faqsByCategory[category]?.map((faq, index) => (
                        <motion.div
                          key={faq.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <AccordionItem
                            value={faq.id}
                            className="border border-border/50 rounded-lg px-3 md:px-4 bg-card/50 hover:bg-card transition-colors"
                          >
                            <AccordionTrigger className="text-left hover:no-underline py-3 md:py-4">
                              <span className="font-medium text-sm md:text-base pr-2">
                                {faq.question}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground pb-3 md:pb-4 text-sm md:text-base">
                              {faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        </motion.div>
                      ))}
                    </Accordion>
                    {(!faqsByCategory[category] || faqsByCategory[category].length === 0) && (
                      <p className="text-center text-muted-foreground py-12">
                        Nenhuma pergunta encontrada{search ? ` para "${search}"` : ""}
                      </p>
                    )}
                  </TabsContent>
                ))}
              </Tabs>

              {/* WhatsApp CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-12 text-center"
              >
                <p className="text-muted-foreground mb-4">
                  Não encontrou o que procurava?
                </p>
                <a
                  href="https://wa.me/5551981055425?text=Olá!%20Tenho%20uma%20dúvida%20sobre%20a%20BRAVENZA."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  Fale conosco no WhatsApp
                </a>
              </motion.div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
