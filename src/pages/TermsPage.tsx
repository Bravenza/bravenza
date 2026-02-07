import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Helmet } from "react-helmet-async";

const TermsPage = () => {
  return (
    <PublicLayout>
      <Helmet>
        <title>Termos de Uso | BRAVENZA</title>
        <meta name="description" content="Termos de Uso da plataforma BRAVENZA. Conheça as condições para utilização dos nossos serviços de curadoria, intermediação, verificação técnica de autenticidade, marketplace e Club Vault." />
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Termos de Uso — Plataforma BRAVENZA</h1>
        <p className="text-muted-foreground mb-8">Última atualização: 07/02/2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Identificação da plataforma</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              A plataforma BRAVENZA é operada por HALLOW LTDA, inscrita no CNPJ nº 52.077.512/0001-50, 
              com sede em Rua Dr. Egydio Michaelsen, 176 - Cavalhada, Porto Alegre/RS, doravante 
              denominada simplesmente "BRAVENZA".
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Ao utilizar a plataforma, o usuário declara ciência e concordância integral com os presentes Termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Natureza jurídica da BRAVENZA</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              2.1. A BRAVENZA constitui plataforma digital de serviços especializados, atuando como ambiente tecnológico de:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-3">
              <li>Curadoria de produtos</li>
              <li>Intermediação entre usuários</li>
              <li>Verificação técnica de autenticidade</li>
              <li>Emissão de parecer técnico opinativo</li>
              <li>Serviços logísticos técnicos de conferência</li>
              <li>Marketplace entre usuários</li>
              <li>Clube exclusivo (Club Vault)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-3">
              2.2. A BRAVENZA não se caracteriza como lojista varejista tradicional, fabricante, importadora direta de bens de terceiros, distribuidora oficial ou representante institucional de marcas, salvo quando expressamente informado.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              2.3. A utilização da plataforma não cria vínculo empregatício, societário, franquia, representação comercial ou exclusividade entre usuários e a BRAVENZA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Escopo dos serviços</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Os serviços disponibilizados possuem natureza técnica, consultiva e opinativa, não se confundindo com venda direta de mercadorias de terceiros.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              A BRAVENZA poderá, de forma isolada ou cumulativa, prestar:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Curadoria técnica de produtos</li>
              <li>Intermediação entre usuários</li>
              <li>Autenticação digital ou presencial</li>
              <li>Parecer técnico opinativo</li>
              <li>Conferência logística técnica</li>
              <li>Mediação facultativa de conflitos</li>
              <li>Serviços de clube exclusivo</li>
              <li>Serviços de marketplace</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Autenticação e limites do parecer técnico</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              4.1. O serviço de autenticação representa melhor esforço técnico, baseado em critérios de mercado e conhecimento especializado.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              4.2. O parecer emitido:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Não constitui certificação oficial de marca</li>
              <li>Não representa garantia absoluta</li>
              <li>Não é laudo pericial judicial</li>
              <li>Possui natureza opinativa</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Posse temporária e depósito técnico</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              5.1. Produtos poderão transitar pela BRAVENZA exclusivamente para verificação técnica.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              5.2. Tal trânsito não caracteriza aquisição, revenda ou estoque comercial.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              5.3. A BRAVENZA atua como depositária temporária, sem transferência de titularidade.
            </p>
          </section>

          {/* MÓDULO MARKETPLACE / CLUB VAULT */}
          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Módulo Marketplace / Club Vault</h2>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Definição de marketplace</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              6.1. A BRAVENZA disponibiliza ambiente digital de marketplace que permite interação comercial direta entre usuários.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              6.2. A BRAVENZA não é proprietária dos produtos ofertados por terceiros, atuando como facilitadora tecnológica e prestadora de serviços acessórios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Tipos de usuários</h2>
            <p className="text-muted-foreground leading-relaxed mb-3 font-medium">
              7.1 Usuário Comprador
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>Pode adquirir produtos</li>
              <li>Não possui permissão de venda</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-3 font-medium">
              7.2 Usuário Vendedor (Club Vault / Aprovado)
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>Pode anunciar e vender</li>
              <li>Está sujeito a auditorias</li>
              <li>Pode ter permissões revogadas a qualquer momento</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA poderá suspender ou encerrar contas preventivamente diante de indícios de irregularidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Anúncios e conduta de venda</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              O vendedor declara que:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-3">
              <li>É legítimo proprietário do item</li>
              <li>O produto possui origem lícita</li>
              <li>Não infringe direitos de terceiros</li>
              <li>Não se trata de falsificação deliberada</li>
              <li>As fotos são reais e atualizadas</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA poderá remover anúncios e bloquear contas sem aviso prévio em caso de irregularidades.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Formação do contrato de compra</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              9.1. A compra e venda ocorre diretamente entre comprador e vendedor.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              9.2. Simultaneamente, forma-se contrato de prestação de serviços entre usuários e BRAVENZA.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              9.3. A BRAVENZA não integra a cadeia de fornecimento do produto, salvo indicação expressa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Pagamentos e split automático</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              10.1. Pagamentos poderão ser processados por intermediadores financeiros terceiros.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              10.2. Poderá existir divisão automática de valores (split):
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-3">
              <li>Valor do produto → vendedor</li>
              <li>Taxas de serviço → BRAVENZA</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              10.3. A BRAVENZA não se apropria de valores de produto como receita própria, salvo quando expressamente indicado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Responsabilidade dos vendedores</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              O vendedor é responsável por:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Origem lícita do produto</li>
              <li>Garantia legal</li>
              <li>Vícios aparentes ou ocultos</li>
              <li>Obrigações fiscais próprias</li>
              <li>Cumprimento de prazos de envio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Responsabilidade dos compradores</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              O comprador compromete-se a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Fornecer dados verídicos</li>
              <li>Não praticar fraude ou chargeback indevido</li>
              <li>Cumprir prazos e pagamentos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Mediação de conflitos</h2>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA poderá atuar como mediadora facultativa, sem obrigação de resultado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">14. Taxas e comissões</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              A BRAVENZA poderá cobrar taxas de:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-3">
              <li>Intermediação</li>
              <li>Autenticação</li>
              <li>Comissão de venda</li>
              <li>Assinaturas de clube</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Valores poderão ser alterados mediante aviso na plataforma.
            </p>
          </section>

          {/* DISPOSIÇÕES GERAIS */}
          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Disposições gerais</h2>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">15. Limitação de responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              A responsabilidade máxima da BRAVENZA limita-se ao valor pago pelo serviço contratado, excluindo:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Danos indiretos</li>
              <li>Lucros cessantes</li>
              <li>Valorização ou desvalorização de ativos</li>
              <li>Danos morais presumidos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">16. Não representação de marcas</h2>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA não possui vínculo institucional ou societário com marcas exibidas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">17. Indenização reversa</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Usuários comprometem-se a indenizar a BRAVENZA por prejuízos decorrentes de:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Produto ilícito</li>
              <li>Fraude</li>
              <li>Informações falsas</li>
              <li>Violação de direitos de terceiros</li>
              <li>Uso indevido da plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">18. Compliance, auditoria e antifraude</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              A BRAVENZA poderá:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-3">
              <li>Solicitar documentos</li>
              <li>Auditar contas</li>
              <li>Suspender operações</li>
              <li>Reter valores preventivamente</li>
              <li>Encerrar contas</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Sempre que houver indícios razoáveis de irregularidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">19. Propriedade intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Marca, tecnologia, layout, software e conteúdos pertencem à BRAVENZA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">20. Proteção de dados — LGPD (resumo)</h2>
            <p className="text-muted-foreground leading-relaxed">
              O tratamento de dados observará a Lei nº 13.709/2018, conforme{" "}
              <a href="/politicas" className="text-primary hover:underline font-medium">
                Política de Privacidade
              </a>{" "}
              própria.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">21. Caso fortuito e força maior</h2>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA não responderá por eventos fora de seu controle razoável.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">22. Prevalência contratual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos prevalecem sobre comunicações informais ou materiais publicitários.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">23. Aceite eletrônico</h2>
            <p className="text-muted-foreground leading-relaxed">
              O aceite digital possui validade jurídica plena.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">24. Não inversão automática do ônus da prova</h2>
            <p className="text-muted-foreground leading-relaxed">
              A utilização da plataforma não implica presunção automática de responsabilidade da BRAVENZA, cabendo ao usuário demonstrar objetivamente eventual falha na prestação de serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">25. Uso de imagem e prova documental</h2>
            <p className="text-muted-foreground leading-relaxed">
              O usuário autoriza a BRAVENZA a utilizar registros de comunicação, imagens de produtos e documentos enviados exclusivamente para fins de comprovação técnica, auditoria ou defesa jurídica.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">26. Não caracterização de sociedade ou representação</h2>
            <p className="text-muted-foreground leading-relaxed">
              A utilização do marketplace não estabelece sociedade, associação, representação comercial ou vínculo de exclusividade entre usuários e a BRAVENZA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">27. Alterações dos termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA poderá modificar estes Termos mediante publicação atualizada na plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">28. Legislação e foro</h2>
            <p className="text-muted-foreground leading-relaxed">
              Aplica-se a legislação brasileira, elegendo-se o foro da comarca da sede da BRAVENZA.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
};

export default TermsPage;
