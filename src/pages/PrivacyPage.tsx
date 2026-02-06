import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Helmet } from "react-helmet-async";

const PrivacyPage = () => {
  return (
    <PublicLayout>
      <Helmet>
        <title>Política de Privacidade | BRAVENZA</title>
        <meta name="description" content="Política de Privacidade da BRAVENZA em conformidade com a LGPD. Saiba como coletamos, usamos e protegemos seus dados pessoais." />
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-8">Última atualização: Fevereiro de 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Introdução</h2>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA está comprometida com a proteção da privacidade e dos dados pessoais de 
              seus clientes, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). 
              Esta política descreve como coletamos, usamos, armazenamos e protegemos suas informações 
              em todas as nossas plataformas, incluindo site, aplicativo PWA e portal do cliente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Dados Coletados</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Coletamos os seguintes tipos de dados pessoais:
            </p>
            
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Dados de Identificação</h4>
                <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                  <li>Nome completo</li>
                  <li>CPF (Cadastro de Pessoa Física)</li>
                </ul>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Dados de Contato</h4>
                <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                  <li>E-mail</li>
                  <li>Telefone/WhatsApp</li>
                </ul>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Dados de Endereço</h4>
                <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                  <li>CEP, logradouro, número e complemento</li>
                  <li>Bairro, cidade e estado</li>
                </ul>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Dados de Pedidos e Transações</h4>
                <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                  <li>Histórico de pedidos e preferências de produtos</li>
                  <li>Registros de pagamentos (não armazenamos dados completos de cartão)</li>
                  <li>Códigos de rastreamento e status de entrega</li>
                  <li>Fotos de inspeção dos produtos</li>
                </ul>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Dados do Vault Club</h4>
                <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                  <li>Nível de membro (tier) e data de upgrade</li>
                  <li>Preferências de marcas, tamanhos e estilos</li>
                  <li>Estatísticas de engajamento (matches, decisões, compras)</li>
                  <li>Wishlist e buscas ativas</li>
                  <li>Códigos de convite gerados e utilizados</li>
                </ul>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Dados do Programa de Indicação</h4>
                <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                  <li>Código de indicação único</li>
                  <li>Registro de indicações realizadas</li>
                  <li>Créditos de cashback acumulados e utilizados</li>
                </ul>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Dados Técnicos</h4>
                <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                  <li>Tokens de sessão para autenticação no portal</li>
                  <li>Tokens de push notification (mediante consentimento)</li>
                  <li>Preferências de notificação (e-mail, WhatsApp, push)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Finalidade do Tratamento</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Utilizamos seus dados pessoais para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Processar e gerenciar seus pedidos de curadoria e autenticação</li>
              <li>Enviar atualizações sobre o status do seu pedido (e-mail, WhatsApp, push)</li>
              <li>Gerar orçamentos, certificados de autenticidade e documentos fiscais</li>
              <li>Comunicar sobre pagamentos, prazos e vencimentos</li>
              <li>Gerenciar sua participação no Vault Club (tier, buscas, Match Rooms)</li>
              <li>Processar o programa de indicação e cashback</li>
              <li>Calcular e aplicar créditos de desconto</li>
              <li>Prestar suporte ao cliente via WhatsApp</li>
              <li>Cumprir obrigações legais, fiscais e regulatórias</li>
              <li>Melhorar nossos serviços e experiência do usuário</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Base Legal</h2>
            <p className="text-muted-foreground leading-relaxed">
              O tratamento de seus dados pessoais é realizado com base nas seguintes hipóteses legais 
              previstas na LGPD:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li><strong>Execução de contrato:</strong> Para processar pedidos, pagamentos e entregas</li>
              <li><strong>Obrigação legal:</strong> Para cumprimento de obrigações fiscais e regulatórias</li>
              <li><strong>Legítimo interesse:</strong> Para melhorar serviços, prevenir fraudes e comunicar atualizações operacionais</li>
              <li><strong>Consentimento:</strong> Para envio de notificações push e comunicações promocionais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Seus dados podem ser compartilhados com os seguintes parceiros e prestadores de serviço:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Mercado Pago:</strong> Processamento de pagamentos via PIX e cartão de crédito</li>
              <li><strong>SuperFrete:</strong> Cálculo e gestão de fretes nacionais</li>
              <li><strong>Transportadoras:</strong> Realização das entregas (Correios, transportadoras privadas)</li>
              <li><strong>Resend:</strong> Envio de e-mails transacionais (orçamentos, atualizações, certificados)</li>
              <li><strong>Twilio/WhatsApp:</strong> Envio de mensagens e notificações via WhatsApp</li>
              <li><strong>Autoridades fiscais:</strong> Quando exigido por lei</li>
              <li><strong>Parceiros e vendedores:</strong> Para processamento e envio de pedidos</li>
            </ul>
            <div className="bg-success/10 border border-success/30 rounded-lg p-4 mt-4">
              <p className="text-muted-foreground text-sm">
                <strong className="text-foreground">Compromisso:</strong> Não vendemos, alugamos ou comercializamos 
                seus dados pessoais com terceiros para fins de marketing ou publicidade.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Armazenamento e Segurança</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seus dados são armazenados em infraestrutura segura com as seguintes proteções:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li>Criptografia em trânsito (TLS/SSL) e em repouso</li>
              <li>Controle de acesso baseado em funções (RBAC)</li>
              <li>Row Level Security (RLS) para isolamento de dados por usuário</li>
              <li>Autenticação segura com tokens de sessão temporários</li>
              <li>Monitoramento contínuo de acessos e atividades suspeitas</li>
              <li>Backups automatizados com retenção segura</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">Importante:</strong> Dados sensíveis de pagamento 
              (números completos de cartão, CVV) nunca são armazenados em nossos sistemas. 
              Todas as transações são processadas diretamente pelo Mercado Pago.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos seus dados pessoais pelos seguintes períodos:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li><strong>Dados de transações:</strong> 5 anos (obrigação fiscal)</li>
              <li><strong>Dados de pedidos:</strong> Enquanto a conta estiver ativa + 2 anos</li>
              <li><strong>Certificados de autenticidade:</strong> Indefinidamente (para verificação futura)</li>
              <li><strong>Sessões de login:</strong> 7 dias (renovação automática)</li>
              <li><strong>Créditos de cashback:</strong> 90 dias (conforme regras do programa)</li>
              <li><strong>Convites Vault Pass:</strong> 7 dias (validade do link)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Após os períodos de retenção, os dados são anonimizados ou excluídos de forma segura, 
              exceto quando a manutenção for necessária para cumprimento de obrigação legal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Seus Direitos (LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Conforme a LGPD, você tem direito a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Confirmação:</strong> Confirmar a existência de tratamento de dados</li>
              <li><strong>Acesso:</strong> Acessar seus dados pessoais armazenados</li>
              <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Anonimização:</strong> Solicitar anonimização ou eliminação de dados desnecessários</li>
              <li><strong>Portabilidade:</strong> Solicitar portabilidade dos dados para outro fornecedor</li>
              <li><strong>Eliminação:</strong> Solicitar eliminação de dados tratados com base em consentimento</li>
              <li><strong>Informação:</strong> Obter informações sobre compartilhamento de dados</li>
              <li><strong>Revogação:</strong> Revogar consentimento previamente fornecido</li>
              <li><strong>Oposição:</strong> Opor-se ao tratamento em determinadas circunstâncias</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Para exercer qualquer destes direitos, entre em contato através dos canais indicados 
              ao final desta política.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Cookies e Tecnologias Similares</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos as seguintes tecnologias:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li><strong>Cookies essenciais:</strong> Manutenção de sessão e autenticação</li>
              <li><strong>LocalStorage:</strong> Preferências de interface e cache de dados</li>
              <li><strong>Service Workers:</strong> Funcionamento offline do aplicativo PWA</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Não utilizamos cookies de rastreamento para publicidade de terceiros nem 
              compartilhamos dados de navegação com plataformas de ads.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Notificações Push</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mediante seu consentimento explícito, podemos enviar notificações push para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li>Atualizações de status de pedidos</li>
              <li>Lembretes de pagamento</li>
              <li>Novidades do Vault Club (Match Rooms, Intel)</li>
              <li>Alertas importantes sobre sua conta</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Você pode desativar as notificações push a qualquer momento nas configurações 
              do seu dispositivo ou no portal do cliente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Transferência Internacional</h2>
            <p className="text-muted-foreground leading-relaxed">
              Em função da natureza do nosso serviço (curadoria com parceiros globais), alguns dados 
              podem ser compartilhados com vendedores e parceiros no exterior exclusivamente para 
              processamento de pedidos. Nesses casos, garantimos que os parceiros internacionais 
              adotam níveis adequados de proteção de dados compatíveis com a LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Menores de Idade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nossos serviços não são direcionados a menores de 18 anos. Não coletamos 
              intencionalmente dados de menores. Se identificarmos que coletamos dados de 
              um menor sem autorização dos responsáveis, tomaremos medidas para excluí-los.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Esta Política de Privacidade pode ser atualizada periodicamente para refletir 
              mudanças em nossos serviços ou na legislação aplicável. Notificaremos sobre 
              alterações significativas através do e-mail cadastrado, WhatsApp ou aviso em 
              nosso site. A data de "última atualização" no topo indica quando a política 
              foi revisada pela última vez.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">14. Contato e Encarregado de Dados (DPO)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para exercer seus direitos, esclarecer dúvidas sobre esta política ou reportar 
              incidentes de segurança, entre em contato:
            </p>
            <ul className="list-none text-muted-foreground mt-3 space-y-2">
              <li>
                <strong className="text-foreground">WhatsApp:</strong>{" "}
                <a 
                  href="https://wa.me/5551981055425" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  51 98105.5425
                </a>
              </li>
              <li>
                <strong className="text-foreground">Instagram:</strong>{" "}
                <a 
                  href="https://www.instagram.com/bravenza.vault" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @bravenza.vault
                </a>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Responderemos às solicitações relacionadas a dados pessoais no prazo de até 
              15 dias úteis, conforme previsto na LGPD.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PrivacyPage;
