import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AlertTriangle, Ban, Camera, CheckCircle, ClipboardList, FileText, Gavel, Package, Search, Shield, ShieldCheck, Star, Tag, Timer, TrendingUp, Users, XCircle } from "lucide-react";

const AdGuidelinesPage = () => {
  return (
    <PublicLayout>
      <Helmet>
        <title>Diretrizes de Anúncios | Marketplace BRAVENZA</title>
        <meta name="description" content="Conheça as diretrizes para criar, publicar e manter anúncios no Marketplace BRAVENZA. Padrões de fotos, descrição, preço e conduta para vendedores." />
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Diretrizes de Anúncios — Marketplace BRAVENZA</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Estas Diretrizes definem os padrões mínimos para criar, publicar e manter anúncios no Marketplace BRAVENZA, garantindo transparência, segurança e uma boa experiência para compradores e vendedores. Elas complementam os{" "}
          <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>, a{" "}
          <Link to="/trocas-devolucoes" className="text-primary hover:underline">Política de Trocas/Devoluções</Link>{" "}
          e demais políticas da BRAVENZA.
        </p>

        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">
              A BRAVENZA pode recusar, ocultar, suspender ou remover anúncios e/ou restringir contas quando identificar risco, inconsistência, violação destas diretrizes, indícios de fraude, procedência duvidosa ou qualquer situação que comprometa o ecossistema.
            </p>
          </div>
        </div>

        <div className="space-y-10">
          {/* 1 - Quem pode anunciar */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">1) Quem pode anunciar</h2>
            </div>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p><strong>1.1.</strong> Apenas Vendedores aprovados (Club Vault / Aprovado) podem anunciar e vender.</p>
              <p><strong>1.2.</strong> A aprovação pode exigir: verificação documental, validação de dados bancários, histórico, reputação e/ou auditorias.</p>
              <p><strong>1.3.</strong> A BRAVENZA pode aplicar níveis de vendedor (ex.: "Vendedor Vault Verificado/Autenticado") e alterar/revogar status a qualquer tempo.</p>
            </div>
          </section>

          {/* 2 - Tipos de anúncio */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">2) Tipos de anúncio permitidos</h2>
            </div>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p><strong>2.1. Pronta entrega:</strong> você possui o item fisicamente e pode postar em até 3 dias úteis após pagamento.</p>
              <p><strong>2.2. Sob encomenda:</strong> você não possui estoque imediato, mas declara que possui controle efetivo para adquirir e entregar no prazo informado.</p>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 my-3">
                <p className="text-sm text-foreground"><strong>2.3.</strong> Dropshipping é <strong>proibido</strong>, salvo autorização formal e expressa da BRAVENZA (por escrito e dentro da plataforma).</p>
              </div>
              <p><strong>2.4.</strong> Anúncios sob encomenda podem ter regras adicionais (ex.: limites, prazos máximos, exigência de reputação mínima, taxa de cancelamento máxima).</p>
            </div>
          </section>

          {/* 3 - Itens proibidos */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Ban className="w-5 h-5 text-destructive" />
              <h2 className="text-xl font-semibold text-foreground">3) Itens proibidos (tolerância zero)</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">É proibido anunciar itens ilegais, de procedência irregular ou que violem estes Termos, incluindo (sem limitar):</p>
            <ul className="space-y-2 mb-4">
              {[
                'Produtos falsificados, réplicas, "inspirados", "1:1", "primeira linha".',
                "Produtos roubados, furtados, sem procedência comprovável.",
                "Itens contrabandeados / importados irregularmente.",
                "Qualquer item proibido por lei (armas, drogas etc.) ou que infrinja direitos de terceiros.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-sm text-foreground"><strong>Resultado:</strong> remoção imediata, cancelamento de transações, banimento, retenção preventiva de valores e medidas legais cabíveis.</p>
            </div>
          </section>

          {/* 4 - Informações obrigatórias */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">4) Informações obrigatórias no anúncio</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">Todo anúncio deve conter informações verdadeiras, completas e consistentes.</p>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">4.1. Identificação do produto</h3>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li>• Marca e modelo (ex.: Nike SB Dunk "Mummy")</li>
                  <li>• Tamanho (padrão BR e/ou US) e forma (se "calça grande/pequeno")</li>
                  <li>• Colorway / variação (quando aplicável)</li>
                  <li>• Gênero (masc/fem/unissex) quando relevante</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">4.2. Condição (obrigatório)</h3>
                <p className="text-muted-foreground text-sm mb-2">Escolha uma e descreva:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  {[
                    { label: "Novo", desc: "Sem uso" },
                    { label: "Seminovo", desc: "Uso mínimo" },
                    { label: "Usado", desc: "Com sinais de uso — detalhar" },
                  ].map((c) => (
                    <div key={c.label} className="bg-muted/30 border border-border rounded-lg p-3 text-center">
                      <p className="font-semibold text-foreground text-sm">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">Você deve listar claramente: marcas de uso, arranhões, amassados, descolamentos, odores, desgaste de sola, manchas, etc.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">4.3. Acessórios e itens inclusos (obrigatório)</h3>
                <p className="text-muted-foreground text-sm mb-2">Informe se acompanha:</p>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li>• Caixa original / caixa substituta</li>
                  <li>• Papel, tags, lacres, card, extra laces, brindes</li>
                  <li>• Nota fiscal/declaração (quando existir)</li>
                  <li>• Saquinho/embalagem especial</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">4.4. Procedência (obrigatório)</h3>
                <p className="text-muted-foreground text-sm mb-2">Você deve indicar a origem de forma clara:</p>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li>• Comprado em loja oficial / varejo nacional</li>
                  <li>• Importado (com comprovação quando aplicável)</li>
                  <li>• Compra secundária (revenda) — com evidências mínimas</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">A BRAVENZA pode solicitar comprovantes adicionais a qualquer momento.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">4.5. Modalidade do anúncio</h3>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li>• Pronta entrega ou Sob encomenda (obrigatório)</li>
                  <li>• Prazo estimado de envio/entrega (quando sob encomenda, seja realista e transparente)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5 - Fotos obrigatórias */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">5) Fotos obrigatórias (padrão mínimo)</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">5.1. Regras gerais</h3>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li>• Fotos reais do item (nada de foto de catálogo).</li>
                  <li>• Boa luz, fundo limpo, sem filtros pesados.</li>
                  <li>• Proibido: imagens com logos de outras plataformas, prints de terceiros, colagens confusas, marca d'água de revenda concorrente.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">5.2. Mínimo recomendado (tênis)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "Lateral externa (par)",
                    "Lateral interna (par)",
                    "Frente (biqueira)",
                    "Traseira (heel)",
                    "Solado (sola)",
                    "Etiqueta interna (inside label)",
                    "Palmilha e costura",
                    "Caixa (tampa e laterais)",
                    "Acessórios (laces/tags/card)",
                    "Close de defeitos/avarias",
                  ].map((photo) => (
                    <div key={photo} className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg p-2.5 text-sm text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{photo}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mt-3">
                  <p className="text-sm text-foreground"><strong>Obrigatório:</strong> fotos de quaisquer defeitos mencionados no texto. Se o anúncio não mostrar o defeito, o comprador poderá alegar "produto diferente do anunciado".</p>
                </div>
              </div>
            </div>
          </section>

          {/* 6 - Título e descrição */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">6) Título e descrição (padrões)</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">6.1. Título</h3>
                <p className="text-muted-foreground text-sm mb-2">Use: Marca + Modelo + Apelido (se houver) + Tamanho + Condição</p>
                <div className="bg-muted/30 border border-border rounded-lg p-3">
                  <p className="text-sm text-foreground font-mono">Ex.: "Nike SB Dunk Mummy – US 10 / BR 42 – Seminovo"</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">6.2. Descrição</h3>
                <p className="text-muted-foreground text-sm mb-2">A descrição deve incluir:</p>
                <ul className="space-y-1 text-muted-foreground text-sm mb-3">
                  <li>• Condição detalhada (inclusive desgaste e avarias)</li>
                  <li>• O que acompanha (caixa, tags, extras)</li>
                  <li>• Procedência e histórico (quando relevante)</li>
                  <li>• Prazo de postagem (pronta entrega) ou prazo estimado (sob encomenda)</li>
                  <li>• Observações importantes (ex.: "sem caixa", "com marca de uso na lateral")</li>
                </ul>

                <h4 className="font-semibold text-foreground text-sm mb-2">Proibido na descrição:</h4>
                <ul className="space-y-1 text-sm">
                  {[
                    'Prometer "100% original garantido pela BRAVENZA" (a BRAVENZA não é a marca).',
                    "Qualquer instrução para comprar fora da plataforma (Pix direto, WhatsApp, Instagram).",
                    'Linguagem enganosa: "igual original", "réplica premium", "primeira linha".',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 7 - Preço e taxas */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">7) Preço e taxas</h2>
            </div>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p><strong>7.1.</strong> O vendedor define o preço, mas deve respeitar: preço coerente com condição e mercado, e transparência (não esconder defeitos para inflar valor).</p>
              <p><strong>7.2.</strong> A BRAVENZA pode cobrar taxas (intermediação, assinatura, verificação, logística técnica etc.) conforme informado na plataforma.</p>
            </div>
          </section>

          {/* 8 - Prazos e obrigações */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">8) Prazos e obrigações do vendedor</h2>
            </div>
            <div className="space-y-2 text-muted-foreground leading-relaxed mb-4">
              <p><strong>8.1. Postagem:</strong> até 3 dias úteis após confirmação do pagamento.</p>
              <p><strong>8.2.</strong> O vendedor deve embalar corretamente para evitar danos.</p>
              <p><strong>8.3.</strong> É obrigação do vendedor responder solicitações e disputas dentro do prazo informado.</p>
            </div>
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <h4 className="font-semibold text-foreground text-sm mb-2">Penalidades por atraso e descumprimento:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Cancelamento de venda e estorno ao comprador</li>
                <li>• Perda de status, redução de visibilidade, bloqueio de anúncios</li>
                <li>• Retenção preventiva de valores, suspensão/banimento</li>
              </ul>
            </div>
          </section>

          {/* 9 - Verificação BRAVENZA */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">9) Verificação BRAVENZA (quando se aplica)</h2>
            </div>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p><strong>9.1.</strong> Itens acima de R$ 2.000,00: verificação BRAVENZA <strong>obrigatória</strong>.</p>
              <p><strong>9.2.</strong> Itens até R$ 2.000,00: verificação opcional (por escolha do comprador, regra do anúncio ou vendedor).</p>
              <p><strong>9.3.</strong> A verificação é opinativa e de melhor esforço, baseada em evidências (fotos/vídeos/inspeção física).</p>
              <p><strong>9.4.</strong> Resultado possível: Aprovado / Provavelmente aprovado / Inconclusivo / Reprovado.</p>
              <p><strong>9.5.</strong> Em caso de reprovação na verificação obrigatória, a BRAVENZA poderá cancelar a transação e aplicar medidas ao vendedor.</p>
            </div>
          </section>

          {/* 10 - Cancelamentos */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">10) Cancelamentos e índice de qualidade</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3"><strong>10.1.</strong> A BRAVENZA monitora: atrasos, cancelamentos, disputas, reclamações, reprovações, chargebacks e satisfação.</p>
            <p className="text-muted-foreground leading-relaxed mb-3"><strong>10.2.</strong> Vendedores com padrão de risco podem sofrer:</p>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li>• Limite de anúncios</li>
              <li>• Verificação obrigatória em todos os itens</li>
              <li>• Bloqueio de sob encomenda</li>
              <li>• Suspensão temporária ou banimento</li>
            </ul>
          </section>

          {/* 11 - Condutas proibidas */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Gavel className="w-5 h-5 text-destructive" />
              <h2 className="text-xl font-semibold text-foreground">11) Condutas proibidas (fraude e bypass)</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3"><strong>11.1.</strong> É proibido:</p>
            <ul className="space-y-2 mb-4">
              {[
                'Simular transações, manipular avaliações, "compra fake"',
                "Incentivar compra fora da plataforma (bypass)",
                "Enviar item diferente do anunciado",
                "Vender item sem procedência ou com suspeita de falsificação",
                "Usar bots/scraping/automação para vantagem indevida",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                  <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground"><strong>11.2.</strong> Violações podem gerar: cancelamento, retenção de valores, banimento e medidas legais.</p>
          </section>

          {/* 12 - Auditoria */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">12) Auditoria e comprovações</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3"><strong>12.1.</strong> A BRAVENZA pode solicitar a qualquer tempo:</p>
            <ul className="space-y-1 text-muted-foreground text-sm mb-4">
              <li>• Fotos/vídeos adicionais</li>
              <li>• Comprovantes de compra/procedência</li>
              <li>• Documentos do vendedor</li>
              <li>• Confirmações de envio e rastreio</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-3"><strong>12.2.</strong> A não apresentação de comprovações pode resultar em:</p>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li>• Ocultação/remoção do anúncio</li>
              <li>• Suspensão de venda/saque</li>
              <li>• Encerramento da conta</li>
            </ul>
          </section>

          {/* 13 - NF e tributos */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">13) Responsabilidade do vendedor sobre NF e tributos</h2>
            </div>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p><strong>13.1.</strong> Em vendas por terceiros no marketplace, a BRAVENZA não emite nota fiscal do produto.</p>
              <p><strong>13.2.</strong> O vendedor é responsável por obrigações fiscais e emissão de documentos quando exigível.</p>
            </div>
          </section>

          {/* 14 - Boas práticas */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">14) Boas práticas (para vender mais e ter menos problemas)</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Seja extremamente transparente (defeitos, condição, o que acompanha)",
                "Use fotos claras e completas",
                "Responda rápido e poste dentro do prazo",
                "Evite sob encomenda se você não tiver controle real da aquisição",
                "Mantenha histórico e provas de procedência organizadas",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{tip}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 15 - Disposições finais */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">15) Disposições finais</h2>
            </div>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p><strong>15.1.</strong> Estas diretrizes podem ser atualizadas a qualquer tempo.</p>
              <p><strong>15.2.</strong> Ao anunciar, o vendedor confirma que leu e aceitou estas regras, e que suas informações são verdadeiras.</p>
            </div>
          </section>

          {/* Links de referência */}
          <section className="border-t border-border pt-8 mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Políticas relacionadas</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/termos" className="text-sm text-primary hover:underline bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">Termos de Uso</Link>
              <Link to="/trocas-devolucoes" className="text-sm text-primary hover:underline bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">Política de Trocas/Devoluções</Link>
              <Link to="/politicas" className="text-sm text-primary hover:underline bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">Política de Privacidade</Link>
              <Link to="/regras-marketplace" className="text-sm text-primary hover:underline bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">Regras do Marketplace e Club Vault</Link>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
};

export default AdGuidelinesPage;
