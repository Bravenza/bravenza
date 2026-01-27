import { PublicLayout } from "@/components/layouts/PublicLayout";

const PrivacyPage = () => {
  return (
    <PublicLayout>
      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-8">Última atualização: Janeiro de 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Introdução</h2>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA está comprometida com a proteção da privacidade e dos dados pessoais de 
              seus clientes, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). 
              Esta política descreve como coletamos, usamos, armazenamos e protegemos suas informações.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Dados Coletados</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Coletamos os seguintes tipos de dados pessoais:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Dados de identificação:</strong> Nome completo, CPF</li>
              <li><strong>Dados de contato:</strong> E-mail, telefone/WhatsApp</li>
              <li><strong>Dados de endereço:</strong> Endereço completo para entrega</li>
              <li><strong>Dados de pedido:</strong> Histórico de compras, preferências de produtos</li>
              <li><strong>Dados de pagamento:</strong> Registros de transações (não armazenamos dados de cartão)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Finalidade do Tratamento</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Utilizamos seus dados pessoais para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Processar e gerenciar seus pedidos de importação</li>
              <li>Enviar atualizações sobre o status do seu pedido</li>
              <li>Gerar orçamentos e documentos fiscais</li>
              <li>Comunicar sobre pagamentos e prazos</li>
              <li>Prestar suporte ao cliente</li>
              <li>Cumprir obrigações legais e regulatórias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Base Legal</h2>
            <p className="text-muted-foreground leading-relaxed">
              O tratamento de seus dados pessoais é realizado com base nas seguintes hipóteses legais 
              previstas na LGPD:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li><strong>Execução de contrato:</strong> Para processar pedidos e prestar serviços</li>
              <li><strong>Obrigação legal:</strong> Para cumprimento de obrigações fiscais e regulatórias</li>
              <li><strong>Legítimo interesse:</strong> Para melhorar nossos serviços e comunicação</li>
              <li><strong>Consentimento:</strong> Para comunicações de marketing (quando aplicável)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Seus dados podem ser compartilhados com:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Transportadoras:</strong> Para realização das entregas</li>
              <li><strong>Processadores de pagamento:</strong> Para processamento de transações financeiras</li>
              <li><strong>Autoridades fiscais:</strong> Quando exigido por lei</li>
              <li><strong>Despachantes aduaneiros:</strong> Para desembaraço de importações</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Não vendemos, alugamos ou comercializamos seus dados pessoais com terceiros para 
              fins de marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Armazenamento e Segurança</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seus dados são armazenados em servidores seguros com criptografia de ponta a ponta. 
              Implementamos medidas técnicas e organizacionais apropriadas para proteger seus dados 
              contra acesso não autorizado, perda, destruição ou alteração. O acesso aos dados é 
              restrito a colaboradores autorizados que necessitam das informações para execução 
              de suas funções.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades 
              descritas nesta política, ou conforme exigido por lei. Dados de transações 
              comerciais são mantidos por 5 anos para fins fiscais. Após este período, os 
              dados são anonimizados ou excluídos de forma segura.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Seus Direitos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Conforme a LGPD, você tem direito a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Confirmar a existência de tratamento de dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Solicitar portabilidade dos dados</li>
              <li>Revogar consentimento previamente fornecido</li>
              <li>Obter informações sobre compartilhamento de dados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies essenciais para o funcionamento do site e manutenção da sua 
              sessão de login. Não utilizamos cookies de rastreamento para publicidade de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Esta Política de Privacidade pode ser atualizada periodicamente. Notificaremos sobre 
              alterações significativas através do e-mail cadastrado ou aviso em nosso site. 
              Recomendamos a revisão periódica desta página.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Contato e Encarregado de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato 
              através do nosso Instagram{" "}
              <a 
                href="https://www.instagram.com/bravenza.vault" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @bravenza.vault
              </a>.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PrivacyPage;
