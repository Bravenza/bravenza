import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-muted-foreground mb-8">Última atualização: Janeiro de 2026</p>

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
              A BRAVENZA atua como intermediária na importação de sneakers e calçados exclusivos. 
              Nossos serviços incluem:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li>Busca e localização de produtos em mercados internacionais</li>
              <li>Negociação com fornecedores verificados</li>
              <li>Inspeção de autenticidade e qualidade</li>
              <li>Importação e desembaraço aduaneiro</li>
              <li>Entrega nacional ao cliente final</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Processo de Compra</h2>
            <p className="text-muted-foreground leading-relaxed">
              O processo de aquisição segue as seguintes etapas:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li><strong>Solicitação:</strong> O cliente envia o pedido com especificações do produto desejado</li>
              <li><strong>Orçamento:</strong> A BRAVENZA apresenta proposta com valor total e prazo estimado</li>
              <li><strong>Aprovação:</strong> O cliente aprova o orçamento e aceita os termos aplicáveis</li>
              <li><strong>Sinal (50%):</strong> Pagamento de 50% do valor total para início da operação</li>
              <li><strong>Saldo (50%):</strong> Pagamento do saldo restante após chegada do produto ao Brasil</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Política de Pagamento</h2>
            <div className="bg-card border border-border rounded-lg p-4 mb-4">
              <p className="text-warning font-medium mb-2">⚠️ Importante:</p>
              <p className="text-muted-foreground">
                O sinal de 50% é <strong className="text-foreground">não-reembolsável</strong> após a confirmação do pagamento. 
                Este valor serve como garantia de compromisso e multa contratual em caso de desistência.
              </p>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              O saldo restante deve ser pago em até 24 horas após a notificação de chegada do produto 
              ao Brasil. O não pagamento no prazo pode resultar em custos adicionais de armazenagem 
              ou cancelamento do pedido com perda do sinal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Política de Trocas e Devoluções</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Para pedidos da modalidade VAULT (importação sob encomenda):
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Trocas ou reembolsos são permitidos <strong className="text-foreground">apenas em caso de defeito de fabricação</strong></li>
              <li>O tamanho escolhido pelo cliente <strong className="text-foreground">não é passível de troca ou reembolso</strong></li>
              <li>O prazo para reportar problemas é de até <strong className="text-foreground">7 dias após o recebimento</strong></li>
              <li>Defeitos devem ser documentados com fotos detalhadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Prazos de Entrega</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os prazos informados são estimativas baseadas em condições normais de operação. 
              Fatores externos como atrasos alfandegários, greves, pandemias ou outros eventos 
              de força maior podem impactar o prazo final. A BRAVENZA se compromete a manter o 
              cliente informado sobre qualquer alteração significativa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Autenticidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todos os produtos comercializados pela BRAVENZA passam por rigorosa inspeção de 
              autenticidade antes do envio. Trabalhamos exclusivamente com fornecedores verificados 
              e confiáveis. Caso seja identificada qualquer irregularidade, o cliente será reembolsado 
              integralmente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Responsabilidades do Cliente</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Fornecer informações corretas e completas no cadastro e pedido</li>
              <li>Informar o tamanho correto do calçado desejado</li>
              <li>Manter dados de contato atualizados</li>
              <li>Realizar os pagamentos nos prazos estabelecidos</li>
              <li>Estar disponível para receber a encomenda no endereço informado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              A BRAVENZA não se responsabiliza por danos indiretos, lucros cessantes ou perdas 
              decorrentes de atrasos, erros em informações fornecidas pelo cliente, ou eventos 
              de força maior. Nossa responsabilidade está limitada ao valor efetivamente pago 
              pelo cliente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Foro e Legislação</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca 
              de São Paulo/SP para dirimir quaisquer controvérsias decorrentes deste instrumento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas sobre estes Termos de Uso, entre em contato através do nosso Instagram{" "}
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
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground mt-4">
            © 2022-{new Date().getFullYear()} BRAVENZA. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
