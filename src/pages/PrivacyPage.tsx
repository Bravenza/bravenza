import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck, Database, Target, Scale, Share2, Lock, Clock, 
  UserCheck, Cookie, Bell, Globe, Users, RefreshCw, Phone
} from "lucide-react";
import {
  PolicyPageLayout, PolicySection, PolicyBulletList, PolicyNotice
} from "@/components/policy/PolicyPageLayout";

const DataCard = ({ title, items }: { title: string; items: string[] }) => (
  <div className="p-4 rounded-xl border border-border bg-card/50">
    <h4 className="font-semibold text-foreground mb-2 text-sm">{title}</h4>
    <PolicyBulletList items={items} />
  </div>
);

const PrivacyPage = () => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t("privacy.pageTitle")}</title>
        <meta name="description" content={t("privacy.metaDescription")} />
      </Helmet>

      <PolicyPageLayout
        icon={ShieldCheck}
        title="Política de privacidade"
        description="A BRAVENZA está comprometida com a proteção da privacidade e dos dados pessoais de seus clientes, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)."
        subtitle="Última atualização: Fevereiro de 2026"
      >
        <PolicySection icon={Database} number="1" title="Introdução">
          <p className="text-muted-foreground">
            Esta política descreve como coletamos, usamos, armazenamos e protegemos suas informações em todas as nossas plataformas, incluindo site, aplicativo PWA e portal do cliente.
          </p>
        </PolicySection>

        <PolicySection icon={Database} number="2" title="Dados coletados">
          <p className="text-muted-foreground mb-4">Coletamos os seguintes tipos de dados pessoais:</p>
          <div className="grid gap-3 md:grid-cols-2">
            <DataCard title="Dados de identificação" items={["Nome completo", "CPF (Cadastro de Pessoa Física)"]} />
            <DataCard title="Dados de contato" items={["E-mail", "Telefone/WhatsApp"]} />
            <DataCard title="Dados de endereço" items={["CEP, logradouro, número e complemento", "Bairro, cidade e estado"]} />
            <DataCard title="Dados de pedidos e transações" items={["Histórico de pedidos e preferências de produtos", "Registros de pagamentos (não armazenamos dados completos de cartão)", "Códigos de rastreamento e status de entrega", "Fotos de inspeção dos produtos"]} />
            <DataCard title="Dados do Vault Club" items={["Nível de membro (tier) e data de upgrade", "Preferências de marcas, tamanhos e estilos", "Estatísticas de engajamento", "Wishlist e buscas ativas", "Códigos de convite gerados e utilizados"]} />
            <DataCard title="Dados do programa de indicação" items={["Código de indicação único", "Registro de indicações realizadas", "Créditos de cashback acumulados e utilizados"]} />
            <DataCard title="Dados técnicos" items={["Tokens de sessão para autenticação no portal", "Tokens de push notification (mediante consentimento)", "Preferências de notificação (e-mail, WhatsApp, push)"]} />
          </div>
        </PolicySection>

        <PolicySection icon={Target} number="3" title="Finalidade do tratamento">
          <p className="text-muted-foreground mb-3">Utilizamos seus dados pessoais para:</p>
          <PolicyBulletList items={[
            "Processar e gerenciar seus pedidos de curadoria e autenticação",
            "Enviar atualizações sobre o status do seu pedido (e-mail, WhatsApp, push)",
            "Gerar orçamentos, certificados de autenticidade e documentos fiscais",
            "Comunicar sobre pagamentos, prazos e vencimentos",
            "Gerenciar sua participação no Vault Club (tier, buscas, Match Rooms)",
            "Processar o programa de indicação e cashback",
            "Calcular e aplicar créditos de desconto",
            "Prestar suporte ao cliente via WhatsApp",
            "Cumprir obrigações legais, fiscais e regulatórias",
            "Melhorar nossos serviços e experiência do usuário"
          ]} />
        </PolicySection>

        <PolicySection icon={Scale} number="4" title="Base legal">
          <p className="text-muted-foreground mb-3">O tratamento de seus dados pessoais é realizado com base nas seguintes hipóteses legais previstas na LGPD:</p>
          <PolicyBulletList items={[
            "Execução de contrato: para processar pedidos, pagamentos e entregas",
            "Obrigação legal: para cumprimento de obrigações fiscais e regulatórias",
            "Legítimo interesse: para melhorar serviços, prevenir fraudes e comunicar atualizações operacionais",
            "Consentimento: para envio de notificações push e comunicações promocionais"
          ]} />
        </PolicySection>

        <PolicySection icon={Share2} number="5" title="Compartilhamento de dados">
          <p className="text-muted-foreground mb-3">Seus dados podem ser compartilhados com os seguintes parceiros e prestadores de serviço:</p>
          <PolicyBulletList items={[
            "Mercado Pago: processamento de pagamentos via PIX e cartão de crédito",
            "SuperFrete: cálculo e gestão de fretes nacionais",
            "Transportadoras: realização das entregas (Correios, transportadoras privadas)",
            "Resend: envio de e-mails transacionais (orçamentos, atualizações, certificados)",
            "Twilio/WhatsApp: envio de mensagens e notificações via WhatsApp",
            "Autoridades fiscais: quando exigido por lei",
            "Parceiros e vendedores: para processamento e envio de pedidos"
          ]} />
          <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Compromisso:</strong> Não vendemos, alugamos ou comercializamos seus dados pessoais com terceiros para fins de marketing ou publicidade.
            </p>
          </div>
        </PolicySection>

        <PolicySection icon={Lock} number="6" title="Armazenamento e segurança">
          <p className="text-muted-foreground mb-3">Seus dados são armazenados em infraestrutura segura com as seguintes proteções:</p>
          <PolicyBulletList items={[
            "Criptografia em trânsito (TLS/SSL) e em repouso",
            "Controle de acesso baseado em funções (RBAC)",
            "Row Level Security (RLS) para isolamento de dados por usuário",
            "Autenticação segura com tokens de sessão temporários",
            "Monitoramento contínuo de acessos e atividades suspeitas",
            "Backups automatizados com retenção segura"
          ]} />
          <p className="text-muted-foreground mt-4">
            <strong className="text-foreground">Importante:</strong> Dados sensíveis de pagamento (números completos de cartão, CVV) nunca são armazenados em nossos sistemas. Todas as transações são processadas diretamente pelo Mercado Pago.
          </p>
        </PolicySection>

        <PolicySection icon={Clock} number="7" title="Retenção de dados">
          <p className="text-muted-foreground mb-3">Mantemos seus dados pessoais pelos seguintes períodos:</p>
          <PolicyBulletList items={[
            "Dados de transações: 5 anos (obrigação fiscal)",
            "Dados de pedidos: enquanto a conta estiver ativa + 2 anos",
            "Certificados de autenticidade: indefinidamente (para verificação futura)",
            "Sessões de login: 7 dias (renovação automática)",
            "Créditos de cashback: 90 dias (conforme regras do programa)",
            "Convites Vault Pass: 7 dias (validade do link)"
          ]} />
          <p className="text-muted-foreground mt-4">
            Após os períodos de retenção, os dados são anonimizados ou excluídos de forma segura, exceto quando a manutenção for necessária para cumprimento de obrigação legal.
          </p>
        </PolicySection>

        <PolicySection icon={UserCheck} number="8" title="Seus direitos (LGPD)">
          <p className="text-muted-foreground mb-3">Conforme a LGPD, você tem direito a:</p>
          <PolicyBulletList items={[
            "Confirmação: confirmar a existência de tratamento de dados",
            "Acesso: acessar seus dados pessoais armazenados",
            "Correção: corrigir dados incompletos, inexatos ou desatualizados",
            "Anonimização: solicitar anonimização ou eliminação de dados desnecessários",
            "Portabilidade: solicitar portabilidade dos dados para outro fornecedor",
            "Eliminação: solicitar eliminação de dados tratados com base em consentimento",
            "Informação: obter informações sobre compartilhamento de dados",
            "Revogação: revogar consentimento previamente fornecido",
            "Oposição: opor-se ao tratamento em determinadas circunstâncias"
          ]} />
          <p className="text-muted-foreground mt-4">
            Para exercer qualquer destes direitos, entre em contato através dos canais indicados ao final desta política.
          </p>
        </PolicySection>

        <PolicySection icon={Cookie} number="9" title="Cookies e tecnologias similares">
          <p className="text-muted-foreground mb-3">Utilizamos as seguintes tecnologias:</p>
          <PolicyBulletList items={[
            "Cookies essenciais: manutenção de sessão e autenticação",
            "LocalStorage: preferências de interface e cache de dados",
            "Service Workers: funcionamento offline do aplicativo PWA"
          ]} />
          <p className="text-muted-foreground mt-4">
            Não utilizamos cookies de rastreamento para publicidade de terceiros nem compartilhamos dados de navegação com plataformas de ads.
          </p>
        </PolicySection>

        <PolicySection icon={Bell} number="10" title="Notificações push">
          <p className="text-muted-foreground mb-3">Mediante seu consentimento explícito, podemos enviar notificações push para:</p>
          <PolicyBulletList items={[
            "Atualizações de status de pedidos",
            "Lembretes de pagamento",
            "Novidades do Vault Club (Match Rooms, Intel)",
            "Alertas importantes sobre sua conta"
          ]} />
          <p className="text-muted-foreground mt-4">
            Você pode desativar as notificações push a qualquer momento nas configurações do seu dispositivo ou no portal do cliente.
          </p>
        </PolicySection>

        <PolicySection icon={Globe} number="11" title="Transferência internacional">
          <p className="text-muted-foreground">
            Em função da natureza do nosso serviço (curadoria com parceiros globais), alguns dados podem ser compartilhados com vendedores e parceiros no exterior exclusivamente para processamento de pedidos. Nesses casos, garantimos que os parceiros internacionais adotam níveis adequados de proteção de dados compatíveis com a LGPD.
          </p>
        </PolicySection>

        <PolicySection icon={Users} number="12" title="Menores de idade">
          <p className="text-muted-foreground">
            Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente dados de menores. Se identificarmos que coletamos dados de um menor sem autorização dos responsáveis, tomaremos medidas para excluí-los.
          </p>
        </PolicySection>

        <PolicySection icon={RefreshCw} number="13" title="Alterações nesta política">
          <p className="text-muted-foreground">
            Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossos serviços ou na legislação aplicável. Notificaremos sobre alterações significativas através do e-mail cadastrado, WhatsApp ou aviso em nosso site.
          </p>
        </PolicySection>

        <PolicySection icon={Phone} number="14" title="Contato e encarregado de dados (DPO)">
          <p className="text-muted-foreground mb-3">Para exercer seus direitos, esclarecer dúvidas sobre esta política ou reportar incidentes de segurança:</p>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <a href="mailto:contato@bravenza.com.br" className="text-primary hover:underline font-medium">
              E-mail: contato@bravenza.com.br
            </a>
            <a href="https://wa.me/5551981055425" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
              WhatsApp: 51 98105.5425
            </a>
            <a href="https://www.instagram.com/bravenza.vault" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
              Instagram: @bravenza.vault
            </a>
          </div>
          <p className="text-muted-foreground mt-4">
            Responderemos às solicitações relacionadas a dados pessoais no prazo de até 15 dias úteis, conforme previsto na LGPD.
          </p>
        </PolicySection>

        <PolicyNotice
          icon={ShieldCheck}
          title="Sua privacidade é nossa prioridade"
          description="Todos os dados são tratados em conformidade com a LGPD."
        />
      </PolicyPageLayout>
    </>
  );
};

export default PrivacyPage;
