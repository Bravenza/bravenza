import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  RefreshCw, Package, AlertTriangle, Shield, ShieldCheck,
  Camera, MessageCircle, Scale, Truck, FileText
} from "lucide-react";
import {
  PolicyPageLayout, PolicySection, PolicyBulletList, PolicyAlert, PolicyNotice
} from "@/components/policy/PolicyPageLayout";

const MotiveCard = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card/50">
    <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
    <div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const ReturnsPage = () => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t("returns.pageTitle")}</title>
        <meta name="description" content={t("returns.metaDescription")} />
      </Helmet>

      <PolicyPageLayout
        icon={RefreshCw}
        title="Trocas e devoluções"
        description={
          <>
            Saiba como solicitar sua troca ou devolução com total segurança. Todos os processos seguem o Código de Defesa do Consumidor (CDC), além dos{" "}
            <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link> e demais políticas da BRAVENZA.
          </>
        }
        subtitle="A utilização do serviço implica ciência e aceite integral desta Política."
      >
        {/* Intro */}
        <PolicyAlert>
          <p className="text-foreground font-medium mb-1">Comprou e quer devolver ou trocar?</p>
          <p className="text-sm text-muted-foreground">
            É simples: acesse sua compra no app/site e clique em <strong className="text-foreground">"Tive um problema"</strong>. Depois, fale com o nosso atendimento. A BRAVENZA vai orientar o fluxo e ajudar a iniciar o processo com o vendedor (Marketplace) e/ou aplicar as regras dos serviços BRAVENZA quando cabível.
          </p>
        </PolicyAlert>

        {/* Motivos */}
        <PolicySection icon={AlertTriangle} number="1" title="Motivos para devolução ou troca">
          <div className="grid gap-3">
            <MotiveCard icon={Package} title="Produto com defeito" description="Apresentou falhas, problemas ou vício." />
            <MotiveCard icon={AlertTriangle} title="Produto diferente do anunciado" description="Não corresponde à descrição, fotos, condição, tamanho, cor, acessórios, caixa, tags etc." />
            <MotiveCard icon={RefreshCw} title="Arrependimento" description="Desistiu da compra dentro do prazo legal de 7 (sete) dias corridos após o recebimento." />
            <MotiveCard icon={Shield} title="Problemas na entrega" description="Produto danificado no transporte, extravio, violação de embalagem, atraso relevante ou entrega incorreta." />
          </div>
        </PolicySection>

        {/* Tipos */}
        <PolicySection icon={FileText} number="2" title="Tipos de devolução/troca">
          <p className="text-muted-foreground mb-4">A BRAVENZA pode operar com três modalidades principais:</p>
          <div className="grid gap-3">
            <div className="p-4 rounded-xl border border-border bg-card/50">
              <p className="font-semibold text-foreground">1) Devolução comum (Marketplace)</p>
              <p className="text-sm text-muted-foreground">Devolução padrão para compras no marketplace.</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/50">
              <p className="font-semibold text-foreground">2) Devolução com verificação BRAVENZA</p>
              <p className="text-sm text-muted-foreground">Quando a compra passou por verificação obrigatória ou opcional (por regra do valor, anúncio, vendedor ou escolha do comprador).</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/50">
              <p className="font-semibold text-foreground">3) Devolução com troca</p>
              <p className="text-sm text-muted-foreground">Devolução do produto com solicitação de troca por outro item, conforme disponibilidade e regras do vendedor/marketplace.</p>
            </div>
          </div>
        </PolicySection>

        {/* Devolução Comum */}
        <PolicySection icon={Package} number="3" title="Devolução comum (Marketplace)">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Prazo</h3>
              <p className="text-muted-foreground mb-2">
                Você tem <strong className="text-foreground">7 (sete) dias corridos</strong> após o recebimento para iniciar a solicitação de devolução por arrependimento.
              </p>
              <p className="text-muted-foreground">
                Para defeito ou produto diferente do anunciado, o prazo seguirá o CDC e a análise do caso concreto.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Passo a passo do comprador</h3>
              <PolicyBulletList items={[
                'Acesse a compra e clique em "Tive um problema".',
                "(Se disponível) Fale com o vendedor pelo chat da plataforma para tentar resolver.",
                "Fale com o Atendimento BRAVENZA para receber as instruções e o fluxo de postagem.",
                "Envie o produto conforme orientações, preservando embalagem e acessórios."
              ]} />
            </div>
            <PolicyAlert>
              <div className="flex items-start gap-2">
                <Camera className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground mb-1">Antes de enviar, faça provas:</p>
                  <p className="text-sm text-muted-foreground">
                    Tire fotos e vídeo do produto, dentro e fora da caixa, mostrando: etiqueta/tags, sola, palmilha, costuras, caixa, acessórios, avarias e a embalagem de envio. Se notar violação, amassado, molhado ou dano no recebimento, registre imediatamente (foto/vídeo) antes de abrir.
                  </p>
                </div>
              </div>
            </PolicyAlert>
            <PolicyAlert>
              <p className="font-medium text-foreground mb-1">Condição do produto:</p>
              <p className="text-sm text-muted-foreground">
                O produto deve ser devolvido na mesma condição em que foi recebido, com itens e acessórios informados no anúncio. Uso indevido, sinais de uso incompatíveis, falta de itens, danos causados após o recebimento ou adulterações podem resultar em negação parcial/total do reembolso.
              </p>
            </PolicyAlert>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Passo a passo do vendedor</h3>
              <PolicyBulletList items={[
                "Acompanhe o chamado e responda dentro do prazo solicitado.",
                "Ao receber o item devolvido, confira e registre (fotos/vídeo).",
                "Se houver divergência (uso indevido, falta de itens, produto diferente do devolvido), abra disputa com a BRAVENZA, anexando provas."
              ]} />
            </div>
          </div>
        </PolicySection>

        {/* Devolução com Verificação */}
        <PolicySection icon={ShieldCheck} number="4" title="Devolução com verificação BRAVENZA">
          <p className="text-muted-foreground mb-4">
            Quando aplicável, a compra pode envolver verificação técnica (digital e/ou presencial). A verificação é um serviço opinativo de melhor esforço e pode impactar o fluxo de devolução.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Regras gerais</h3>
              <PolicyBulletList items={[
                "Se a devolução ocorrer por arrependimento após a prestação do serviço de verificação, a BRAVENZA poderá descontar valores relativos ao serviço prestado e/ou taxas operacionais.",
                "Se o motivo da devolução for falha comprovada do serviço BRAVENZA, a BRAVENZA tratará o caso para reembolso integral do que for devido."
              ]} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Itens acima de R$ 2.000,00</h3>
              <p className="text-muted-foreground mb-2">
                Obrigatoriamente passam pela verificação BRAVENZA, conforme os{" "}
                <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>.
              </p>
              <p className="text-muted-foreground">
                Se houver reprovação na verificação obrigatória antes da entrega ao comprador, a transação poderá ser cancelada e o reembolso processado conforme o meio de pagamento.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Como iniciar</h3>
              <PolicyBulletList items={[
                'Clique em "Tive um problema".',
                "Acione o Atendimento BRAVENZA.",
                "Siga as instruções específicas da modalidade com verificação."
              ]} />
            </div>
          </div>
        </PolicySection>

        {/* Devolução com Troca */}
        <PolicySection icon={RefreshCw} number="5" title="Devolução com troca">
          <p className="text-muted-foreground mb-3">Quer trocar por outro item? Você pode solicitar troca quando:</p>
          <PolicyBulletList items={[
            "O vendedor oferecer alternativa disponível",
            "A BRAVENZA disponibilizar essa opção conforme regras do marketplace",
            "As partes concordarem com a troca"
          ]} />
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">Como solicitar</h3>
            <PolicyBulletList items={[
              'Clique em "Tive um problema".',
              "Fale com o vendedor no chat (se disponível).",
              "Acione o Atendimento BRAVENZA informando o item desejado para troca."
            ]} />
          </div>
          <p className="text-sm text-muted-foreground italic mt-3">
            Importante: trocas dependem de disponibilidade, prazos e regras do vendedor/marketplace. Caso não seja possível, será aplicado o fluxo de devolução/reembolso conforme o caso.
          </p>
        </PolicySection>

        {/* Regras de envio */}
        <PolicySection icon={Truck} number="6" title="Regras de envio e devolução">
          <PolicyBulletList items={[
            "O item deve ser devolvido com caixa, acessórios e itens descritos no anúncio (quando aplicável).",
            "Embale adequadamente para evitar danos no transporte. Danos por embalagem inadequada podem ser atribuídos ao remetente.",
            "Sempre que possível, use o fluxo e instruções de postagem indicados pela BRAVENZA (para rastreio e segurança).",
            "A BRAVENZA poderá solicitar documentos, fotos, vídeos, prints e comprovações para análise."
          ]} />
        </PolicySection>

        {/* Disputa */}
        <PolicySection icon={Scale} number="7" title="O que é uma disputa?">
          <p className="text-muted-foreground mb-3">
            Se comprador e vendedor não chegarem a um acordo, a BRAVENZA pode abrir uma disputa.
          </p>
          <PolicyBulletList items={[
            "A disputa pode ocorrer em um canal de comunicação formal (e-mail, chat da plataforma, WhatsApp institucional ou outro canal oficial).",
            "Cada parte apresenta suas provas (fotos, vídeos, conversa, anúncio, comprovantes, rastreio etc.).",
            'O valor pode permanecer bloqueado (saldo "a liberar") até a conclusão.',
            "Se uma das partes não responder dentro do prazo informado pela BRAVENZA, a decisão poderá ser tomada com base nas provas existentes e/ou regras aplicáveis.",
            "A decisão final considerará Termos de Uso, políticas internas, CDC, evidências apresentadas e critérios de segurança e antifraude."
          ]} />
        </PolicySection>

        {/* Contato */}
        <PolicyNotice
          icon={MessageCircle}
          title="Dúvidas? Fale com a gente"
          description="Vamos ajudar você a resolver tudo com segurança."
        />
        <div className="flex flex-col sm:flex-row gap-3 justify-center -mt-4">
          <a href="mailto:contato@bravenza.com.br" className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm">
            contato@bravenza.com.br
          </a>
          <a href="https://wa.me/5551981055425" className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm">
            WhatsApp: 51 98105.5425
          </a>
        </div>
      </PolicyPageLayout>
    </>
  );
};

export default ReturnsPage;
