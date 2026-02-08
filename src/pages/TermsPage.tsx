import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const TermsPage = () => {
  return (
    <PublicLayout>
      <Helmet>
        <title>Termos de Uso | BRAVENZA</title>
        <meta name="description" content="Termos de Uso da plataforma BRAVENZA. Conheça as condições para utilização dos nossos serviços de curadoria, intermediação, verificação técnica de autenticidade, marketplace e Club Vault." />
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Termos de Uso — BRAVENZA</h1>
        
        <div className="text-muted-foreground mb-8 space-y-1 text-sm">
          <p>Serviço disponível somente no Brasil</p>
          <p>Em vigor desde: 15/04/2022</p>
          <p>Data da última atualização: 08/02/2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* Introdução */}
          <section>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Estes Termos de Uso aplicam-se aos serviços oferecidos por BRAVENZA LTDA, inscrita no CNPJ sob o nº 52.077.512/0001-50, com sede em Rua Dr. Egydio Michaelsen, 176 - Cavalhada, Porto Alegre/RS, por meio do site www.bravenza.com.br e demais meios digitais eventualmente disponibilizados, doravante denominada "BRAVENZA".
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Para fins destes Termos, "USUÁRIO" é toda pessoa física e/ou jurídica que acesse, utilize ou consuma os serviços e conteúdos disponibilizados pela BRAVENZA.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos de Uso, em conjunto com a{" "}
              <Link to="/politicas" className="text-primary hover:underline font-medium">Política de Privacidade</Link>, quando lidos e aceitos, são válidos, legítimos e eficazes para todos os fins e efeitos de direito.
            </p>
          </section>

          {/* Definições */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Definições</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Para interpretação destes Termos, aplicam-se, sem prejuízo de outras definições constantes do documento:
            </p>
            <ul className="list-[lower-alpha] list-inside text-muted-foreground space-y-2">
              <li><strong>Plataforma:</strong> ambiente digital operado pela BRAVENZA (site, app, áreas logadas, integrações e canais oficiais).</li>
              <li><strong>Marketplace:</strong> ambiente de compra e venda entre USUÁRIOS, com regras próprias.</li>
              <li><strong>Club Vault:</strong> modalidade de acesso e/ou assinatura que pode conferir ao USUÁRIO elegibilidade para vender e acessar benefícios.</li>
              <li><strong>Vendedor:</strong> USUÁRIO autorizado a anunciar e vender no Marketplace.</li>
              <li><strong>Comprador:</strong> USUÁRIO que adquire produtos anunciados no Marketplace.</li>
              <li><strong>Sob encomenda:</strong> modalidade em que o vendedor não possui estoque imediato, mas afirma possuir controle efetivo para adquirir e entregar o produto dentro do prazo informado.</li>
              <li><strong>Verificação/Autenticação:</strong> análise técnica opinativa de melhor esforço, digital e/ou presencial.</li>
              <li><strong>Saldo "A LIBERAR" / "DISPONÍVEL":</strong> estados do valor a ser repassado ao vendedor conforme regras de prazo, risco, disputas e antifraude.</li>
              <li><strong>Chargeback:</strong> contestação do pagamento junto ao emissor/banco/adquirente.</li>
              <li><strong>Políticas complementares:</strong> políticas publicadas e vinculadas (Trocas/Devoluções, Regras do Marketplace, Diretrizes de Anúncio, etc.), que integram estes Termos por referência.</li>
            </ul>
          </section>

          {/* 1. Objeto e natureza */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Objeto e natureza da plataforma</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              1.1. A BRAVENZA atua como plataforma tecnológica de serviços especializados, podendo: (i) hospedar anúncios e catálogos de produtos de terceiros; (ii) disponibilizar mecanismos de compra e venda por meio de tecnologias próprias e/ou de terceiros; (iii) oferecer curadoria e intermediação; (iv) oferecer verificação técnica/autenticação (digital e/ou presencial), com emissão de parecer opinativo; e (v) operar marketplace com regras específicas, inclusive pronta entrega e venda sob encomenda.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              1.2. A BRAVENZA não é, em regra, fornecedora dos produtos anunciados por terceiros, não sendo parte integrante da compra e venda entre USUÁRIOS, salvo quando o anúncio indicar expressamente que o item é vendido pela própria BRAVENZA.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              1.3. A BRAVENZA não é representante oficial de marcas mencionadas na plataforma e não possui vínculo institucional com elas.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              1.4. É expressamente vedada a inserção/anúncio/comercialização de itens proibidos por lei e/ou por estes Termos, incluindo, mas não se limitando a: produtos ilícitos, roubados, falsificados, contrabandeados, importados irregularmente, ou com procedência não comprovada.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              1.5. A BRAVENZA poderá, a seu exclusivo critério e sem necessidade de justificativa detalhada ao USUÁRIO, recusar, ocultar, suspender, remover ou restringir anúncios, contas, transações e funcionalidades quando identificar risco de fraude, ilícito, irregularidade, violação de termos, risco reputacional, risco jurídico, ou quando necessário para proteção do ecossistema e da experiência dos USUÁRIOS.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              1.6. Salvo disposição legal imperativa, a BRAVENZA não se responsabiliza por vícios, defeitos, autenticidade, origem, procedência, garantia e conformidade de produtos anunciados por terceiros, os quais permanecem sob responsabilidade do vendedor/fornecedor do item, sem prejuízo do serviço opinativo de verificação quando contratado.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              1.7. A curadoria, seleção, classificação de vendedores, exibição de anúncios e ordenação de resultados poderão envolver critérios automatizados e/ou humanos, não gerando qualquer obrigação de destaque, performance ou resultado ao USUÁRIO.
            </p>
          </section>

          {/* 2. Elegibilidade */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Elegibilidade, idade e representação</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              2.1. O acesso à plataforma é livre, porém determinadas funcionalidades (especialmente venda no marketplace, saque de valores, assinatura e serviços específicos) poderão ser restritas a maiores de 18 (dezoito) anos.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              2.2. Caso menores de idade utilizem funcionalidades permitidas, seus responsáveis legais deverão supervisionar e, quando aplicável, representar/assistir o menor, conforme legislação.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              2.3. Declarações e obrigações do USUÁRIO se estendem à pessoa jurídica/entidade que ele represente, quando aplicável.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              2.4. Ao criar conta e/ou utilizar a Plataforma, o USUÁRIO declara possuir capacidade civil e poderes suficientes, responsabilizando-se por quaisquer declarações prestadas e por todo uso realizado mediante sua conta e credenciais.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              2.5. A BRAVENZA poderá exigir verificação de identidade, prova de vida, confirmação documental ou validações adicionais, inclusive por terceiros, como condição para liberação de funcionalidades, saques, assinatura, venda ou uso de recursos de risco.
            </p>
          </section>

          {/* 3. Cadastro */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Cadastro, conta e segurança</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              3.1. O USUÁRIO compromete-se a fornecer dados verdadeiros, completos e atualizados, responsabilizando-se civil e criminalmente por informações falsas, inexatas ou de terceiros sem autorização.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              3.2. Em regra, cada USUÁRIO poderá manter uma conta por método de login (e-mail/Google/Apple/outros), sendo vedada a criação de contas para contornar suspensões ou banimentos.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              3.3. A BRAVENZA poderá, a seu exclusivo critério, suspender ou cancelar cadastros com indícios de fraude, falsidade ideológica, uso indevido, má-fé, prática de atos ilícitos ou violação destes Termos, com ou sem aviso prévio, sem prejuízo de medidas legais.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              3.4. O acesso a áreas restritas é exclusivo de contas autorizadas. Qualquer tentativa de acesso indevido, exploração de falhas, automações não autorizadas, scraping, engenharia reversa ou violação de segurança poderá gerar sanções civis e criminais e banimento.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              3.5. O USUÁRIO autoriza a BRAVENZA a adotar medidas de segurança, incluindo (sem limitação) bloqueio preventivo, checagens antifraude, validação de documentos, validação de dispositivo, validação de IP/localização, confirmação por e-mail/SMS/app, e demais práticas usuais de proteção.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              3.6. O USUÁRIO reconhece que a BRAVENZA poderá manter registros (logs) e evidências de acesso e uso para fins de segurança, auditoria, prevenção à fraude e defesa administrativa/judicial, nos termos destes Termos e da{" "}
              <Link to="/politicas" className="text-primary hover:underline font-medium">Política de Privacidade</Link>.
            </p>
          </section>

          {/* 4. Senhas */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Senhas e credenciais</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              4.1. O USUÁRIO é responsável por manter sigilo de senhas, códigos e credenciais, bem como por todas as atividades realizadas em sua conta.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              4.2. Recomenda-se senha forte e medidas de segurança adicionais quando disponíveis.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              4.3. O USUÁRIO deve comunicar imediatamente a BRAVENZA sobre suspeita de uso indevido, perda, roubo ou comprometimento de credenciais, sob pena de responsabilizar-se por danos decorrentes de sua omissão.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              4.4. A BRAVENZA poderá, a seu critério, impor redefinição de senha, revogação de sessões, bloqueio de dispositivo e revalidação de identidade.
            </p>
          </section>

          {/* MÓDULO MARKETPLACE / CLUB VAULT */}
          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Módulo Marketplace / Club Vault</h2>
          </div>

          {/* 5. Tipos de usuário */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Tipos de usuário no marketplace</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              5.1. <strong>Usuário comprador (cadastrado):</strong> pode comprar produtos anunciados no marketplace, sem permissão de venda.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              5.2. <strong>Usuário vendedor (Club Vault / Aprovado):</strong> pode anunciar e vender produtos, sujeito a critérios internos, auditorias, regras de reputação, conformidade e desempenho.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              5.3. A BRAVENZA poderá criar níveis/status (ex.: "Vendedor Vault Verificado/Autenticado") com critérios objetivos (avaliações, nota média, verificação documental, histórico de vendas, índice de cancelamentos, etc.), podendo conceder, suspender ou revogar tal status a qualquer tempo.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              5.4. A BRAVENZA poderá exigir do Vendedor, como condição de permanência: (i) envio de documentos fiscais, (ii) comprovação de procedência, (iii) comprovação de endereço, (iv) validação de conta bancária, (v) aceite de regras adicionais e auditorias periódicas.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              5.5. A elegibilidade para vender e sacar pode ser suspensa preventivamente quando houver: aumento atípico de volume, padrões de risco, denúncias, chargebacks, suspeitas de fraude ou investigações internas.
            </p>
          </section>

          {/* 6. Regras de anúncio */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Regras de anúncio, conduta e proibições</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">6.1. O vendedor declara e garante que:</p>
            <ul className="list-[lower-alpha] list-inside text-muted-foreground space-y-1 mb-4">
              <li>é legítimo proprietário ou possui autorização para vender;</li>
              <li>o item possui origem lícita;</li>
              <li>não viola direitos de terceiros;</li>
              <li>informações e fotos do anúncio são verdadeiras e atuais;</li>
              <li>condição do produto (novo/usado, defeitos, acessórios, caixa, tags) foi descrita com clareza;</li>
              <li>o produto anunciado está disponível conforme a modalidade declarada (pronta entrega ou sob encomenda).</li>
            </ul>

            <p className="text-muted-foreground leading-relaxed mb-3">6.2. É proibido:</p>
            <ul className="list-[lower-alpha] list-inside text-muted-foreground space-y-1 mb-4">
              <li>anunciar produto inexistente ou sem disponibilidade real;</li>
              <li>enviar item diferente do anunciado;</li>
              <li>falsificar comprovações ou ocultar avarias relevantes;</li>
              <li>manipular avaliações, simular transações, usar automações para burlar o sistema;</li>
              <li>direcionar compras/vendas iniciadas na BRAVENZA para fora da plataforma (WhatsApp/Instagram/Pix direto etc.), por incentivo do vendedor ou comprador;</li>
              <li>praticar dropshipping (envio por terceiros sem controle do vendedor) e/ou qualquer modelo em que o vendedor não detenha controle operacional mínimo da aquisição e entrega, salvo autorização expressa e formal da BRAVENZA.</li>
            </ul>

            <p className="text-muted-foreground leading-relaxed mb-3">
              6.3. A violação do item 6.2 poderá implicar: perda de status, suspensão, banimento, cancelamento de pedidos, retenção preventiva de valores e responsabilização civil e penal, quando cabível.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              6.4. É vedado ao vendedor: (i) inserir descrições ambíguas, (ii) omitir fotos relevantes, (iii) usar imagens de terceiros sem autorização, (iv) ofertar itens com risco de violação regulatória, (v) anunciar itens que dependam de "lançamento futuro" sem controle efetivo, (vi) oferecer garantias em nome da BRAVENZA.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              6.5. A BRAVENZA poderá exigir padrões mínimos de anúncio (fotos, ângulos, comprovações) e remover anúncios que não atendam às diretrizes publicadas, sem que isso gere qualquer direito de indenização.
            </p>
          </section>

          {/* 7. Formação do contrato */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Formação do contrato de compra e venda</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              7.1. No marketplace, a compra e venda do produto ocorre diretamente entre vendedor e comprador.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              7.2. Paralelamente, o USUÁRIO contrata serviços da BRAVENZA (plataforma/intermediação, autenticação quando aplicável, processamento, proteção, suporte), conforme a modalidade escolhida.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              7.3. A BRAVENZA não garante idoneidade de USUÁRIOS, mas adota medidas de segurança e pode aplicar sanções e controles quando identificar risco.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              7.4. O USUÁRIO reconhece que a BRAVENZA poderá, por segurança do ecossistema, intervir operacionalmente no fluxo de compra e venda, incluindo: bloqueio, suspensão, cancelamento, solicitação de evidências, solicitação de devolução, retenção preventiva, e ações antifraude.
            </p>
          </section>

          {/* 8. Modalidades de venda */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Modalidades de venda: pronta entrega e sob encomenda</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              8.1. <strong>Pronta entrega:</strong> o vendedor declara possuir o produto em disponibilidade física imediata.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              8.2. <strong>Venda sob encomenda:</strong> o vendedor declara que não possui estoque físico imediato, mas possui controle efetivo para adquirir e entregar o produto dentro dos prazos informados no anúncio e/ou fluxo do pedido, respondendo integralmente por sua execução.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              8.3. A BRAVENZA poderá restringir a modalidade sob encomenda a vendedores com determinados critérios de reputação, histórico e compliance, além de exigir transparência total ao comprador.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              8.4. A modalidade sob encomenda não autoriza dropshipping, nem exime o vendedor de responsabilidade por prazo, qualidade, autenticidade, procedência e entrega.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              8.5. Em sob encomenda, o vendedor reconhece que eventual indisponibilidade, atraso, variação de condição/tamanho ou cancelamento pelo fornecedor não constitui justificativa automática para descumprimento, mantendo-se a responsabilidade integral do vendedor perante o comprador e a BRAVENZA.
            </p>
          </section>

          {/* 9. Meios de pagamento */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Meios de pagamento, terceiros e aprovações</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              9.1. A BRAVENZA poderá aceitar diferentes meios de pagamento e alterá-los a qualquer tempo.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              9.2. Pagamentos podem ser intermediados por terceiros (gateways, adquirentes, bancos). A BRAVENZA não responde por falhas exclusivas desses provedores, sem prejuízo de suporte razoável.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              9.3. Transações podem exigir verificações adicionais (antifraude, aprovação do emissor, confirmação de identidade). A BRAVENZA poderá solicitar informações adicionais antes de concluir a operação.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              9.4. A BRAVENZA poderá cancelar transações e/ou bloquear preventivamente valores quando houver suspeita de fraude, chargeback iminente, inconsistências cadastrais, risco de lavagem de dinheiro ou violação de políticas internas.
            </p>
          </section>

          {/* 10. Taxas */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Taxas, comissões e divisão de valores (split)</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              10.1. A BRAVENZA poderá cobrar: taxa de intermediação, comissão, taxa de autenticação/verificação, taxa de logística técnica, assinatura Club Vault e outros valores divulgados na plataforma.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">10.2. Poderá existir split automático:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-3">
              <li>Valor do produto → vendedor</li>
              <li>Taxas de serviço → BRAVENZA</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-3">
              10.3. As taxas podem variar por perfil, modalidade e campanhas e podem ser alteradas a qualquer tempo, sendo aplicáveis conforme informado ao USUÁRIO.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              10.4. O USUÁRIO reconhece que taxas e valores cobrados podem ser não reembolsáveis quando já houver prestação de serviço, custos operacionais, processamento, antifraude, logística técnica, verificação, ou quando houver retenções legais e regras de adquirentes.
            </p>
          </section>

          {/* 11. Saldo */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Saldo "a liberar" e "disponível", prazo de liberação e saques</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              11.1. O vendedor poderá visualizar seu saldo em dois status: "A LIBERAR" e "DISPONÍVEL".
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              11.2. Regra padrão: após o recebimento do produto pelo comprador, o saldo permanecerá "A LIBERAR" e se tornará "DISPONÍVEL" em até 8 (oito) dias.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              11.3. A BRAVENZA poderá adiar a liberação/saque para apurar: divergência, desistência, disputa, suspeita de fraude, chargeback, ou exigências legais/regulatórias, comunicando o USUÁRIO pelos canais disponíveis quando aplicável.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              11.4. É responsabilidade do vendedor inserir dados bancários corretos. A BRAVENZA não se responsabiliza por erro de cadastro bancário do USUÁRIO.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              11.5. A BRAVENZA poderá reter valores por prazos adicionais quando necessário para: (i) cumprir prazos de contestação de chargeback, (ii) concluir investigações internas, (iii) atender solicitações de autoridades, (iv) resguardar o ecossistema contra fraude e reincidência.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              11.6. Em caso de chargeback ou reversão de pagamento, o vendedor autoriza a BRAVENZA a compensar valores de quaisquer saldos presentes e futuros, bem como a cobrar do vendedor os valores necessários para recomposição integral do prejuízo, inclusive custos operacionais, multas, taxas de adquirentes, logística e verificação, quando aplicável.
            </p>
          </section>

          {/* 12. Prazo de postagem */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Prazo de postagem/envio pelo vendedor</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              12.1. Após a confirmação do pagamento, o vendedor deverá postar/enviar o produto em até 3 (três) dias úteis.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              12.2. O descumprimento poderá ensejar cancelamento da venda, reembolso ao comprador, perda de status, penalidades e sanções internas.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              12.3. A BRAVENZA poderá adotar medidas automáticas de penalidade, como redução de visibilidade, bloqueio temporário, limites de anúncios, aumento de exigências, e/ou exigência de verificação obrigatória em todos os itens do vendedor, conforme padrões de risco.
            </p>
          </section>

          {/* 13. Autenticação */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Autenticação / Verificação técnica (digital e/ou presencial)</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              13.1. A verificação técnica é serviço opinativo e de melhor esforço, baseado em evidências (fotos, vídeos e/ou inspeção física), referências e boas práticas do mercado.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">13.2. Para compras no marketplace:</p>
            <ul className="list-[lower-roman] list-inside text-muted-foreground space-y-1 mb-3">
              <li>Itens acima de R$ 2.000,00: verificação pela BRAVENZA é obrigatória;</li>
              <li>Itens de até R$ 2.000,00: verificação é opcional, mediante escolha do comprador ou regra do anúncio.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-3">
              13.3. O resultado pode ser: Aprovado / Provavelmente aprovado / Inconclusivo / Reprovado, conforme critérios internos.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              13.4. O parecer não é certificação oficial de marcas e não constitui garantia absoluta.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              13.5. Por sigilo e proteção do ecossistema, laudos detalhados podem ter compartilhamento restrito para evitar disseminação de técnicas de falsificação.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              13.6. O USUÁRIO reconhece que a verificação não elimina totalmente o risco de falsificação sofisticada, adulteração posterior, fraude documental, ou limitações de evidência, não havendo garantia absoluta de originalidade.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              13.7. Nos casos de inconclusivo, a BRAVENZA poderá: (i) solicitar evidências adicionais, (ii) exigir verificação presencial, (iii) cancelar preventivamente a transação, (iv) restringir vendedor e/ou comprador, conforme critérios internos de risco.
            </p>
          </section>

          {/* 14. Posse temporária */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">14. Posse temporária e depósito técnico</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              14.1. Quando aplicável, o produto poderá ser enviado à BRAVENZA para inspeção e logística técnica, sem transferência de titularidade.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              14.2. Esse trânsito não caracteriza compra, revenda ou estoque comercial pela BRAVENZA.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              14.3. O USUÁRIO concorda que a BRAVENZA poderá documentar o estado do produto (fotos/vídeos) no recebimento e no envio, como prova de integridade e prevenção de disputas.
            </p>
          </section>

          {/* 15. Responsabilidades do vendedor */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">15. Responsabilidades do vendedor</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">O vendedor é responsável por:</p>
            <ul className="list-[lower-alpha] list-inside text-muted-foreground space-y-1 mb-3">
              <li>origem lícita e procedência do produto;</li>
              <li>autenticidade e conformidade com o anúncio;</li>
              <li>embalagem adequada e proteção;</li>
              <li>cumprimento do prazo de envio;</li>
              <li>garantia legal aplicável, vícios aparentes ou ocultos;</li>
              <li>obrigações fiscais e emissão de documentos quando exigível;</li>
              <li>atendimento e colaboração em disputas, estornos e devoluções.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              15.1. O vendedor assume integralmente a responsabilidade por quaisquer perdas, danos, autuações, reclamações e litígios decorrentes de: (i) irregularidade fiscal, (ii) violação de direitos de terceiros, (iii) venda de item ilícito, (iv) falsificação, (v) divergência de anúncio, (vi) não envio, (vii) fraude.
            </p>
          </section>

          {/* 16. Responsabilidades do comprador */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">16. Responsabilidades do comprador</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">O comprador compromete-se a:</p>
            <ul className="list-[lower-alpha] list-inside text-muted-foreground space-y-1 mb-3">
              <li>fornecer dados verídicos;</li>
              <li>não praticar fraude ou chargeback indevido;</li>
              <li>seguir procedimentos de disputa e devolução;</li>
              <li>respeitar prazos e políticas aplicáveis.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              16.1. O comprador reconhece que contestação indevida (chargeback abusivo) poderá ensejar: bloqueio de conta, restrição de compras e medidas legais.
            </p>
          </section>

          {/* 17. Cancelamentos */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">17. Cancelamentos, estornos e divergências</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              17.1. Caso ocorra divergência relevante (produto diferente do anúncio, reprovação na verificação obrigatória, não envio, etc.) ou desistência/cancelamento dentro das regras aplicáveis, a BRAVENZA poderá realizar estorno imediato ao comprador, sem repasse de taxas ao cliente.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              17.2. A BRAVENZA poderá reter e/ou compensar valores junto ao vendedor, conforme regras de proteção do ecossistema, custos operacionais e prevenção a fraudes, especialmente em casos de reprovação, não envio, divergência comprovada ou chargeback.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              17.3. Estornos são realizados ao titular pagante, conforme meio de pagamento, prazos de adquirente/banco e regras do gateway.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              17.4. O USUÁRIO reconhece que o prazo de estorno pode variar conforme operadora, banco, adquirente e meio de pagamento, não sendo a BRAVENZA responsável por prazos de terceiros, sem prejuízo do suporte razoável.
            </p>
          </section>

          {/* 18. Trocas */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">18. Trocas, devoluções e arrependimento</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              18.1. Trocas/devoluções/arrependimento seguirão a Política de Trocas/Devoluções da BRAVENZA e a legislação aplicável.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              18.2. O não cumprimento de prazos e procedimentos poderá caracterizar desistência.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              18.3. A BRAVENZA poderá adotar medidas contra abuso de direito (art. 187 do Código Civil), inclusive limitar funcionalidades e suspender/banir contas.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              18.4. Em devoluções, o USUÁRIO deve preservar integridade do item, embalagem e acessórios. Divergência de condição poderá ensejar negativa de reembolso e medidas cabíveis, conforme Política de Trocas/Devoluções.
            </p>
          </section>

          {/* 19. Tributos */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">19. Tributos, nota fiscal e responsabilidade fiscal</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              19.1. A BRAVENZA não é responsável pela emissão de nota fiscal de produtos vendidos por terceiros no marketplace, nem pelo recolhimento de tributos incidentes sobre operações entre usuários.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              19.2. O vendedor é o responsável integral por: emissão/entrega de NF quando exigível, recolhimento de tributos e obrigações acessórias.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              19.3. O comprador poderá exigir nota fiscal quando aplicável. O descumprimento pode ensejar cancelamento da venda, sanções, retenções e solicitação de documentação fiscal pela BRAVENZA.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              19.4. A BRAVENZA poderá, a qualquer tempo, exigir do vendedor documentação fiscal comprobatória e, em caso de não conformidade, suspender anúncios, reter valores e/ou encerrar a conta.
            </p>
          </section>

          {/* DISPOSIÇÕES DA PLATAFORMA */}
          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Disposições da plataforma (segurança / direitos)</h2>
          </div>

          {/* 20. Direitos da BRAVENZA */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">20. Direitos da BRAVENZA e segurança técnica</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              20.1. É proibido: acessar áreas restritas, burlar autenticação, testar vulnerabilidades, usar bots/scrapers, interferir no funcionamento (vírus, flood, spam), coletar dados para fins concorrenciais ou manipular o sistema.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              20.2. A BRAVENZA poderá acessar, preservar e divulgar informações quando necessário para cumprir lei/ordem judicial; investigar violações; prevenir fraudes; proteger direitos e segurança da plataforma, usuários e público.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              20.3. O USUÁRIO reconhece que a BRAVENZA poderá implementar mecanismos de detecção automática de fraude e condutas abusivas, inclusive com apoio de terceiros.
            </p>
          </section>

          {/* 21. Conteúdo do usuário */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">21. Conteúdo do usuário e licença</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              21.1. O conteúdo publicado pelo USUÁRIO é de sua responsabilidade.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              21.2. Ao publicar conteúdo, o USUÁRIO concede à BRAVENZA licença não exclusiva para usar, reproduzir, adaptar e exibir o conteúdo para fins de operação e funcionamento da plataforma e divulgação do anúncio.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              21.3. O USUÁRIO garante possuir direitos sobre o conteúdo publicado e isenta a BRAVENZA de quaisquer reclamações de terceiros.
            </p>
          </section>

          {/* 22. Propriedade intelectual */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">22. Propriedade intelectual</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Marca, identidade visual, software, layout, bases e demais ativos da BRAVENZA são protegidos por lei e não podem ser copiados/explorados sem autorização.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              22.1. Feedbacks e sugestões enviados pelo USUÁRIO poderão ser utilizados pela BRAVENZA livremente, sem obrigação de remuneração.
            </p>
          </section>

          {/* 23. LGPD */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">23. LGPD e privacidade (resumo)</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              23.1. A BRAVENZA trata dados pessoais conforme a LGPD e sua{" "}
              <Link to="/politicas" className="text-primary hover:underline font-medium">Política de Privacidade</Link>.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              23.2. Dados podem ser compartilhados com terceiros necessários à operação (pagamentos, antifraude, logística) e por obrigação legal/judicial.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              23.3. O USUÁRIO declara ciência de que determinados dados podem ser necessários para prevenção à fraude e cumprimento de obrigações legais, sendo tratados conforme bases legais aplicáveis.
            </p>
          </section>

          {/* 24. Não inversão */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">24. Não inversão automática do ônus da prova</h2>
            <p className="text-muted-foreground leading-relaxed">
              A utilização da plataforma não implica presunção automática de responsabilidade da BRAVENZA, cabendo ao USUÁRIO demonstrar objetivamente eventual falha na prestação de serviço, sem prejuízo de normas consumeristas aplicáveis.
            </p>
          </section>

          {/* 25. Uso de imagem */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">25. Uso de imagem, registros e prova documental</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              O USUÁRIO autoriza a BRAVENZA a utilizar registros de comunicação, imagens de produtos e documentos enviados exclusivamente para fins de operação, auditoria, prevenção de fraude e defesa jurídica/administrativa.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              25.1. A BRAVENZA poderá manter logs, históricos e evidências pelo prazo necessário para cumprimento legal, prevenção à fraude e exercício regular de direitos.
            </p>
          </section>

          {/* 26. Não caracterização */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">26. Não caracterização de sociedade ou representação</h2>
            <p className="text-muted-foreground leading-relaxed">
              O uso do marketplace e dos serviços não estabelece sociedade, associação, representação comercial, vínculo trabalhista ou exclusividade entre USUÁRIOS e BRAVENZA.
            </p>
          </section>

          {/* 27. Suspensão */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">27. Suspensão, encerramento e cessação</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              27.1. O USUÁRIO pode encerrar sua conta, observadas pendências e obrigações em aberto.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              27.2. A BRAVENZA pode suspender/encerrar contas quando: (i) houver violação destes Termos; (ii) houver risco jurídico/operacional; (iii) houver suspeita de fraude/ilícito; (iv) houver inviabilidade técnica/comercial.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              27.3. O encerramento não prejudica a exigibilidade de obrigações pendentes, indenizações, ressarcimentos, chargebacks e deveres de cooperação em disputas.
            </p>
          </section>

          {/* 28. Limitações */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">28. Limitações de responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              28.1. A BRAVENZA não garante operação ininterrupta, livre de erros ou adequada a necessidades específicas do USUÁRIO.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              28.2. A BRAVENZA não responde por falhas exclusivas de terceiros (pagamentos, internet, transportadoras), perdas indiretas, lucros cessantes ou desvalorização de bens, salvo obrigação legal inafastável.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              28.3. Quando cabível, a responsabilidade máxima da BRAVENZA limita-se ao valor pago pelo serviço específico, salvo disposições legais imperativas.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              28.4. Em nenhuma hipótese a BRAVENZA responderá por perdas decorrentes de: (i) conduta ilícita de vendedor/comprador, (ii) falsificação sofisticada que ultrapasse evidências disponíveis, (iii) fraude documental, (iv) atos de terceiros fora do controle razoável da BRAVENZA.
            </p>
          </section>

          {/* 29. Lei aplicável */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">29. Lei aplicável e foro</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              29.1. Estes Termos são regidos pelas leis brasileiras.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              29.2. Em relações de consumo, aplica-se o foro do domicílio do consumidor, conforme CDC.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              29.3. Para demais relações não consumeristas (parceiros, fornecedores, etc.), fica eleito o foro da comarca de Porto Alegre/Rio Grande do Sul, salvo regra legal diversa.
            </p>
          </section>

          {/* 30. Acordo integral */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">30. Acordo integral e aceite eletrônico</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              30.1. Estes Termos, a{" "}
              <Link to="/politicas" className="text-primary hover:underline font-medium">Política de Privacidade</Link>{" "}
              e demais políticas referenciadas constituem o acordo integral entre BRAVENZA e USUÁRIO.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              30.2. O aceite eletrônico possui plena validade jurídica.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              30.3. A BRAVENZA poderá atualizar estes Termos a qualquer tempo. A continuidade do uso após a atualização caracteriza aceite da versão vigente, recomendando-se revisão periódica.
            </p>
          </section>

          {/* Canais oficiais */}
          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Canais oficiais</h2>
            <p className="text-muted-foreground leading-relaxed">
              O atendimento e comunicações oficiais ocorrerão por meio do e-mail{" "}
              <a href="mailto:contato@bravenza.com.br" className="text-primary hover:underline font-medium">contato@bravenza.com.br</a>{" "}
              ou WhatsApp{" "}
              <a href="https://wa.me/5551981055425" className="text-primary hover:underline font-medium">(51) 98105-5425</a>.
              {" "}A BRAVENZA poderá enviar notificações por e-mail, SMS, app, WhatsApp e/ou notificações internas, conforme dados cadastrados.
            </p>
          </div>

          {/* Políticas complementares */}
          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Políticas complementares</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Integram estes Termos, por referência, as políticas publicadas em:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link to="/politicas" className="text-primary hover:underline font-medium">Política de Privacidade</Link>
              </li>
              <li>
                <Link to="/trocas-devolucoes" className="text-primary hover:underline font-medium">Política de Trocas/Devoluções</Link>
              </li>
              <li>
                <Link to="/diretrizes-anuncio" className="text-primary hover:underline font-medium">Diretrizes de Anúncio</Link>
              </li>
              <li>
                <Link to="/regras-marketplace" className="text-primary hover:underline font-medium">Regras do Marketplace e Club Vault</Link>
              </li>
              <li>
                <Link to="/verificacao-autenticidade" className="text-primary hover:underline font-medium">Política de Verificação/Autenticação (quando aplicável)</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default TermsPage;
