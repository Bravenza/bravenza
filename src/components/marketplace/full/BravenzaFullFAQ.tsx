import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "Quais são as vantagens de usar o Bravenza Full?",
    answer: "Seu sneaker ganha o selo Verified de autenticidade, fotos profissionais, anúncio otimizado e prioridade nas buscas. Você não precisa se preocupar com nada além de enviar o produto.",
  },
  {
    question: "Quanto custa usar o Bravenza Full?",
    answer: "A comissão é de 22% sobre o valor da venda. Não há taxas antecipadas, mensalidades ou custos escondidos. Você só paga quando o sneaker é vendido.",
  },
  {
    question: "Como envio meu sneaker para o Hub Bravenza?",
    answer: "Após solicitar o serviço pelo app, nossa equipe envia as instruções de envio com o endereço do Hub e orientações de embalagem. Você pode enviar pelos Correios ou transportadora de sua preferência.",
  },
  {
    question: "Existe um limite de sneakers que posso enviar?",
    answer: "Não há limite fixo. Você pode enviar quantos sneakers quiser. Para envios em grande volume, entre em contato com nossa equipe para orientações especiais.",
  },
  {
    question: "O que acontece se meu sneaker não vender?",
    answer: "Você pode solicitar a devolução do sneaker a qualquer momento. O custo de envio de retorno fica por conta do vendedor. Também é possível ajustar o preço para aumentar as chances de venda.",
  },
  {
    question: "Quanto tempo leva para o sneaker ficar disponível para venda?",
    answer: "Após o recebimento no Hub, o processo de inspeção, fotografia e publicação do anúncio leva em média 3 a 5 dias úteis.",
  },
  {
    question: "Posso acompanhar o status do meu sneaker?",
    answer: "Sim. Você acompanha cada etapa em tempo real pelo app: desde o envio até a venda e pagamento. São 10 etapas rastreáveis com notificações automáticas.",
  },
  {
    question: "Como funciona o pagamento após a venda?",
    answer: "Quando o sneaker é vendido, cuidamos do envio ao comprador. Após o prazo de proteção ao comprador, seu pagamento é liberado automaticamente.",
  },
  {
    question: "O Bravenza Full é indicado para quem está começando a vender?",
    answer: "Sim. É ideal para quem quer vender sem se preocupar com fotos, anúncios ou logística. Nós cuidamos de tudo para você.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border/40 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="font-medium text-sm md:text-base pr-4">{question}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="px-4 md:px-5 pb-4 md:pb-5 text-sm text-muted-foreground leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

export function BravenzaFullFAQ() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Perguntas <span className="text-gradient-gold">frequentes</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Tudo o que você precisa saber sobre o Bravenza Full
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
            >
              <FAQItem {...faq} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
