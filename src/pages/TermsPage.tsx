import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  FileText, Users, Lock, Key, ShoppingBag, ClipboardList, Handshake,
  Package, CreditCard, Percent, Wallet, Timer, ShieldCheck, Building,
  UserCheck, UserCog, Scale, RefreshCw, Receipt, Shield, Eye, Stamp,
  Copyright, Database, Gavel, Image, Ban, AlertTriangle, Phone, Globe
} from "lucide-react";
import {
  PolicyPageLayout, PolicySection, PolicyPartHeader, PolicyBulletList,
  PolicyParagraphs, PolicyNotice
} from "@/components/policy/PolicyPageLayout";

const TermsPage = () => {
  return (
    <>
      <Helmet>
        <title>Termos de Uso | BRAVENZA</title>
        <meta name="description" content="Termos de Uso da plataforma BRAVENZA. Conheça as condições para utilização dos nossos serviços de curadoria, intermediação, verificação técnica de autenticidade, marketplace e Club Vault." />
      </Helmet>

      <PolicyPageLayout
        icon={FileText}
        title="Termos de uso"
        description={
          <>
            Estes Termos de Uso aplicam-se aos serviços oferecidos por BRAVENZA LTDA, inscrita no CNPJ sob o nº 52.077.512/0001-50, com sede em Rua Dr. Egydio Michaelsen, 176 - Cavalhada, Porto Alegre/RS, por meio do site www.bravenza.com.br e demais meios digitais eventualmente disponibilizados.
          </>
        }
        subtitle="Serviço disponível somente no Brasil · Em vigor desde: 15/04/2022 · Última atualização: 08/02/2026"
      >
        {/* Intro */}
        <section>
          <div className="space-y-3 text-muted-foreground">
            <p>Para fins destes Termos, "USUÁRIO" é toda pessoa física e/ou jurídica que acesse, utilize ou consuma os serviços e conteúdos disponibilizados pela BRAVENZA.</p>
            <p>
              Estes Termos de Uso, em conjunto com a{" "}
              <Link to="/politicas" className="text-primary hover:underline font-medium">Política de Privacidade</Link>, quando lidos e aceitos, são válidos, legítimos e eficazes para todos os fins e efeitos de direito.
            </p>
          </div>
        </section>

        {/* Definições */}
        <PolicySection icon={FileText} number="0" title="Definições">
          <p className="text-muted-foreground mb-3">Para interpretação destes Termos, aplicam-se:</p>
          <PolicyBulletList items={[
            "Plataforma: ambiente digital operado pela BRAVENZA (site, app, áreas logadas, integrações e canais oficiais).",
            "Marketplace: ambiente de compra e venda entre USUÁRIOS, com regras próprias.",
            "Club Vault: modalidade de acesso e/ou assinatura que pode conferir ao USUÁRIO elegibilidade para vender e acessar benefícios.",
            "Vendedor: USUÁRIO autorizado a anunciar e vender no Marketplace.",
            "Comprador: USUÁRIO que adquire produtos anunciados no Marketplace.",
            "Sob encomenda: modalidade em que o vendedor não possui estoque imediato, mas afirma possuir controle efetivo para adquirir e entregar o produto dentro do prazo informado.",
            "Verificação/Autenticação: análise técnica opinativa de melhor esforço, digital e/ou presencial.",
            'Saldo "A LIBERAR" / "DISPONÍVEL": estados do valor a ser repassado ao vendedor conforme regras de prazo, risco, disputas e antifraude.',
            "Chargeback: contestação do pagamento junto ao emissor/banco/adquirente.",
            "Políticas complementares: políticas publicadas e vinculadas (Trocas/Devoluções, Regras do Marketplace, Diretrizes de Anúncio, etc.), que integram estes Termos por referência.",
          ]} />
        </PolicySection>

        <PolicySection icon={Globe} number="1" title="Objeto e natureza da plataforma">
          <PolicyParagraphs items={[
            { num: "1.1.", text: "A BRAVENZA atua como plataforma tecnológica de serviços especializados, podendo: (i) hospedar anúncios e catálogos de produtos de terceiros; (ii) disponibilizar mecanismos de compra e venda por meio de tecnologias próprias e/ou de terceiros; (iii) oferecer curadoria e intermediação; (iv) oferecer verificação técnica/autenticação (digital e/ou presencial), com emissão de parecer opinativo; e (v) operar marketplace com regras específicas, inclusive pronta entrega e venda sob encomenda." },
            { num: "1.2.", text: "A BRAVENZA não é, em regra, fornecedora dos produtos anunciados por terceiros, não sendo parte integrante da compra e venda entre USUÁRIOS, salvo quando o anúncio indicar expressamente que o item é vendido pela própria BRAVENZA." },
            { num: "1.3.", text: "A BRAVENZA não é representante oficial de marcas mencionadas na plataforma e não possui vínculo institucional com elas." },
            { num: "1.4.", text: "É expressamente vedada a inserção/anúncio/comercialização de itens proibidos por lei e/ou por estes Termos, incluindo, mas não se limitando a: produtos ilícitos, roubados, falsificados, contrabandeados, importados irregularmente, ou com procedência não comprovada." },
            { num: "1.5.", text: "A BRAVENZA poderá, a seu exclusivo critério e sem necessidade de justificativa detalhada ao USUÁRIO, recusar, ocultar, suspender, remover ou restringir anúncios, contas, transações e funcionalidades quando identificar risco de fraude, ilícito, irregularidade, violação de termos, risco reputacional, risco jurídico, ou quando necessário para proteção do ecossistema e da experiência dos USUÁRIOS." },
            { num: "1.6.", text: "Salvo disposição legal imperativa, a BRAVENZA não se responsabiliza por vícios, defeitos, autenticidade, origem, procedência, garantia e conformidade de produtos anunciados por terceiros, os quais permanecem sob responsabilidade do vendedor/fornecedor do item, sem prejuízo do serviço opinativo de verificação quando contratado." },
            { num: "1.7.", text: "A curadoria, seleção, classificação de vendedores, exibição de anúncios e ordenação de resultados poderão envolver critérios automatizados e/ou humanos, não gerando qualquer obrigação de destaque, performance ou resultado ao USUÁRIO." },
          ]} />
        </PolicySection>

        <PolicySection icon={Users} number="2" title="Elegibilidade, idade e representação">
          <PolicyParagraphs items={[
            { num: "2.1.", text: "O acesso à plataforma é livre, porém determinadas funcionalidades (especialmente venda no marketplace, saque de valores, assinatura e serviços específicos) poderão ser restritas a maiores de 18 (dezoito) anos." },
            { num: "2.2.", text: "Caso menores de idade utilizem funcionalidades permitidas, seus responsáveis legais deverão supervisionar e, quando aplicável, representar/assistir o menor, conforme legislação." },
            { num: "2.3.", text: "Declarações e obrigações do USUÁRIO se estendem à pessoa jurídica/entidade que ele represente, quando aplicável." },
            { num: "2.4.", text: "Ao criar conta e/ou utilizar a Plataforma, o USUÁRIO declara possuir capacidade civil e poderes suficientes, responsabilizando-se por quaisquer declarações prestadas e por todo uso realizado mediante sua conta e credenciais." },
            { num: "2.5.", text: "A BRAVENZA poderá exigir verificação de identidade, prova de vida, confirmação documental ou validações adicionais, inclusive por terceiros, como condição para liberação de funcionalidades, saques, assinatura, venda ou uso de recursos de risco." },
          ]} />
        </PolicySection>

        <PolicySection icon={Lock} number="3" title="Cadastro, conta e segurança">
          <PolicyParagraphs items={[
            { num: "3.1.", text: "O USUÁRIO compromete-se a fornecer dados verdadeiros, completos e atualizados, responsabilizando-se civil e criminalmente por informações falsas, inexatas ou de terceiros sem autorização." },
            { num: "3.2.", text: "Em regra, cada USUÁRIO poderá manter uma conta por método de login (e-mail/Google/Apple/outros), sendo vedada a criação de contas para contornar suspensões ou banimentos." },
            { num: "3.3.", text: "A BRAVENZA poderá, a seu exclusivo critério, suspender ou cancelar cadastros com indícios de fraude, falsidade ideológica, uso indevido, má-fé, prática de atos ilícitos ou violação destes Termos, com ou sem aviso prévio, sem prejuízo de medidas legais." },
            { num: "3.4.", text: "O acesso a áreas restritas é exclusivo de contas autorizadas. Qualquer tentativa de acesso indevido, exploração de falhas, automações não autorizadas, scraping, engenharia reversa ou violação de segurança poderá gerar sanções civis e criminais e banimento." },
            { num: "3.5.", text: "O USUÁRIO autoriza a BRAVENZA a adotar medidas de segurança, incluindo (sem limitação) bloqueio preventivo, checagens antifraude, validação de documentos, validação de dispositivo, validação de IP/localização, confirmação por e-mail/SMS/app, e demais práticas usuais de proteção." },
            { num: "3.6.", text: <span>O USUÁRIO reconhece que a BRAVENZA poderá manter registros (logs) e evidências de acesso e uso para fins de segurança, auditoria, prevenção à fraude e defesa administrativa/judicial, nos termos destes Termos e da <Link to="/politicas" className="text-primary hover:underline font-medium">Política de Privacidade</Link>.</span> },
          ]} />
        </PolicySection>

        <PolicySection icon={Key} number="4" title="Senhas e credenciais">
          <PolicyParagraphs items={[
            { num: "4.1.", text: "O USUÁRIO é responsável por manter sigilo de senhas, códigos e credenciais, bem como por todas as atividades realizadas em sua conta." },
            { num: "4.2.", text: "Recomenda-se senha forte e medidas de segurança adicionais quando disponíveis." },
            { num: "4.3.", text: "O USUÁRIO deve comunicar imediatamente a BRAVENZA sobre suspeita de uso indevido, perda, roubo ou comprometimento de credenciais, sob pena de responsabilizar-se por danos decorrentes de sua omissão." },
            { num: "4.4.", text: "A BRAVENZA poderá, a seu critério, impor redefinição de senha, revogação de sessões, bloqueio de dispositivo e revalidação de identidade." },
          ]} />
        </PolicySection>

        {/* MÓDULO MARKETPLACE / CLUB VAULT */}
        <PolicyPartHeader title="Módulo Marketplace / Club Vault" subtitle="Regras específicas para compra, venda e intermediação" />

        <PolicySection icon={ShoppingBag} number="5" title="Tipos de usuário no marketplace">
          <PolicyParagraphs items={[
            { num: "5.1.", text: "Usuário comprador (cadastrado): pode comprar produtos anunciados no marketplace, sem permissão de venda." },
            { num: "5.2.", text: "Usuário vendedor (Club Vault / Aprovado): pode anunciar e vender produtos, sujeito a critérios internos, auditorias, regras de reputação, conformidade e desempenho." },
            { num: "5.3.", text: 'A BRAVENZA poderá criar níveis/status (ex.: "Vendedor Vault Verificado/Autenticado") com critérios objetivos (avaliações, nota média, verificação documental, histórico de vendas, índice de cancelamentos, etc.), podendo conceder, suspender ou revogar tal status a qualquer tempo.' },
            { num: "5.4.", text: "A BRAVENZA poderá exigir do Vendedor, como condição de permanência: (i) envio de documentos fiscais, (ii) comprovação de procedência, (iii) comprovação de endereço, (iv) validação de conta bancária, (v) aceite de regras adicionais e auditorias periódicas." },
            { num: "5.5.", text: "A elegibilidade para vender e sacar pode ser suspensa preventivamente quando houver: aumento atípico de volume, padrões de risco, denúncias, chargebacks, suspeitas de fraude ou investigações internas." },
          ]} />
        </PolicySection>

        <PolicySection icon={ClipboardList} number="6" title="Regras de anúncio, conduta e proibições">
          <p className="text-muted-foreground mb-3"><strong className="text-foreground">6.1.</strong> O vendedor declara e garante que:</p>
          <PolicyBulletList items={[
            "é legítimo proprietário ou possui autorização para vender;",
            "o item possui origem lícita;",
            "não viola direitos de terceiros;",
            "informações e fotos do anúncio são verdadeiras e atuais;",
            "condição do produto (novo/usado, defeitos, acessórios, caixa, tags) foi descrita com clareza;",
            "o produto anunciado está disponível conforme a modalidade declarada (pronta entrega ou sob encomenda).",
          ]} />
          <p className="text-muted-foreground mt-4 mb-3"><strong className="text-foreground">6.2.</strong> É proibido:</p>
          <PolicyBulletList items={[
            "anunciar produto inexistente ou sem disponibilidade real;",
            "enviar item diferente do anunciado;",
            "falsificar comprovações ou ocultar avarias relevantes;",
            "manipular avaliações, simular transações, usar automações para burlar o sistema;",
            "direcionar compras/vendas iniciadas na BRAVENZA para fora da plataforma (WhatsApp/Instagram/Pix direto etc.);",
            "praticar dropshipping sem autorização expressa e formal da BRAVENZA.",
          ]} />
          <PolicyParagraphs items={[
            { num: "6.3.", text: "A violação do item 6.2 poderá implicar: perda de status, suspensão, banimento, cancelamento de pedidos, retenção preventiva de valores e responsabilização civil e penal, quando cabível." },
            { num: "6.4.", text: 'É vedado ao vendedor: (i) inserir descrições ambíguas, (ii) omitir fotos relevantes, (iii) usar imagens de terceiros sem autorização, (iv) ofertar itens com risco de violação regulatória, (v) anunciar itens que dependam de "lançamento futuro" sem controle efetivo, (vi) oferecer garantias em nome da BRAVENZA.' },
            { num: "6.5.", text: "A BRAVENZA poderá exigir padrões mínimos de anúncio (fotos, ângulos, comprovações) e remover anúncios que não atendam às diretrizes publicadas, sem que isso gere qualquer direito de indenização." },
          ]} />
        </PolicySection>

        <PolicySection icon={Handshake} number="7" title="Formação do contrato de compra e venda">
          <PolicyParagraphs items={[
            { num: "7.1.", text: "No marketplace, a compra e venda do produto ocorre diretamente entre vendedor e comprador." },
            { num: "7.2.", text: "Paralelamente, o USUÁRIO contrata serviços da BRAVENZA (plataforma/intermediação, autenticação quando aplicável, processamento, proteção, suporte), conforme a modalidade escolhida." },
            { num: "7.3.", text: "A BRAVENZA não garante idoneidade de USUÁRIOS, mas adota medidas de segurança e pode aplicar sanções e controles quando identificar risco." },
            { num: "7.4.", text: "O USUÁRIO reconhece que a BRAVENZA poderá, por segurança do ecossistema, intervir operacionalmente no fluxo de compra e venda, incluindo: bloqueio, suspensão, cancelamento, solicitação de evidências, solicitação de devolução, retenção preventiva, e ações antifraude." },
          ]} />
        </PolicySection>

        <PolicySection icon={Package} number="8" title="Modalidades de venda: pronta entrega e sob encomenda">
          <PolicyParagraphs items={[
            { num: "8.1.", text: "Pronta entrega: o vendedor declara possuir o produto em disponibilidade física imediata." },
            { num: "8.2.", text: "Venda sob encomenda: o vendedor declara que não possui estoque físico imediato, mas possui controle efetivo para adquirir e entregar o produto dentro dos prazos informados no anúncio e/ou fluxo do pedido, respondendo integralmente por sua execução." },
            { num: "8.3.", text: "A BRAVENZA poderá restringir a modalidade sob encomenda a vendedores com determinados critérios de reputação, histórico e compliance, além de exigir transparência total ao comprador." },
            { num: "8.4.", text: "A modalidade sob encomenda não autoriza dropshipping, nem exime o vendedor de responsabilidade por prazo, qualidade, autenticidade, procedência e entrega." },
            { num: "8.5.", text: "Em sob encomenda, o vendedor reconhece que eventual indisponibilidade, atraso, variação de condição/tamanho ou cancelamento pelo fornecedor não constitui justificativa automática para descumprimento, mantendo-se a responsabilidade integral do vendedor perante o comprador e a BRAVENZA." },
          ]} />
        </PolicySection>

        <PolicySection icon={CreditCard} number="9" title="Meios de pagamento, terceiros e aprovações">
          <PolicyParagraphs items={[
            { num: "9.1.", text: "A BRAVENZA poderá aceitar diferentes meios de pagamento e alterá-los a qualquer tempo." },
            { num: "9.2.", text: "Pagamentos podem ser intermediados por terceiros (gateways, adquirentes, bancos). A BRAVENZA não responde por falhas exclusivas desses provedores, sem prejuízo de suporte razoável." },
            { num: "9.3.", text: "Transações podem exigir verificações adicionais (antifraude, aprovação do emissor, confirmação de identidade). A BRAVENZA poderá solicitar informações adicionais antes de concluir a operação." },
            { num: "9.4.", text: "A BRAVENZA poderá cancelar transações e/ou bloquear preventivamente valores quando houver suspeita de fraude, chargeback iminente, inconsistências cadastrais, risco de lavagem de dinheiro ou violação de políticas internas." },
          ]} />
        </PolicySection>

        <PolicySection icon={Percent} number="10" title="Taxas, comissões e divisão de valores (split)">
          <PolicyParagraphs items={[
            { num: "10.1.", text: "A BRAVENZA poderá cobrar: taxa de intermediação, comissão, taxa de autenticação/verificação, taxa de logística técnica, assinatura Club Vault e outros valores divulgados na plataforma." },
          ]} />
          <p className="text-muted-foreground mt-2 mb-2"><strong className="text-foreground">10.2.</strong> Poderá existir split automático:</p>
          <PolicyBulletList items={["Valor do produto → vendedor", "Taxas de serviço → BRAVENZA"]} />
          <PolicyParagraphs items={[
            { num: "10.3.", text: "As taxas podem variar por perfil, modalidade e campanhas e podem ser alteradas a qualquer tempo, sendo aplicáveis conforme informado ao USUÁRIO." },
            { num: "10.4.", text: "O USUÁRIO reconhece que taxas e valores cobrados podem ser não reembolsáveis quando já houver prestação de serviço, custos operacionais, processamento, antifraude, logística técnica, verificação, ou quando houver retenções legais e regras de adquirentes." },
          ]} />
        </PolicySection>

        <PolicySection icon={Wallet} number="11" title='Saldo "a liberar" e "disponível", prazo de liberação e saques'>
          <PolicyParagraphs items={[
            { num: "11.1.", text: 'O vendedor poderá visualizar seu saldo em dois status: "A LIBERAR" e "DISPONÍVEL".' },
            { num: "11.2.", text: 'Regra padrão: após o recebimento do produto pelo comprador, o saldo permanecerá "A LIBERAR" e se tornará "DISPONÍVEL" em até 8 (oito) dias.' },
            { num: "11.3.", text: "A BRAVENZA poderá adiar a liberação/saque para apurar: divergência, desistência, disputa, suspeita de fraude, chargeback, ou exigências legais/regulatórias, comunicando o USUÁRIO pelos canais disponíveis quando aplicável." },
            { num: "11.4.", text: "É responsabilidade do vendedor inserir dados bancários corretos. A BRAVENZA não se responsabiliza por erro de cadastro bancário do USUÁRIO." },
            { num: "11.5.", text: "A BRAVENZA poderá reter valores por prazos adicionais quando necessário para: (i) cumprir prazos de contestação de chargeback, (ii) concluir investigações internas, (iii) atender solicitações de autoridades, (iv) resguardar o ecossistema contra fraude e reincidência." },
            { num: "11.6.", text: "Em caso de chargeback ou reversão de pagamento, o vendedor autoriza a BRAVENZA a compensar valores de quaisquer saldos presentes e futuros, bem como a cobrar do vendedor os valores necessários para recomposição integral do prejuízo, inclusive custos operacionais, multas, taxas de adquirentes, logística e verificação, quando aplicável." },
          ]} />
        </PolicySection>

        <PolicySection icon={Timer} number="12" title="Prazo de postagem/envio pelo vendedor">
          <PolicyParagraphs items={[
            { num: "12.1.", text: "Após a confirmação do pagamento, o vendedor deverá postar/enviar o produto em até 3 (três) dias úteis." },
            { num: "12.2.", text: "O descumprimento poderá ensejar cancelamento da venda, reembolso ao comprador, perda de status, penalidades e sanções internas." },
            { num: "12.3.", text: "A BRAVENZA poderá adotar medidas automáticas de penalidade, como redução de visibilidade, bloqueio temporário, limites de anúncios, aumento de exigências, e/ou exigência de verificação obrigatória em todos os itens do vendedor, conforme padrões de risco." },
          ]} />
        </PolicySection>

        <PolicySection icon={ShieldCheck} number="13" title="Autenticação / Verificação técnica (digital e/ou presencial)">
          <PolicyParagraphs items={[
            { num: "13.1.", text: "A verificação técnica é serviço opinativo e de melhor esforço, baseado em evidências (fotos, vídeos e/ou inspeção física), referências e boas práticas do mercado." },
          ]} />
          <p className="text-muted-foreground mt-2 mb-2"><strong className="text-foreground">13.2.</strong> Para compras no marketplace:</p>
          <PolicyBulletList items={[
            "Itens acima de R$ 2.000,00: verificação pela BRAVENZA é obrigatória;",
            "Itens de até R$ 2.000,00: verificação é opcional, mediante escolha do comprador ou regra do anúncio.",
          ]} />
          <PolicyParagraphs items={[
            { num: "13.3.", text: "O resultado pode ser: Autêntico ou Réplica, conforme critérios internos." },
            { num: "13.4.", text: "O parecer não é certificação oficial de marcas e não constitui garantia absoluta." },
            { num: "13.5.", text: "Por sigilo e proteção do ecossistema, laudos detalhados podem ter compartilhamento restrito para evitar disseminação de técnicas de falsificação." },
            { num: "13.6.", text: "O USUÁRIO reconhece que a verificação não elimina totalmente o risco de falsificação sofisticada, adulteração posterior, fraude documental, ou limitações de evidência, não havendo garantia absoluta de originalidade." },
          ]} />
        </PolicySection>

        <PolicySection icon={Building} number="14" title="Posse temporária e depósito técnico">
          <PolicyParagraphs items={[
            { num: "14.1.", text: "Quando aplicável, o produto poderá ser enviado à BRAVENZA para inspeção e logística técnica, sem transferência de titularidade." },
            { num: "14.2.", text: "Esse trânsito não caracteriza compra, revenda ou estoque comercial pela BRAVENZA." },
            { num: "14.3.", text: "O USUÁRIO concorda que a BRAVENZA poderá documentar o estado do produto (fotos/vídeos) no recebimento e no envio, como prova de integridade e prevenção de disputas." },
          ]} />
        </PolicySection>

        <PolicySection icon={UserCog} number="15" title="Responsabilidades do vendedor">
          <p className="text-muted-foreground mb-3">O vendedor é responsável por:</p>
          <PolicyBulletList items={[
            "origem lícita e procedência do produto;",
            "autenticidade e conformidade com o anúncio;",
            "embalagem adequada e proteção;",
            "cumprimento do prazo de envio;",
            "garantia legal aplicável, vícios aparentes ou ocultos;",
            "obrigações fiscais e emissão de documentos quando exigível;",
            "atendimento e colaboração em disputas, estornos e devoluções.",
          ]} />
          <PolicyParagraphs items={[
            { num: "15.1.", text: "O vendedor assume integralmente a responsabilidade por quaisquer perdas, danos, autuações, reclamações e litígios decorrentes de: (i) irregularidade fiscal, (ii) violação de direitos de terceiros, (iii) venda de item ilícito, (iv) falsificação, (v) divergência de anúncio, (vi) não envio, (vii) fraude." },
          ]} />
        </PolicySection>

        <PolicySection icon={UserCheck} number="16" title="Responsabilidades do comprador">
          <p className="text-muted-foreground mb-3">O comprador compromete-se a:</p>
          <PolicyBulletList items={[
            "fornecer dados verídicos;",
            "não praticar fraude ou chargeback indevido;",
            "seguir procedimentos de disputa e devolução;",
            "respeitar prazos e políticas aplicáveis.",
          ]} />
          <PolicyParagraphs items={[
            { num: "16.1.", text: "O comprador reconhece que contestação indevida (chargeback abusivo) poderá ensejar: bloqueio de conta, restrição de compras e medidas legais." },
          ]} />
        </PolicySection>

        <PolicySection icon={Scale} number="17" title="Cancelamentos, estornos e divergências">
          <PolicyParagraphs items={[
            { num: "17.1.", text: "Caso ocorra divergência relevante (produto diferente do anúncio, reprovação na verificação obrigatória, não envio, etc.) ou desistência/cancelamento dentro das regras aplicáveis, a BRAVENZA poderá realizar estorno imediato ao comprador, sem repasse de taxas ao cliente." },
            { num: "17.2.", text: "A BRAVENZA poderá reter e/ou compensar valores junto ao vendedor, conforme regras de proteção do ecossistema, custos operacionais e prevenção a fraudes." },
            { num: "17.3.", text: "Estornos são realizados ao titular pagante, conforme meio de pagamento, prazos de adquirente/banco e regras do gateway." },
            { num: "17.4.", text: "O USUÁRIO reconhece que o prazo de estorno pode variar conforme operadora, banco, adquirente e meio de pagamento, não sendo a BRAVENZA responsável por prazos de terceiros." },
          ]} />
        </PolicySection>

        <PolicySection icon={RefreshCw} number="18" title="Trocas, devoluções e arrependimento">
          <PolicyParagraphs items={[
            { num: "18.1.", text: <span>Trocas/devoluções/arrependimento seguirão a <Link to="/trocas-devolucoes" className="text-primary hover:underline font-medium">Política de Trocas/Devoluções</Link> da BRAVENZA e a legislação aplicável.</span> },
            { num: "18.2.", text: "O não cumprimento de prazos e procedimentos poderá caracterizar desistência." },
            { num: "18.3.", text: "A BRAVENZA poderá adotar medidas contra abuso de direito (art. 187 do Código Civil), inclusive limitar funcionalidades e suspender/banir contas." },
            { num: "18.4.", text: "Em devoluções, o USUÁRIO deve preservar integridade do item, embalagem e acessórios." },
          ]} />
        </PolicySection>

        <PolicySection icon={Receipt} number="19" title="Tributos, nota fiscal e responsabilidade fiscal">
          <PolicyParagraphs items={[
            { num: "19.1.", text: "A BRAVENZA não é responsável pela emissão de nota fiscal de produtos vendidos por terceiros no marketplace, nem pelo recolhimento de tributos incidentes sobre operações entre usuários." },
            { num: "19.2.", text: "O vendedor é o responsável integral por: emissão/entrega de NF quando exigível, recolhimento de tributos e obrigações acessórias." },
            { num: "19.3.", text: "O comprador poderá exigir nota fiscal quando aplicável. O descumprimento pode ensejar cancelamento da venda, sanções, retenções e solicitação de documentação fiscal pela BRAVENZA." },
            { num: "19.4.", text: "A BRAVENZA poderá, a qualquer tempo, exigir do vendedor documentação fiscal comprobatória e, em caso de não conformidade, suspender anúncios, reter valores e/ou encerrar a conta." },
          ]} />
        </PolicySection>

        {/* DISPOSIÇÕES DA PLATAFORMA */}
        <PolicyPartHeader title="Disposições da plataforma (segurança / direitos)" subtitle="Regras gerais de segurança, propriedade e responsabilidade" />

        <PolicySection icon={Shield} number="20" title="Direitos da BRAVENZA e segurança técnica">
          <PolicyParagraphs items={[
            { num: "20.1.", text: "É proibido: acessar áreas restritas, burlar autenticação, testar vulnerabilidades, usar bots/scrapers, interferir no funcionamento (vírus, flood, spam), coletar dados para fins concorrenciais ou manipular o sistema." },
            { num: "20.2.", text: "A BRAVENZA poderá acessar, preservar e divulgar informações quando necessário para cumprir lei/ordem judicial; investigar violações; prevenir fraudes; proteger direitos e segurança da plataforma, usuários e público." },
            { num: "20.3.", text: "O USUÁRIO reconhece que a BRAVENZA poderá implementar mecanismos de detecção automática de fraude e condutas abusivas, inclusive com apoio de terceiros." },
          ]} />
        </PolicySection>

        <PolicySection icon={Eye} number="21" title="Conteúdo do usuário e licença">
          <PolicyParagraphs items={[
            { num: "21.1.", text: "O conteúdo publicado pelo USUÁRIO é de sua responsabilidade." },
            { num: "21.2.", text: "Ao publicar conteúdo, o USUÁRIO concede à BRAVENZA licença não exclusiva para usar, reproduzir, adaptar e exibir o conteúdo para fins de operação e funcionamento da plataforma e divulgação do anúncio." },
            { num: "21.3.", text: "O USUÁRIO garante possuir direitos sobre o conteúdo publicado e isenta a BRAVENZA de quaisquer reclamações de terceiros." },
          ]} />
        </PolicySection>

        <PolicySection icon={Copyright} number="22" title="Propriedade intelectual">
          <p className="text-muted-foreground mb-3">
            Marca, identidade visual, software, layout, bases e demais ativos da BRAVENZA são protegidos por lei e não podem ser copiados/explorados sem autorização.
          </p>
          <PolicyParagraphs items={[
            { num: "22.1.", text: "Feedbacks e sugestões enviados pelo USUÁRIO poderão ser utilizados pela BRAVENZA livremente, sem obrigação de remuneração." },
          ]} />
        </PolicySection>

        <PolicySection icon={Database} number="23" title="LGPD e privacidade (resumo)">
          <PolicyParagraphs items={[
            { num: "23.1.", text: <span>A BRAVENZA trata dados pessoais conforme a LGPD e sua <Link to="/politicas" className="text-primary hover:underline font-medium">Política de Privacidade</Link>.</span> },
            { num: "23.2.", text: "Dados podem ser compartilhados com terceiros necessários à operação (pagamentos, antifraude, logística) e por obrigação legal/judicial." },
            { num: "23.3.", text: "O USUÁRIO declara ciência de que determinados dados podem ser necessários para prevenção à fraude e cumprimento de obrigações legais, sendo tratados conforme bases legais aplicáveis." },
          ]} />
        </PolicySection>

        <PolicySection icon={Gavel} number="24" title="Não inversão automática do ônus da prova">
          <p className="text-muted-foreground">
            A utilização da plataforma não implica presunção automática de responsabilidade da BRAVENZA, cabendo ao USUÁRIO demonstrar objetivamente eventual falha na prestação de serviço, sem prejuízo de normas consumeristas aplicáveis.
          </p>
        </PolicySection>

        <PolicySection icon={Image} number="25" title="Uso de imagem, registros e prova documental">
          <p className="text-muted-foreground mb-3">
            O USUÁRIO autoriza a BRAVENZA a utilizar registros de comunicação, imagens de produtos e documentos enviados exclusivamente para fins de operação, auditoria, prevenção de fraude e defesa jurídica/administrativa.
          </p>
          <PolicyParagraphs items={[
            { num: "25.1.", text: "A BRAVENZA poderá manter logs, históricos e evidências pelo prazo necessário para cumprimento legal, prevenção à fraude e exercício regular de direitos." },
          ]} />
        </PolicySection>

        <PolicySection icon={Ban} number="26" title="Não caracterização de sociedade ou representação">
          <p className="text-muted-foreground">
            O uso do marketplace e dos serviços não estabelece sociedade, associação, representação comercial, vínculo trabalhista ou exclusividade entre USUÁRIOS e BRAVENZA.
          </p>
        </PolicySection>

        <PolicySection icon={AlertTriangle} number="27" title="Suspensão, encerramento e cessação">
          <PolicyParagraphs items={[
            { num: "27.1.", text: "O USUÁRIO pode encerrar sua conta, observadas pendências e obrigações em aberto." },
            { num: "27.2.", text: "A BRAVENZA pode suspender/encerrar contas quando: (i) houver violação destes Termos; (ii) houver risco jurídico/operacional; (iii) houver suspeita de fraude/ilícito; (iv) houver inviabilidade técnica/comercial." },
            { num: "27.3.", text: "O encerramento não prejudica a exigibilidade de obrigações pendentes, indenizações, ressarcimentos, chargebacks e deveres de cooperação em disputas." },
          ]} />
        </PolicySection>

        <PolicySection icon={Shield} number="28" title="Limitações de responsabilidade">
          <PolicyParagraphs items={[
            { num: "28.1.", text: "A BRAVENZA não garante operação ininterrupta, livre de erros ou adequada a necessidades específicas do USUÁRIO." },
            { num: "28.2.", text: "A BRAVENZA não responde por falhas exclusivas de terceiros (pagamentos, internet, transportadoras), perdas indiretas, lucros cessantes ou desvalorização de bens, salvo obrigação legal inafastável." },
            { num: "28.3.", text: "Quando cabível, a responsabilidade máxima da BRAVENZA limita-se ao valor pago pelo serviço específico, salvo disposições legais imperativas." },
            { num: "28.4.", text: "Em nenhuma hipótese a BRAVENZA responderá por perdas decorrentes de: (i) conduta ilícita de vendedor/comprador, (ii) falsificação sofisticada que ultrapasse evidências disponíveis, (iii) fraude documental, (iv) atos de terceiros fora do controle razoável da BRAVENZA." },
          ]} />
        </PolicySection>

        <PolicySection icon={Scale} number="29" title="Lei aplicável e foro">
          <PolicyParagraphs items={[
            { num: "29.1.", text: "Estes Termos são regidos pelas leis brasileiras." },
            { num: "29.2.", text: "Em relações de consumo, aplica-se o foro do domicílio do consumidor, conforme CDC." },
            { num: "29.3.", text: "Para demais relações não consumeristas (parceiros, fornecedores, etc.), fica eleito o foro da comarca de Porto Alegre/Rio Grande do Sul, salvo regra legal diversa." },
          ]} />
        </PolicySection>

        <PolicySection icon={Stamp} number="30" title="Acordo integral e aceite eletrônico">
          <PolicyParagraphs items={[
            { num: "30.1.", text: <span>Estes Termos, a <Link to="/politicas" className="text-primary hover:underline font-medium">Política de Privacidade</Link> e demais políticas referenciadas constituem o acordo integral entre BRAVENZA e USUÁRIO.</span> },
            { num: "30.2.", text: "O aceite eletrônico possui plena validade jurídica." },
            { num: "30.3.", text: "A BRAVENZA poderá atualizar estes Termos a qualquer tempo. A continuidade do uso após a atualização caracteriza aceite da versão vigente, recomendando-se revisão periódica." },
          ]} />
        </PolicySection>

        {/* Canais oficiais */}
        <PolicyNotice
          icon={Phone}
          title="Canais oficiais de atendimento"
          description="contato@bravenza.com.br · WhatsApp: 51 98105.5425"
        />
      </PolicyPageLayout>
    </>
  );
};

export default TermsPage;
