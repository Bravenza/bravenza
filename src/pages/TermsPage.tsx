import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Helmet } from "react-helmet-async";

const TermsPage = () => {
  return (
    <PublicLayout>
      <Helmet>
        <title>Termos de Uso | BRAVENZA</title>
        <meta name="description" content="Termos de Uso da BRAVENZA. Conheça as condições para utilização dos nossos serviços de importação premium de tênis." />
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-16 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-muted-foreground mb-8">Última atualização: Fevereiro de 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao utilizar os serviços da BRAVENZA, você concorda integralmente com estes Termos de Uso. 
              Caso não concorde com alguma disposição, solicitamos que não utilize nossos serviços.
              A BRAVENZA reserva-se o direito de modificar estes termos a qualquer momento, sendo sua 
              responsabilidade verificar periodicamente as atualizações.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Descrição dos Serviços</h2>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA atua como intermediária na importação de tênis e calçados exclusivos, oferecendo:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li>Busca e localização de produtos em mercados internacionais</li>
              <li>Negociação com fornecedores verificados globalmente</li>
              <li>Inspeção rigorosa de autenticidade com documentação fotográfica</li>
              <li>Importação e desembaraço aduaneiro completo</li>
              <li>Entrega nacional ao cliente final com rastreamento em tempo real</li>
              <li>Certificado digital de autenticidade com QR Code verificável</li>
              <li>Portal exclusivo de acompanhamento de pedidos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Vault Club</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              O Vault Club é o programa de membros exclusivos da BRAVENZA, oferecendo benefícios 
              diferenciados conforme o nível de relacionamento:
            </p>
            
            <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Níveis de Membros:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                  <li><strong className="text-foreground">Vault Access:</strong> Nível inicial com acesso às funcionalidades básicas</li>
                  <li><strong className="text-foreground">Vault Privilege:</strong> Upgrade automático ao atingir critérios de engajamento em 12 meses</li>
                  <li><strong className="text-foreground">Vault Black:</strong> Nível máximo por convite, com benefícios exclusivos</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">SLAs de Atendimento:</h4>
                <p className="text-muted-foreground text-sm">
                  Cada nível possui acordos de nível de serviço (SLAs) específicos para primeira resposta, 
                  atualizações de busca e tempo de decisão em Match Rooms. Os SLAs excluem tempo de resposta 
                  do cliente, feriados, logística de terceiros, alfândega e picos globais de demanda.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Match Rooms:</h4>
                <p className="text-muted-foreground text-sm">
                  Ambiente onde opções de produtos encontrados são apresentadas ao membro para decisão. 
                  As janelas de decisão variam de 6h a 24h conforme o nível, sempre condicionadas à 
                  disponibilidade na origem.
                </p>
              </div>
            </div>
            
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <p className="text-warning font-medium mb-2">⚠️ Política Anti-Turismo:</p>
              <p className="text-muted-foreground text-sm">
                Membros que recusarem 5 ou mais matches consecutivos entrarão em "Review Mode", 
                com suspensão temporária de novas buscas por 30 dias. A reativação requer solicitação 
                via "Open Bid" com comprometimento de conversão.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Sistema de Convites (Vault Pass)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Membros ativos do Vault Club podem convidar novos participantes através do sistema Vault Pass:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li>Links de convite possuem <strong className="text-foreground">validade de 7 dias</strong> e são de uso único</li>
              <li>A quantidade de convites disponíveis varia conforme o nível do membro</li>
              <li>Convites são renovados semestralmente</li>
              <li>Quando um convidado realiza sua primeira compra, o membro que convidou recebe recompensas de privilégio (não financeiras)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Processo de Compra</h2>
            <p className="text-muted-foreground leading-relaxed">
              O processo de aquisição segue as seguintes etapas:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li><strong>Solicitação:</strong> O cliente envia o pedido com especificações do produto desejado</li>
              <li><strong>Orçamento:</strong> A BRAVENZA apresenta proposta com valor total e prazo estimado</li>
              <li><strong>Aprovação:</strong> O cliente aprova o orçamento dentro do prazo de validade (geralmente 48h)</li>
              <li><strong>Sinal (50%):</strong> Pagamento de 50% do valor total para início da operação</li>
              <li><strong>Acompanhamento:</strong> Rastreamento completo via portal do cliente</li>
              <li><strong>Saldo (50%):</strong> Pagamento do saldo restante após chegada do produto ao Brasil</li>
              <li><strong>Entrega:</strong> Envio com rastreamento e certificado de autenticidade</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Política de Pagamento</h2>
            <div className="bg-card border border-border rounded-lg p-4 mb-4">
              <p className="text-warning font-medium mb-2">⚠️ Sinal Não-Reembolsável:</p>
              <p className="text-muted-foreground">
                O sinal de 50% é <strong className="text-foreground">não-reembolsável</strong> após a confirmação do pagamento. 
                Este valor serve como garantia de compromisso e multa contratual em caso de desistência.
              </p>
            </div>
            
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-foreground">Formas de pagamento aceitas:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>PIX:</strong> Pagamento instantâneo com QR Code ou código copia-e-cola</li>
              <li><strong>Cartão de Crédito:</strong> À vista (sem juros) ou parcelado em até 12x (com juros progressivos)</li>
            </ul>
            
            <p className="text-muted-foreground leading-relaxed mt-4">
              O saldo restante deve ser pago em até 24 horas após a notificação de chegada do produto 
              ao Brasil. O não pagamento no prazo pode resultar em custos adicionais de armazenagem 
              ou cancelamento do pedido com perda do sinal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Programa de Indicação e Cashback</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Clientes podem participar do programa de indicação e acumular créditos de cashback:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Cada cliente recebe um código único de indicação</li>
              <li>Quando um indicado completa o pagamento total de um pedido, o indicador recebe créditos</li>
              <li>Créditos podem ser utilizados no pagamento do <strong className="text-foreground">Sinal ou Saldo</strong></li>
              <li>Limite de uso: <strong className="text-foreground">máximo 25% do valor total do pedido</strong></li>
              <li>Validade dos créditos: <strong className="text-foreground">90 dias</strong> a partir da data de criação</li>
              <li>Créditos expirados não podem ser reativados ou transferidos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Política de Trocas e Devoluções</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Para pedidos de importação sob encomenda (modalidade VAULT):
            </p>
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Trocas ou reembolsos são permitidos <strong className="text-foreground">apenas em caso de defeito de fabricação</strong></li>
                <li>O tamanho escolhido pelo cliente <strong className="text-foreground">não é passível de troca ou reembolso</strong></li>
                <li>O prazo para reportar problemas é de até <strong className="text-foreground">7 dias após o recebimento</strong></li>
                <li>Defeitos devem ser documentados com fotos detalhadas enviadas ao suporte</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Certificado de Autenticidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo produto adquirido através da BRAVENZA recebe um Certificado Digital de Autenticidade 
              contendo:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li>Código único de identificação (formato BRVZ-ANO-XXXXXX)</li>
              <li>QR Code verificável para validação instantânea</li>
              <li>Fotos de inspeção pré-envio</li>
              <li>Informações do produto (marca, modelo, tamanho, cor)</li>
              <li>Data e local de origem da aquisição</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Prazos de Entrega</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os prazos informados são estimativas baseadas em condições normais de operação. 
              Fatores externos como atrasos alfandegários, greves, pandemias, picos de demanda global 
              ou outros eventos de força maior podem impactar o prazo final. A BRAVENZA se compromete 
              a manter o cliente informado através do portal de rastreamento, e-mail, WhatsApp ou 
              notificações push (quando habilitadas).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Comunicações e Notificações</h2>
            <p className="text-muted-foreground leading-relaxed">
              O cliente autoriza o recebimento de comunicações relacionadas ao pedido através de:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li>E-mail cadastrado</li>
              <li>WhatsApp (número informado no cadastro)</li>
              <li>Notificações push no aplicativo (mediante consentimento)</li>
              <li>Portal do cliente (área logada)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Essas comunicações incluem atualizações de status, lembretes de pagamento, 
              notificações do Vault Club e informações operacionais relevantes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Responsabilidades do Cliente</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Fornecer informações corretas e completas no cadastro (CPF, endereço, contato)</li>
              <li>Informar o tamanho correto do calçado desejado</li>
              <li>Manter dados de contato atualizados para recebimento de notificações</li>
              <li>Realizar os pagamentos nos prazos estabelecidos</li>
              <li>Estar disponível para receber a encomenda no endereço informado</li>
              <li>Respeitar as regras do Vault Club, incluindo prazos de decisão em Match Rooms</li>
              <li>Não compartilhar credenciais de acesso ao portal do cliente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA não se responsabiliza por danos indiretos, lucros cessantes ou perdas 
              decorrentes de atrasos, erros em informações fornecidas pelo cliente, ou eventos 
              de força maior. Nossa responsabilidade está limitada ao valor efetivamente pago 
              pelo cliente. Não nos responsabilizamos por decisões de compra baseadas em 
              expectativas não confirmadas em orçamento formal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">14. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo do site, aplicativo e materiais da BRAVENZA, incluindo logos, 
              textos, design e funcionalidades, são de propriedade exclusiva da BRAVENZA e 
              protegidos pelas leis de propriedade intelectual. É proibida a reprodução sem 
              autorização expressa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">15. Foro e Legislação</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca 
              de <strong className="text-foreground">Porto Alegre/RS</strong> para dirimir quaisquer 
              controvérsias decorrentes deste instrumento, com renúncia expressa a qualquer outro, 
              por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">16. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas sobre estes Termos de Uso, entre em contato:
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
          </section>
        </div>
      </div>
    </PublicLayout>
  );
};

export default TermsPage;
