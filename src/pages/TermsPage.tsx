import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Helmet } from "react-helmet-async";

const TermsPage = () => {
  return (
    <PublicLayout>
      <Helmet>
        <title>Termos de Uso | BRAVENZA</title>
        <meta name="description" content="Termos de Uso da plataforma BRAVENZA. Conheça as condições para utilização dos nossos serviços de curadoria, intermediação e verificação técnica de autenticidade." />
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Termos de Uso — Plataforma BRAVENZA</h1>
        <p className="text-muted-foreground mb-8">Última atualização: 06/02/2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Identificação da plataforma</h2>
            <p className="text-muted-foreground leading-relaxed">
              A plataforma BRAVENZA é operada por HALLOW LTDA, inscrita no CNPJ nº 52.077.512/0001-50, 
              com sede em Rua Dr. Egydio Michaelsen, 176 - Cavalhada, Porto Alegre/RS, doravante 
              denominada simplesmente "BRAVENZA".
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Natureza jurídica e objeto</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              2.1. A BRAVENZA constitui plataforma digital de serviços especializados, voltada à curadoria, 
              intermediação e verificação técnica de autenticidade de bens colecionáveis.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              2.2. A BRAVENZA não se caracteriza como comerciante varejista tradicional, fabricante, 
              importadora direta de bens de terceiros, distribuidora oficial ou representante institucional de marcas.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              2.3. A utilização da plataforma não estabelece vínculo empregatício, societário, franquia, 
              representação comercial ou exclusividade entre usuários e a BRAVENZA.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              2.4. A realidade operacional e a natureza dos serviços prevalecerão sobre qualquer 
              interpretação isolada de nomenclaturas comerciais ou publicitárias.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Escopo dos serviços</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              A BRAVENZA poderá prestar, de forma isolada ou cumulativa:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Curadoria técnica e consultiva</li>
              <li>Intermediação tecnológica de transações entre usuários</li>
              <li>Verificação técnica de autenticidade</li>
              <li>Emissão de parecer opinativo especializado</li>
              <li>Serviços logísticos técnicos e conferência</li>
              <li>Mediação facultativa de conflitos</li>
              <li>Serviços acessórios relacionados à experiência do usuário</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Os serviços possuem natureza consultiva, técnica e opinativa, não implicando comercialização 
              direta de mercadorias de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Relação entre usuários</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              4.1. As transações de compra e venda são celebradas diretamente entre comprador e vendedor, 
              sendo a BRAVENZA mera intermediadora.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              4.2. A BRAVENZA não integra a cadeia de fornecimento do produto, salvo quando expressamente indicado.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              4.3. O vendedor declara ser legítimo proprietário do bem e responsável por sua origem lícita, 
              regularidade fiscal e documental.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Venda eventual por pessoa física</h2>
            <p className="text-muted-foreground leading-relaxed">
              Usuários pessoa física declaram que eventuais vendas possuem caráter não habitual, referindo-se 
              a bens próprios e não configurando atividade empresarial contínua.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Autenticação e limites do parecer técnico</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              6.1. O serviço de autenticação representa análise técnica de melhor esforço, com base em 
              critérios de mercado e conhecimento especializado.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              6.2. O parecer não constitui:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-3">
              <li>Certificação oficial de fabricante</li>
              <li>Laudo pericial judicial</li>
              <li>Garantia absoluta de autenticidade</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              6.3. O usuário reconhece a natureza opinativa e não infalível do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Posse temporária e depósito técnico</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              7.1. Quando aplicável, o envio de produto à sede da BRAVENZA destina-se exclusivamente à 
              prestação de serviço técnico.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              7.2. Tal procedimento não caracteriza aquisição, revenda, posse definitiva ou estoque comercial.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              7.3. A BRAVENZA atuará como depositária temporária, sem transferência de titularidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Pagamentos e remuneração</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              8.1. A BRAVENZA poderá receber valores exclusivamente pelos serviços prestados.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              8.2. Valores relativos ao produto pertencem ao vendedor.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              8.3. Poderão ser utilizados intermediadores financeiros terceiros e mecanismos automáticos 
              de divisão de pagamentos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Garantia e responsabilidade do produto</h2>
            <p className="text-muted-foreground leading-relaxed">
              A responsabilidade por garantia legal ou contratual recai exclusivamente sobre o vendedor ou fabricante.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Não representação de marcas</h2>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA atua de forma independente, não possuindo vínculo institucional, societário ou 
              autorização de marcas mencionadas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Limitação geral de responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              A responsabilidade da BRAVENZA, quando existente, limita-se ao valor efetivamente pago pelo 
              serviço contratado, excluindo danos indiretos, lucros cessantes e prejuízos morais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Indenização e responsabilidade reversa</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              O usuário compromete-se a indenizar a BRAVENZA por prejuízos decorrentes de:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Informações falsas</li>
              <li>Produtos ilícitos</li>
              <li>Violação de direitos de terceiros</li>
              <li>Uso indevido da plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Autonomia contratual entre usuários</h2>
            <p className="text-muted-foreground leading-relaxed">
              As relações comerciais entre usuários são autônomas, inexistindo solidariedade, subsidiariedade 
              ou corresponsabilidade da BRAVENZA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">14. Mediação facultativa</h2>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA poderá atuar como mediadora facultativa de conflitos, sem obrigação de resultado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">15. Compliance e antifraude</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              A BRAVENZA poderá:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Solicitar documentos</li>
              <li>Auditar contas</li>
              <li>Suspender operações</li>
              <li>Bloquear usuários preventivamente</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Sempre que houver indícios de irregularidade ou risco reputacional, fiscal ou legal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">16. Caso fortuito e força maior</h2>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA não será responsável por falhas decorrentes de eventos fora de seu controle razoável, 
              incluindo instabilidades tecnológicas, logísticas ou regulatórias.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">17. Propriedade intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todos os direitos relativos à marca, layout, software e conteúdos pertencem à BRAVENZA, 
              sendo vedada reprodução não autorizada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">18. Proteção de dados — LGPD (resumo)</h2>
            <p className="text-muted-foreground leading-relaxed">
              O tratamento de dados pessoais observará a Lei nº 13.709/2018 (LGPD), conforme detalhado 
              em documento específico denominado{" "}
              <a href="/politicas" className="text-primary hover:underline font-medium">
                Política de Privacidade
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">19. Alterações dos termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA poderá modificar estes Termos a qualquer momento mediante publicação atualizada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">20. Legislação e foro</h2>
            <p className="text-muted-foreground leading-relaxed">
              Aplica-se a legislação brasileira vigente, elegendo-se o foro da comarca da sede da BRAVENZA 
              para resolução de controvérsias.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
};

export default TermsPage;
