import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AlertTriangle, Camera, MessageCircle, Package, RefreshCw, Shield, ShieldCheck } from "lucide-react";

const ReturnsPage = () => {
  return (
    <PublicLayout>
      <Helmet>
        <title>Trocas e Devoluções | BRAVENZA</title>
        <meta name="description" content="Saiba como solicitar sua troca ou devolução na BRAVENZA com total segurança. Conheça os prazos, regras e o passo a passo completo." />
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Trocas e Devoluções — BRAVENZA</h1>
        <p className="text-muted-foreground mb-8 text-lg">Saiba como solicitar sua troca ou devolução com total segurança.</p>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* Intro */}
          <section className="bg-muted/30 border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">Comprou e quer devolver ou trocar?</h2>
            <p className="text-muted-foreground leading-relaxed">
              É simples: acesse sua compra no app/site e clique em <strong>"Tive um problema"</strong>. Depois, fale com o nosso atendimento. A BRAVENZA vai orientar o fluxo e ajudar a iniciar o processo com o vendedor (Marketplace) e/ou aplicar as regras dos serviços BRAVENZA quando cabível.
            </p>
          </section>

          {/* Como funciona */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Como funciona o processo?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Você pode solicitar devolução/troca por diferentes motivos:
            </p>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 bg-muted/20 border border-border rounded-lg p-4">
                <Package className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Produto com defeito</p>
                  <p className="text-sm text-muted-foreground">Apresentou falhas, problemas ou vício.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-muted/20 border border-border rounded-lg p-4">
                <AlertTriangle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Produto diferente do anunciado</p>
                  <p className="text-sm text-muted-foreground">Não corresponde à descrição, fotos, condição, tamanho, cor, acessórios, caixa, tags etc.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-muted/20 border border-border rounded-lg p-4">
                <RefreshCw className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Arrependimento</p>
                  <p className="text-sm text-muted-foreground">Desistiu da compra dentro do prazo legal de 7 (sete) dias corridos após o recebimento.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-muted/20 border border-border rounded-lg p-4">
                <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Problemas na entrega</p>
                  <p className="text-sm text-muted-foreground">Produto danificado no transporte, extravio, violação de embalagem, atraso relevante (quando aplicável) ou entrega incorreta.</p>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Todos os processos seguem o Código de Defesa do Consumidor (CDC), além dos{" "}
              <Link to="/termos" className="text-primary hover:underline font-medium">Termos de Uso</Link> e destas regras.
            </p>
            <p className="text-sm text-primary font-medium mt-3">
              Antes de começar: vá até sua compra e clique em "Tive um problema".
            </p>
          </section>

          {/* Tipos */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Tipos de devolução/troca na BRAVENZA</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">A BRAVENZA pode operar com três modalidades principais:</p>
            <div className="grid gap-3">
              <div className="bg-muted/20 border border-border rounded-lg p-4">
                <p className="font-semibold text-foreground">1) Devolução comum (Marketplace)</p>
                <p className="text-sm text-muted-foreground">Devolução padrão para compras no marketplace.</p>
              </div>
              <div className="bg-muted/20 border border-border rounded-lg p-4">
                <p className="font-semibold text-foreground">2) Devolução com verificação BRAVENZA (Verificação/Autenticação)</p>
                <p className="text-sm text-muted-foreground">Quando a compra passou por verificação obrigatória ou opcional (por regra do valor, anúncio, vendedor ou escolha do comprador).</p>
              </div>
              <div className="bg-muted/20 border border-border rounded-lg p-4">
                <p className="font-semibold text-foreground">3) Devolução com troca</p>
                <p className="text-sm text-muted-foreground">Devolução do produto com solicitação de troca por outro item, conforme disponibilidade e regras do vendedor/marketplace.</p>
              </div>
            </div>
          </section>

          {/* 1) Devolução Comum */}
          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">1) Devolução comum (Marketplace)</h2>
          </div>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">Prazo</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Você tem <strong>7 (sete) dias corridos</strong> após o recebimento para iniciar a solicitação de devolução por arrependimento.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Para defeito ou produto diferente do anunciado, o prazo seguirá o CDC e a análise do caso concreto.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">Passo a passo do comprador</h3>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>Acesse a compra e clique em <strong>"Tive um problema"</strong>.</li>
              <li>(Se disponível) Fale com o vendedor pelo chat da plataforma para tentar resolver.</li>
              <li>Fale com o Atendimento BRAVENZA para receber as instruções e o fluxo de postagem.</li>
              <li>Envie o produto conforme orientações, preservando embalagem e acessórios.</li>
            </ol>

            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <Camera className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground mb-1">⚠️ Antes de enviar, faça provas:</p>
                  <p className="text-sm text-muted-foreground">
                    Tire fotos e vídeo do produto, dentro e fora da caixa, mostrando: etiqueta/tags, sola, palmilha, costuras, caixa, acessórios, avarias e a embalagem de envio.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Se notar violação, amassado, molhado ou dano no recebimento, registre imediatamente (foto/vídeo) antes de abrir.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <p className="font-medium text-foreground mb-1">⚠️ Condição do produto:</p>
              <p className="text-sm text-muted-foreground">
                O produto deve ser devolvido na mesma condição em que foi recebido, com itens e acessórios informados no anúncio. Uso indevido, sinais de uso incompatíveis, falta de itens, danos causados após o recebimento ou adulterações podem resultar em negação parcial/total do reembolso (conforme CDC e análise do caso).
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">Passo a passo do vendedor</h3>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2">
              <li>Acompanhe o chamado e responda dentro do prazo solicitado.</li>
              <li>Ao receber o item devolvido, confira e registre (fotos/vídeo).</li>
              <li>Se houver divergência (uso indevido, falta de itens, produto diferente do devolvido), abra disputa com a BRAVENZA, anexando provas.</li>
            </ol>
          </section>

          {/* 2) Devolução com Verificação */}
          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">2) Devolução com verificação BRAVENZA (Verificação/Autenticação)</h2>
          </div>

          <section>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Quando aplicável, a compra pode envolver verificação técnica (digital e/ou presencial). A verificação é um serviço opinativo de melhor esforço e pode impactar o fluxo de devolução.
            </p>

            <h3 className="text-lg font-semibold text-foreground mb-3">Regras gerais</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>Se a devolução ocorrer por <strong>arrependimento</strong> após a prestação do serviço de verificação, a BRAVENZA poderá descontar valores relativos ao serviço prestado e/ou taxas operacionais, quando cabível e permitido, pois o serviço já foi realizado.</li>
              <li>Se o motivo da devolução for <strong>falha comprovada</strong> do serviço BRAVENZA (erro operacional relevante) ou outro cenário em que a lei imponha reembolso integral, a BRAVENZA tratará o caso para reembolso integral do que for devido, conforme apuração.</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mb-3">Itens acima de R$ 2.000,00</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Obrigatoriamente passam pela verificação BRAVENZA, conforme os{" "}
              <Link to="/termos" className="text-primary hover:underline font-medium">Termos de Uso</Link>.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Se houver reprovação na verificação obrigatória antes da entrega ao comprador, a transação poderá ser cancelada e o reembolso processado conforme o meio de pagamento.
            </p>

            <h3 className="text-lg font-semibold text-foreground mb-3">Como iniciar</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">O fluxo é o mesmo:</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              <li>Clique em <strong>"Tive um problema"</strong>.</li>
              <li>Acione o Atendimento BRAVENZA.</li>
              <li>Siga as instruções específicas da modalidade com verificação.</li>
            </ol>
          </section>

          {/* 3) Devolução com Troca */}
          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">3) Devolução com troca</h2>
          </div>

          <section>
            <p className="text-muted-foreground leading-relaxed mb-3">Quer trocar por outro item? Você pode solicitar troca quando:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
              <li>o vendedor oferecer alternativa disponível; ou</li>
              <li>a BRAVENZA disponibilizar essa opção conforme regras do marketplace; ou</li>
              <li>as partes concordarem com a troca.</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mb-3">Como solicitar</h3>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1 mb-4">
              <li>Clique em <strong>"Tive um problema"</strong>.</li>
              <li>Fale com o vendedor no chat (se disponível).</li>
              <li>Acione o Atendimento BRAVENZA informando o item desejado para troca.</li>
            </ol>
            <p className="text-sm text-muted-foreground italic">
              Importante: trocas dependem de disponibilidade, prazos e regras do vendedor/marketplace. Caso não seja possível, será aplicado o fluxo de devolução/reembolso conforme o caso.
            </p>
          </section>

          {/* Regras de envio */}
          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Regras de envio e devolução (valem para todos os casos)</h2>
          </div>

          <section>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>O item deve ser devolvido com caixa, acessórios e itens descritos no anúncio (quando aplicável).</li>
              <li>Embale adequadamente para evitar danos no transporte. Danos por embalagem inadequada podem ser atribuídos ao remetente.</li>
              <li>Sempre que possível, use o fluxo e instruções de postagem indicados pela BRAVENZA (para rastreio e segurança).</li>
              <li>A BRAVENZA poderá solicitar documentos, fotos, vídeos, prints e comprovações para análise.</li>
            </ul>
          </section>

          {/* Disputa */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">O que é uma disputa?</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Se comprador e vendedor não chegarem a um acordo, a BRAVENZA pode abrir uma disputa.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>A disputa pode ocorrer em um canal de comunicação formal (ex.: e-mail, chat da plataforma, WhatsApp institucional ou outro canal oficial).</li>
              <li>Cada parte apresenta suas provas (fotos, vídeos, conversa, anúncio, comprovantes, rastreio etc.).</li>
              <li>O valor pode permanecer bloqueado (saldo "a liberar") até a conclusão.</li>
              <li>Se uma das partes não responder dentro do prazo informado pela BRAVENZA, a decisão poderá ser tomada com base nas provas existentes e/ou regras aplicáveis.</li>
              <li>A decisão final considerará{" "}
                <Link to="/termos" className="text-primary hover:underline font-medium">Termos de Uso</Link>, políticas internas, CDC, evidências apresentadas e critérios de segurança e antifraude.
              </li>
            </ul>
          </section>

          {/* Dúvidas */}
          <section className="bg-muted/30 border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">Dúvidas?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Fale com a gente — vamos ajudar você a resolver tudo com segurança.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:contato@bravenza.com.br"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <MessageCircle className="h-4 w-4" />
                contato@bravenza.com.br
              </a>
              <a
                href="https://wa.me/5551981055425"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <ShieldCheck className="h-4 w-4" />
                WhatsApp (51) 98105-5425
              </a>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ReturnsPage;
