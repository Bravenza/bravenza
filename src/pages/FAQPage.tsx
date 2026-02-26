import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, Package, CreditCard, Shield, Truck, MessageCircle, Search, ShoppingBag, Store, Crown } from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Helmet } from "react-helmet-async";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  order_index: number;
  persona: string | null;
}

const CATEGORY_ICONS: Record<string, any> = {
  curadoria: Package,
  pagamento: CreditCard,
  prazos: Truck,
  garantia: Shield,
  marketplace: ShoppingBag,
  vendedor: Store,
  "vault-club": Crown,
  geral: HelpCircle,
};

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  curadoria: "faq.catCuradoria",
  pagamento: "faq.catPagamento",
  prazos: "faq.catPrazos",
  garantia: "faq.catGarantia",
  marketplace: "faq.catMarketplace",
  vendedor: "faq.catVendedor",
  "vault-club": "faq.catVaultClub",
  geral: "faq.catGeral",
};

const CATEGORY_DESC_KEYS: Record<string, string> = {
  curadoria: "faq.catDescCuradoria",
  pagamento: "faq.catDescPagamento",
  prazos: "faq.catDescPrazos",
  garantia: "faq.catDescGarantia",
  marketplace: "faq.catDescMarketplace",
  vendedor: "faq.catDescVendedor",
  "vault-club": "faq.catDescVaultClub",
  geral: "faq.catDescGeral",
};

// Preferred display order for categories
const CATEGORY_ORDER = ["curadoria", "marketplace", "garantia", "pagamento", "prazos", "vault-club", "vendedor", "geral"];

export default function FAQPage() {
  const { t } = useTranslation();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePersona, setActivePersona] = useState("all");
  const [search, setSearch] = useState("");

  const PERSONA_OPTIONS = useMemo(() => [
    { value: "all", label: t("faq.allQuestions"), description: t("faq.allQuestionsDesc") },
    { value: "comprador", label: t("faq.imBuyer"), description: t("faq.imBuyerDesc") },
    { value: "vendedor", label: t("faq.imSeller"), description: t("faq.imSellerDesc") },
  ], [t]);

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

  const filteredFaqs = useMemo(() => {
    let result = faqs;
    if (activePersona === "vendedor") {
      result = result.filter((faq) => faq.persona === "vendedor");
    } else if (activePersona === "comprador") {
      result = result.filter(
        (faq) => faq.persona === "comprador" || faq.persona === "all"
      );
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
  }, [faqs, activePersona, search]);

  const faqsByCategory = useMemo(
    () =>
      filteredFaqs.reduce((acc, faq) => {
        if (!acc[faq.category]) acc[faq.category] = [];
        acc[faq.category].push(faq);
        return acc;
      }, {} as Record<string, FAQ[]>),
    [filteredFaqs]
  );

  const sortedCategories = useMemo(
    () =>
      Object.keys(faqsByCategory).sort(
        (a, b) =>
          (CATEGORY_ORDER.indexOf(a) === -1 ? 99 : CATEGORY_ORDER.indexOf(a)) -
          (CATEGORY_ORDER.indexOf(b) === -1 ? 99 : CATEGORY_ORDER.indexOf(b))
      ),
    [faqsByCategory]
  );

  return (
    <PublicLayout className="theme-light">
      <Helmet>
        <title>{t("faq.pageTitle")}</title>
        <meta name="description" content={t("faq.metaDescription")} />
        <link rel="canonical" href="https://bravenza.com.br/faq" />
      </Helmet>

      <section className="py-12 md:py-20 theme-light">
        <div className="container mx-auto px-4 sm:px-6">
          {/* ===== HEADER ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 md:mb-14 max-w-2xl mx-auto"
          >
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-3 tracking-tight">
              {t("faq.heroTitle")} <span className="text-gradient-gold">{t("faq.heroTitleHighlight")}</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mb-8">
              {t("faq.heroSubtitle")}
            </p>

            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t("faq.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 text-base rounded-xl bg-card border-border/60"
              />
            </div>
          </motion.div>

          {/* ===== PERSONA CARDS ===== */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-12"
          >
            {PERSONA_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setActivePersona(option.value)}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-4 rounded-xl border text-center transition-all",
                  activePersona === option.value
                    ? "border-primary bg-primary/8 shadow-sm"
                    : "border-border/50 bg-card/50 hover:bg-card hover:border-border"
                )}
              >
                <span className={cn("text-sm font-semibold", activePersona === option.value ? "text-primary" : "text-foreground")}>
                  {option.label}
                </span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </button>
            ))}
          </motion.div>

          {/* ===== CONTENT ===== */}
          {isLoading ? (
            <div className="max-w-3xl mx-auto space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {sortedCategories.length === 0 && (
                <div className="text-center py-16">
                  <HelpCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {search ? t("faq.noResultsFor", { search }) : t("faq.noResults")}
                  </p>
                </div>
              )}

              {sortedCategories.map((category, catIdx) => {
                const Icon = CATEGORY_ICONS[category] || HelpCircle;
                const items = faqsByCategory[category];

                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIdx * 0.06 }}
                    className="mb-10"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-base md:text-lg font-bold text-foreground">
                          {t(CATEGORY_LABEL_KEYS[category] || category)}
                        </h2>
                        {CATEGORY_DESC_KEYS[category] && (
                          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                            {t(CATEGORY_DESC_KEYS[category])}
                          </p>
                        )}
                      </div>
                    </div>

                    <Accordion type="single" collapsible className="space-y-2">
                      {items.map((faq) => (
                        <AccordionItem
                          key={faq.id}
                          value={faq.id}
                          className="border border-border/40 rounded-xl px-4 bg-card/40 hover:bg-card/80 transition-colors data-[state=open]:bg-card data-[state=open]:border-border/70"
                        >
                          <AccordionTrigger className="text-left hover:no-underline py-4">
                            <span className="font-medium text-sm md:text-base pr-2 text-foreground">
                              {faq.question}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground pb-4 text-sm md:text-base leading-relaxed">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </motion.div>
                );
              })}

              {/* WhatsApp CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-16 text-center rounded-2xl border border-border/40 bg-card/60 p-8 md:p-10"
              >
                <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-1">{t("faq.stillHaveQuestions")}</h3>
                <p className="text-muted-foreground text-sm mb-5">{t("faq.teamReady")}</p>
                <a
                  href="https://wa.me/5551981055425?text=Olá!%20Tenho%20uma%20dúvida%20sobre%20a%20BRAVENZA."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors text-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("faq.talkToUs")}
                </a>
              </motion.div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
