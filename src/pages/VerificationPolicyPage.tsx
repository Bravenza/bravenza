import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  Shield, ShieldCheck, ShieldAlert, Camera, Eye, Package,
  AlertTriangle, FileText, Lock, Scale, Clock, RefreshCw,
  CheckCircle2, HelpCircle, XCircle, Search
} from "lucide-react";
import {
  PolicyPageLayout, PolicySection, PolicyBulletList, PolicyParagraphs, PolicyNotice
} from "@/components/policy/PolicyPageLayout";

const ResultCard = ({ icon: Icon, label, description, color }: { icon: React.ElementType; label: string; description: string; color: string }) => (
  <div className={`p-4 rounded-xl border ${color} bg-card/50`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-5 w-5" />
      <span className="font-semibold text-foreground">{label}</span>
    </div>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const VerificationPolicyPage = () => {
  return (
    <>
      <Helmet>
        <title>Política de verificação e autenticação | BRAVENZA</title>
        <meta name="description" content="Conheça as regras e o funcionamento do serviço de verificação e autenticação técnica da BRAVENZA para garantir a transparência e segurança das transações." />
      </Helmet>

      <PolicyPageLayout
        icon={Shield}
        title="Política de verificação / autenticação"
        description={
          <>
            Esta Política estabelece as regras e o funcionamento do serviço de Verificação / Autenticação BRAVENZA, quando aplicável, no marketplace e demais fluxos operacionais da plataforma.
            Ela complementa os{" "}
            <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>,{" "}
            <Link to="/regras-marketplace" className="text-primary hover:underline">Regras do Marketplace</Link>,{" "}
            <Link to="/diretrizes-anuncio" className="text-primary hover:underline">Diretrizes de Anúncios</Link> e{" "}
            <Link to="/trocas-devolucoes" className="text-primary hover:underline">Política de Trocas e Devoluções</Link>.
          </>
        }
        subtitle="A utilização do serviço implica ciência e aceite integral desta Política."
      >
        <PolicySection icon={FileText} number="1" title="Natureza do serviço">
          <PolicyParagraphs items={[
            { num: "1.1.", text: "A Verificação / Autenticação BRAVENZA é um serviço técnico opinativo e de melhor esforço, baseado em evidências disponíveis, experiência de mercado e procedimentos internos." },
            { num: "1.2.", text: "O resultado não constitui certificação oficial de marcas, não substitui laudos periciais judiciais e não representa garantia absoluta de originalidade." },
            { num: "1.3.", text: "O serviço tem caráter preventivo e informativo, visando reduzir riscos e aumentar a transparência nas transações." },
          ]} />
        </PolicySection>

        <PolicySection icon={ShieldCheck} number="2" title="Quando a verificação é aplicada">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">2.1. Verificação obrigatória</h3>
              <p className="text-muted-foreground mb-3">A verificação será obrigatória quando:</p>
              <PolicyBulletList items={[
                "O valor do item for superior a R$ 2.000,00",
                "A BRAVENZA identificar risco elevado de falsificação",
                "O anúncio estiver classificado como item raro, limitado ou de alta demanda",
                "Houver exigência interna de segurança"
              ]} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">2.2. Verificação opcional</h3>
              <p className="text-muted-foreground mb-3">Pode ser solicitada quando:</p>
              <PolicyBulletList items={[
                "O valor do item for igual ou inferior a R$ 2.000,00",
                "O comprador optar voluntariamente",
                "O vendedor desejar reforçar confiança",
                "Houver regra específica do anúncio"
              ]} />
            </div>
          </div>
        </PolicySection>

        <PolicySection icon={Search} number="3" title="Modalidades de verificação">
          <p className="text-muted-foreground mb-4">A BRAVENZA poderá utilizar uma ou mais modalidades:</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-xl border border-border bg-card/50">
              <Camera className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-semibold text-foreground mb-1">3.1. Digital</h4>
              <p className="text-sm text-muted-foreground">Análise de fotos e vídeos, avaliação de etiquetas, costuras, solado, caixa e tags. Comparação com bancos de referência.</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/50">
              <Eye className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-semibold text-foreground mb-1">3.2. Presencial (física)</h4>
              <p className="text-sm text-muted-foreground">Inspeção técnica nas dependências da BRAVENZA. Avaliação tátil, visual e estrutural de materiais e acabamento.</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/50">
              <ShieldCheck className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-semibold text-foreground mb-1">3.3. Híbrida</h4>
              <p className="text-sm text-muted-foreground">Combinação de análise digital e inspeção física para maior cobertura e segurança.</p>
            </div>
          </div>
        </PolicySection>

        <PolicySection icon={ShieldAlert} number="4" title="Resultados possíveis">
          <p className="text-muted-foreground mb-4">Após análise, o resultado poderá ser classificado como:</p>
          <div className="grid gap-3 md:grid-cols-2">
            <ResultCard icon={CheckCircle2} label="Aprovado" description="Não foram identificados indícios relevantes de falsificação." color="border-green-500/30" />
            <ResultCard icon={ShieldCheck} label="Provavelmente aprovado" description="Indícios positivos, porém com limitações de evidência." color="border-emerald-500/30" />
            <ResultCard icon={HelpCircle} label="Inconclusivo" description="Evidências insuficientes ou conflitantes." color="border-yellow-500/30" />
            <ResultCard icon={XCircle} label="Reprovado" description="Indícios relevantes de não originalidade ou divergência grave." color="border-red-500/30" />
          </div>
        </PolicySection>

        <PolicySection icon={Eye} number="5" title="Evidências utilizadas">
          <p className="text-muted-foreground mb-3">A verificação poderá considerar, sem limitação:</p>
          <div className="grid gap-2 md:grid-cols-2">
            {["Etiquetas internas e códigos", "Palmilhas, costuras e colagens", "Solado e forma", "Texturas e materiais", "Caixa e embalagens", "Acessórios e tags", "Histórico de procedência", "Referências técnicas internas e externas"].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </PolicySection>

        <PolicySection icon={Package} number="6" title="Fluxo operacional">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">6.1. Quando houver envio físico</h3>
              <PolicyBulletList items={["O produto poderá ser enviado temporariamente à BRAVENZA", "Não há transferência de titularidade", "O período de inspeção pode variar conforme demanda"]} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">6.2. Quando digital</h3>
              <PolicyBulletList items={["O vendedor/comprador deverá fornecer imagens claras e completas", "A falta de evidências pode resultar em resultado inconclusivo"]} />
            </div>
          </div>
        </PolicySection>

        <PolicySection icon={Scale} number="7" title="Custos e taxas (quando aplicável)">
          <PolicyBulletList items={[
            "A BRAVENZA poderá cobrar taxa de verificação quando o serviço for opcional ou adicional",
            "Em casos de verificação obrigatória, a taxa poderá estar embutida nas taxas de serviço ou logística",
            "Os valores podem variar e serão informados na plataforma"
          ]} />
        </PolicySection>

        <PolicySection icon={AlertTriangle} number="8" title="Reprovação e consequências">
          <p className="text-muted-foreground mb-3">Quando o item for reprovado:</p>
          <PolicyBulletList items={[
            "A transação poderá ser cancelada",
            "O comprador poderá ser reembolsado conforme regras de pagamento",
            "O vendedor poderá sofrer sanções internas",
            "O item poderá ser devolvido ao remetente mediante regras logísticas"
          ]} />
        </PolicySection>

        <PolicySection icon={Lock} number="9" title="Sigilo técnico">
          <PolicyParagraphs items={[
            { num: "9.1.", text: "A BRAVENZA poderá restringir a divulgação de laudos detalhados, metodologias e critérios técnicos, com o objetivo de evitar o uso indevido dessas informações para aperfeiçoamento de falsificações." },
            { num: "9.2.", text: "Informações completas poderão ser disponibilizadas apenas em disputas formais, quando necessário." },
          ]} />
        </PolicySection>

        <PolicySection icon={ShieldAlert} number="10" title="Limitações do serviço">
          <PolicyBulletList items={[
            "Não é garantia vitalícia de autenticidade",
            "Não substitui perícia judicial",
            "Baseia-se em evidências disponíveis no momento da análise",
            "Pode sofrer limitações por desgaste natural do produto, ausência de acessórios ou adulterações"
          ]} />
        </PolicySection>

        <PolicySection icon={Scale} number="11" title="Responsabilidade das partes">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">11.1. Do vendedor</h3>
              <PolicyBulletList items={["Fornecer informações verdadeiras", "Enviar o produto nas condições anunciadas", "Cooperar com solicitações de evidências"]} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">11.2. Do comprador</h3>
              <PolicyBulletList items={["Fornecer provas quando solicitado", "Seguir fluxos oficiais de disputa e devolução"]} />
            </div>
          </div>
        </PolicySection>

        <PolicySection icon={Clock} number="12" title="Armazenamento temporário">
          <p className="text-muted-foreground">
            Quando houver inspeção física, o item poderá permanecer em guarda técnica por período limitado, apenas para fins de verificação e logística, sem caracterizar estoque comercial.
          </p>
        </PolicySection>

        <PolicySection icon={RefreshCw} number="13" title="Atualizações da política">
          <p className="text-muted-foreground">
            A BRAVENZA poderá atualizar esta Política a qualquer momento para aprimorar segurança, tecnologia e procedimentos. O uso contínuo da plataforma representa aceite das versões atualizadas.
          </p>
        </PolicySection>

        <PolicyNotice
          icon={Shield}
          title="A Verificação BRAVENZA é um serviço de proteção e transparência"
          description="Não constitui certificação oficial de marcas."
        />
      </PolicyPageLayout>
    </>
  );
};

export default VerificationPolicyPage;
