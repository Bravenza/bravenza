import { useEffect, useState, useMemo, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, Package, CreditCard, Shield, Truck, MessageCircle } from "lucide-react";
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
  geral: HelpCircle
};
const CATEGORY_LABELS: Record<string, string> = {
  importacao: "Curadoria",
  curadoria: "Curadoria",
  pagamentos: "Pagamentos",
  prazos: "Prazos",
  garantia: "Garantia",
  pagamento: "Pagamento",
  envio: "Envio",
  geral: "Geral"
};
function FAQSectionComponent() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("curadoria");
  const fetchFAQs = useCallback(async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("faqs").select("*").eq("is_active", true).order("order_index");
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

  // Memoize categories and faqsByCategory to prevent recalculation
  const categories = useMemo(() => [...new Set(faqs.map(faq => faq.category))], [faqs]);
  const faqsByCategory = useMemo(() => faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>), [faqs]);
  if (isLoading) {
    return <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <Skeleton className="h-10 w-64 mx-auto mb-8" />
          <div className="max-w-3xl mx-auto space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
      </section>;
  }
  if (faqs.length === 0) {
    return null;
  }
  return <section id="faq" className="py-16 md:py-20 bg-card/30">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="text-center mb-10 md:mb-12">
          <h2 className="md:text-3xl font-bold mb-3 text-3xl">
            Perguntas <span className="text-primary text-3xl">frequentes</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            Encontre respostas para as dúvidas mais comuns sobre nossos serviços
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <div className="overflow-x-auto -mx-4 px-4 mb-6 md:mb-8">
              <TabsList className="inline-flex w-max md:w-full md:flex md:flex-wrap md:justify-center gap-2 bg-transparent h-auto p-1">
                {categories.map(category => {
                const Icon = CATEGORY_ICONS[category] || HelpCircle;
                return <TabsTrigger key={category} value={category} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap px-3 py-2 text-sm">
                      <Icon className="h-4 w-4 mr-1.5" />
                      {CATEGORY_LABELS[category] || category}
                    </TabsTrigger>;
              })}
              </TabsList>
            </div>

            {categories.map(category => <TabsContent key={category} value={category}>
                <motion.div initial={{
              opacity: 0,
              y: 10
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.3
            }}>
                  <Accordion type="single" collapsible className="space-y-3">
                    {faqsByCategory[category]?.map((faq, index) => <motion.div key={faq.id} initial={{
                  opacity: 0,
                  y: 10
                }} animate={{
                  opacity: 1,
                  y: 0
                }} transition={{
                  delay: index * 0.1
                }}>
                        <AccordionItem value={faq.id} className="border border-border/50 rounded-lg px-3 md:px-4 bg-card/50 hover:bg-card transition-colors">
                          <AccordionTrigger className="text-left hover:no-underline py-3 md:py-4">
                            <span className="font-medium text-sm md:text-base pr-2">{faq.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground pb-3 md:pb-4 text-sm md:text-base">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      </motion.div>)}
                  </Accordion>
                </motion.div>
              </TabsContent>)}
          </Tabs>

          {/* CTA */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="mt-8 md:mt-12 text-center">
            <p className="text-muted-foreground mb-4 text-sm md:text-base">
              Não encontrou o que procurava?
            </p>
            <a href="https://wa.me/5551981055425?text=Olá!%20Tenho%20uma%20dúvida%20sobre%20a%20BRAVENZA." target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm md:text-base">
              <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
              Fale conosco no WhatsApp
            </a>
          </motion.div>
        </div>
      </div>
    </section>;
}
export const FAQSection = memo(FAQSectionComponent);