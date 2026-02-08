import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  AlertTriangle, Ban, Camera, CheckCircle, ClipboardList, FileText,
  Gavel, Package, Search, Shield, ShieldCheck, Star, Tag, Timer,
  TrendingUp, Users, XCircle
} from "lucide-react";
import {
  PolicyPageLayout, PolicySection, PolicyBulletList, PolicyProhibitedList,
  PolicyParagraphs, PolicyAlert
} from "@/components/policy/PolicyPageLayout";

const AdGuidelinesPage = () => {
  return (
    <>
      <Helmet>
        <title>Diretrizes de Anúncios | Marketplace BRAVENZA</title>
        <meta name="description" content="Conheça as diretrizes para criar, publicar e manter anúncios no Marketplace BRAVENZA. Padrões de fotos, descrição, preço e conduta para vendedores." />
      </Helmet>

      <PolicyPageLayout
        icon={ClipboardList}
        title="Diretrizes de anúncios"
        description={
          <>
            Estas Diretrizes definem os padrões mínimos para criar, publicar e manter anúncios no Marketplace BRAVENZA. Elas complementam os{" "}
            <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>, a{" "}
            <Link to="/trocas-devolucoes" className="text-primary hover:underline">Política de Trocas/Devoluções</Link> e demais políticas da BRAVENZA.
          </>
        }
      >
        <PolicyAlert variant="destructive">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              A BRAVENZA pode recusar, ocultar, suspender ou remover anúncios e/ou restringir contas quando identificar risco, inconsistência, violação destas diretrizes, indícios de fraude, procedência duvidosa ou qualquer situação que comprometa o ecossistema.
            </p>
          </div>
        </PolicyAlert>

        <PolicySection icon={Users} number="1" title="Quem pode anunciar">
          <PolicyParagraphs items={[
            { num: "1.1.", text: "Apenas Vendedores aprovados (Club Vault / Aprovado) podem anunciar e vender." },
            { num: "1.2.", text: "A aprovação pode exigir: verificação documental, validação de dados bancários, histórico, reputação e/ou auditorias." },
            { num: "1.3.", text: 'A BRAVENZA pode aplicar níveis de vendedor (ex.: "Vendedor Vault Verificado/Autenticado") e alterar/revogar status a qualquer tempo.' },
          ]} />
        </PolicySection>

        <PolicySection icon={Tag} number="2" title="Tipos de anúncio permitidos">
          <PolicyParagraphs items={[
            { num: "2.1.", text: "Pronta entrega: você possui o item fisicamente e pode postar em até 3 dias úteis após pagamento." },
            { num: "2.2.", text: "Sob encomenda: você não possui estoque imediato, mas declara que possui controle efetivo para adquirir e entregar no prazo informado." },
          ]} />
          <PolicyAlert variant="destructive">
            <p className="text-sm text-foreground"><strong>2.3.</strong> Dropshipping é <strong>proibido</strong>, salvo autorização formal e expressa da BRAVENZA (por escrito e dentro da plataforma).</p>
          </PolicyAlert>
          <p className="text-muted-foreground mt-3"><strong className="text-foreground">2.4.</strong> Anúncios sob encomenda podem ter regras adicionais (ex.: limites, prazos máximos, exigência de reputação mínima, taxa de cancelamento máxima).</p>
        </PolicySection>

        <PolicySection icon={Ban} number="3" title="Itens proibidos (tolerância zero)">
          <p className="text-muted-foreground mb-3">É proibido anunciar itens ilegais, de procedência irregular ou que violem estes Termos, incluindo (sem limitar):</p>
          <PolicyProhibitedList items={[
            'Produtos falsificados, réplicas, "inspirados", "1:1", "primeira linha".',
            "Produtos roubados, furtados, sem procedência comprovável.",
            "Itens contrabandeados / importados irregularmente.",
            "Qualquer item proibido por lei (armas, drogas etc.) ou que infrinja direitos de terceiros.",
          ]} />
          <PolicyAlert variant="destructive">
            <p className="text-sm text-foreground"><strong>Resultado:</strong> remoção imediata, cancelamento de transações, banimento, retenção preventiva de valores e medidas legais cabíveis.</p>
          </PolicyAlert>
        </PolicySection>

        <PolicySection icon={ClipboardList} number="4" title="Informações obrigatórias no anúncio">
          <p className="text-muted-foreground mb-4">Todo anúncio deve conter informações verdadeiras, completas e consistentes.</p>
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold text-foreground mb-2">4.1. Identificação do produto</h3>
              <PolicyBulletList items={['Marca e modelo (ex.: Nike SB Dunk "Mummy")', 'Tamanho (padrão BR e/ou US) e forma (se "calça grande/pequeno")', "Colorway / variação (quando aplicável)", "Gênero (masc/fem/unissex) quando relevante"]} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">4.2. Condição (obrigatório)</h3>
              <p className="text-muted-foreground text-sm mb-3">Escolha uma e descreva:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                {[{ label: "Novo", desc: "Sem uso" }, { label: "Seminovo", desc: "Uso mínimo" }, { label: "Usado", desc: "Com sinais de uso — detalhar" }].map((c) => (
                  <div key={c.label} className="p-3 rounded-xl border border-border bg-card/50 text-center">
                    <p className="font-semibold text-foreground text-sm">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Você deve listar claramente: marcas de uso, arranhões, amassados, descolamentos, odores, desgaste de sola, manchas, etc.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">4.3. Acessórios e itens inclusos (obrigatório)</h3>
              <PolicyBulletList items={["Caixa original / caixa substituta", "Papel, tags, lacres, card, extra laces, brindes", "Nota fiscal/declaração (quando existir)", "Saquinho/embalagem especial"]} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">4.4. Procedência (obrigatório)</h3>
              <PolicyBulletList items={["Comprado em loja oficial / varejo nacional", "Importado (com comprovação quando aplicável)", "Compra secundária (revenda) — com evidências mínimas"]} />
              <p className="text-sm text-muted-foreground mt-2">A BRAVENZA pode solicitar comprovantes adicionais a qualquer momento.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">4.5. Modalidade do anúncio</h3>
              <PolicyBulletList items={["Pronta entrega ou Sob encomenda (obrigatório)", "Prazo estimado de envio/entrega (quando sob encomenda, seja realista e transparente)"]} />
            </div>
          </div>
        </PolicySection>

        <PolicySection icon={Camera} number="5" title="Fotos obrigatórias (padrão mínimo)">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">5.1. Regras gerais</h3>
              <PolicyBulletList items={["Fotos reais do item (nada de foto de catálogo).", "Boa luz, fundo limpo, sem filtros pesados.", "Proibido: imagens com logos de outras plataformas, prints de terceiros, colagens confusas, marca d'água de revenda concorrente."]} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">5.2. Mínimo recomendado (tênis)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["Lateral externa (par)", "Lateral interna (par)", "Frente (biqueira)", "Traseira (heel)", "Solado (sola)", "Etiqueta interna (inside label)", "Palmilha e costura", "Caixa (tampa e laterais)", "Acessórios (laces/tags/card)", "Close de defeitos/avarias"].map((photo) => (
                  <div key={photo} className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card/50 text-sm text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{photo}</span>
                  </div>
                ))}
              </div>
              <PolicyAlert>
                <p className="text-sm text-foreground"><strong>Obrigatório:</strong> fotos de quaisquer defeitos mencionados no texto. Se o anúncio não mostrar o defeito, o comprador poderá alegar "produto diferente do anunciado".</p>
              </PolicyAlert>
            </div>
          </div>
        </PolicySection>

        <PolicySection icon={FileText} number="6" title="Título e descrição (padrões)">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">6.1. Título</h3>
              <p className="text-muted-foreground text-sm mb-2">Use: Marca + Modelo + Apelido (se houver) + Tamanho + Condição</p>
              <div className="p-3 rounded-xl border border-border bg-card/50">
                <p className="text-sm text-foreground font-mono">Ex.: "Nike SB Dunk Mummy – US 10 / BR 42 – Seminovo"</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">6.2. Descrição</h3>
              <p className="text-muted-foreground text-sm mb-2">A descrição deve incluir:</p>
              <PolicyBulletList items={["Condição detalhada (inclusive desgaste e avarias)", "O que acompanha (caixa, tags, extras)", "Procedência e histórico (quando relevante)", "Prazo de postagem (pronta entrega) ou prazo estimado (sob encomenda)", 'Observações importantes (ex.: "sem caixa", "com marca de uso na lateral")']} />
              <h4 className="font-semibold text-foreground text-sm mt-4 mb-2">Proibido na descrição:</h4>
              <PolicyProhibitedList items={[
                'Prometer "100% original garantido pela BRAVENZA" (a BRAVENZA não é a marca).',
                "Qualquer instrução para comprar fora da plataforma (Pix direto, WhatsApp, Instagram).",
                'Linguagem enganosa: "igual original", "réplica premium", "primeira linha".',
              ]} />
            </div>
          </div>
        </PolicySection>

        <PolicySection icon={TrendingUp} number="7" title="Preço e taxas">
          <PolicyParagraphs items={[
            { num: "7.1.", text: "O vendedor define o preço, mas deve respeitar: preço coerente com condição e mercado, e transparência (não esconder defeitos para inflar valor)." },
            { num: "7.2.", text: "A BRAVENZA pode cobrar taxas (intermediação, assinatura, verificação, logística técnica etc.) conforme informado na plataforma." },
          ]} />
        </PolicySection>

        <PolicySection icon={Timer} number="8" title="Prazos e obrigações do vendedor">
          <PolicyParagraphs items={[
            { num: "8.1.", text: "Postagem: até 3 dias úteis após confirmação do pagamento." },
            { num: "8.2.", text: "O vendedor deve embalar corretamente para evitar danos." },
            { num: "8.3.", text: "É obrigação do vendedor responder solicitações e disputas dentro do prazo informado." },
          ]} />
          <PolicyAlert variant="destructive">
            <h4 className="font-semibold text-foreground text-sm mb-2">Penalidades por atraso e descumprimento:</h4>
            <PolicyProhibitedList items={[
              "Cancelamento de venda e estorno ao comprador",
              "Perda de status, redução de visibilidade, bloqueio de anúncios",
              "Retenção preventiva de valores, suspensão/banimento"
            ]} />
          </PolicyAlert>
        </PolicySection>

        <PolicySection icon={ShieldCheck} number="9" title="Verificação BRAVENZA (quando se aplica)">
          <PolicyParagraphs items={[
            { num: "9.1.", text: "Itens acima de R$ 2.000,00: verificação BRAVENZA obrigatória." },
            { num: "9.2.", text: "Itens até R$ 2.000,00: verificação opcional (por escolha do comprador, regra do anúncio ou vendedor)." },
            { num: "9.3.", text: "A verificação é opinativa e de melhor esforço, baseada em evidências (fotos/vídeos/inspeção física)." },
            { num: "9.4.", text: "Resultado possível: Aprovado / Provavelmente aprovado / Inconclusivo / Reprovado." },
            { num: "9.5.", text: "Em caso de reprovação na verificação obrigatória, a BRAVENZA poderá cancelar a transação e aplicar medidas ao vendedor." },
          ]} />
        </PolicySection>

        <PolicySection icon={Star} number="10" title="Cancelamentos e índice de qualidade">
          <PolicyParagraphs items={[
            { num: "10.1.", text: "A BRAVENZA monitora: atrasos, cancelamentos, disputas, reclamações, reprovações, chargebacks e satisfação." },
          ]} />
          <p className="text-muted-foreground mt-3 mb-2"><strong className="text-foreground">10.2.</strong> Vendedores com padrão de risco podem sofrer:</p>
          <PolicyBulletList items={["Limite de anúncios", "Verificação obrigatória em todos os itens", "Bloqueio de sob encomenda", "Suspensão temporária ou banimento"]} />
        </PolicySection>

        <PolicySection icon={Gavel} number="11" title="Condutas proibidas (fraude e bypass)">
          <p className="text-muted-foreground mb-3"><strong className="text-foreground">11.1.</strong> É proibido:</p>
          <PolicyProhibitedList items={[
            'Simular transações, manipular avaliações, "compra fake"',
            "Incentivar compra fora da plataforma (bypass)",
            "Enviar item diferente do anunciado",
            "Vender item sem procedência ou com suspeita de falsificação",
            "Usar bots/scraping/automação para vantagem indevida",
          ]} />
          <p className="text-sm text-muted-foreground mt-3"><strong className="text-foreground">11.2.</strong> Violações podem gerar: cancelamento, retenção de valores, banimento e medidas legais.</p>
        </PolicySection>

        <PolicySection icon={Search} number="12" title="Auditoria e comprovações">
          <PolicyParagraphs items={[{ num: "12.1.", text: "A BRAVENZA pode solicitar a qualquer tempo:" }]} />
          <PolicyBulletList items={["Fotos/vídeos adicionais", "Comprovantes de compra/procedência", "Documentos do vendedor", "Confirmações de envio e rastreio"]} />
          <p className="text-muted-foreground mt-3"><strong className="text-foreground">12.2.</strong> A não apresentação de comprovações pode resultar em:</p>
          <PolicyBulletList items={["Ocultação/remoção do anúncio", "Suspensão de venda/saque", "Encerramento da conta"]} />
        </PolicySection>

        <PolicySection icon={FileText} number="13" title="Responsabilidade do vendedor sobre NF e tributos">
          <PolicyParagraphs items={[
            { num: "13.1.", text: "Em vendas por terceiros no marketplace, a BRAVENZA não emite nota fiscal do produto." },
            { num: "13.2.", text: "O vendedor é responsável por obrigações fiscais e emissão de documentos quando exigível." },
          ]} />
        </PolicySection>

        <PolicySection icon={CheckCircle} number="14" title="Boas práticas">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {["Seja extremamente transparente (defeitos, condição, o que acompanha)", "Use fotos claras e completas", "Responda rápido e poste dentro do prazo", "Evite sob encomenda se você não tiver controle real da aquisição", "Mantenha histórico e provas de procedência organizadas"].map((tip, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl border border-primary/20 bg-primary/5">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">{tip}</span>
              </div>
            ))}
          </div>
        </PolicySection>

        <PolicySection icon={Shield} number="15" title="Disposições finais">
          <PolicyParagraphs items={[
            { num: "15.1.", text: "Estas diretrizes podem ser atualizadas a qualquer tempo." },
            { num: "15.2.", text: "Ao anunciar, o vendedor confirma que leu e aceitou estas regras, e que suas informações são verdadeiras." },
          ]} />
        </PolicySection>
      </PolicyPageLayout>
    </>
  );
};

export default AdGuidelinesPage;
