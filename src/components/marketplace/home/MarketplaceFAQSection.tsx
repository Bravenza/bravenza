import { memo } from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Como funciona a compra no marketplace?",
    a: "Escolha o sneaker desejado, selecione o tamanho e finalize a compra com pagamento protegido. Dependendo da modalidade, o vendedor envia direto para você ou para o Hub Bravenza, onde nossa equipe realiza a inspeção de autenticidade antes do envio. O pagamento só é liberado ao vendedor após a confirmação de recebimento.",
  },
  {
    q: "O marketplace é seguro?",
    a: "100%. O pagamento fica retido até você receber e aprovar o produto. Se o item não passar na inspeção obrigatória (acima de R$ 2.000) ou opcional, você recebe reembolso total automaticamente. Zero fraudes registradas desde o início da operação.",
  },
  {
    q: "Como vender meus sneakers?",
    a: "Crie seu perfil de vendedor (com verificação de identidade), cadastre seus itens com fotos e preço, e aguarde compradores. Após a venda, envie o sneaker conforme a modalidade escolhida. O repasse do valor é feito em até 8 dias úteis após a confirmação de recebimento pelo comprador.",
  },
  {
    q: "Qual a taxa de comissão?",
    a: "A taxa varia de 8% a 14% dependendo do seu nível de vendedor (Bronze, Prata, Ouro ou Elite). Quanto mais vendas bem sucedidas, menor a comissão e mais rápido o repasse.",
  },
  {
    q: "A verificação de autenticidade é obrigatória?",
    a: "Sim, para itens acima de R$ 2.000. Abaixo desse valor, a verificação é opcional e pode ser contratada por R$ 49,90. Em ambos os casos, a verificação técnica é opinativa e segue um processo rigoroso de 6 etapas, incluindo inspeção visual, verificação de códigos e certificação digital.",
  },
  {
    q: "E se o produto não for autêntico?",
    a: "Se nossa equipe identificar qualquer irregularidade durante a inspeção, a venda é cancelada e o comprador recebe reembolso integral. O vendedor é notificado e pode estar sujeito a penalidades conforme as regras do marketplace.",
  },
];

export const MarketplaceFAQSection = memo(function MarketplaceFAQSection() {
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

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm px-5 data-[state=open]:border-primary/20 data-[state=open]:shadow-md data-[state=open]:shadow-primary/5 transition-all"
              >
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
});
