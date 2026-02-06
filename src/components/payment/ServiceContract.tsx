import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/constants";

interface ServiceContractProps {
  clientName: string;
  clientCpf: string;
  clientAddress: string | null;
  serviceValue: number | null;
  estimatedDays?: string;
  onAccept: () => Promise<void>;
  isSubmitting?: boolean;
}

function formatCPFDisplay(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function ServiceContract({
  clientName,
  clientCpf,
  clientAddress,
  serviceValue,
  estimatedDays = "20 a 40 dias úteis",
  onAccept,
  isSubmitting = false,
}: ServiceContractProps) {
  const [hasReadContract, setHasReadContract] = useState(false);
  const [acceptedContract, setAcceptedContract] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);

  const handleScrollToBottom = () => {
    if (contractRef.current) {
      const el = contractRef.current;
      el.scrollTop = el.scrollHeight;
    }
  };

  const handleContractScroll = () => {
    if (contractRef.current) {
      const el = contractRef.current;
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      if (isAtBottom) {
        setHasReadContract(true);
      }
    }
  };

  const handleAccept = async () => {
    if (!acceptedContract || !hasReadContract) return;
    await onAccept();
  };

  const displayAddress = clientAddress || "Endereço não informado";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="card-premium mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Contrato de Prestação de Serviços
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Leia o contrato abaixo e role até o final para poder aceitar os termos.
          </p>
        </CardHeader>
        <CardContent>
          {/* Contract body */}
          <div
            ref={contractRef}
            onScroll={handleContractScroll}
            className={`border border-border rounded-lg p-4 sm:p-6 overflow-y-auto bg-card/50 text-sm leading-relaxed transition-all ${
              isExpanded ? "max-h-[70vh]" : "max-h-[400px]"
            }`}
          >
            <div className="space-y-5 text-muted-foreground">
              <div className="text-center mb-6">
                <h3 className="text-base font-bold text-foreground uppercase tracking-wide">
                  Contrato de Prestação de Serviços — BRAVENZA
                </h3>
              </div>

              <p>Pelo presente instrumento particular, de um lado:</p>

              <p>
                <strong className="text-foreground">BRAVENZA</strong>, operada por HALLOW LTDA, inscrita no CNPJ nº 52.077.512/0001-50, 
                com sede em Rua Dr. Egydio Michaelsen, 176 - Cavalhada, Porto Alegre/RS, doravante denominada CONTRATADA;
              </p>

              <p>e, de outro lado,</p>

              <p>
                <strong className="text-foreground">{clientName}</strong>, CPF nº{" "}
                <strong className="text-foreground">{formatCPFDisplay(clientCpf)}</strong>, residente em{" "}
                <strong className="text-foreground">{displayAddress}</strong>, doravante denominado CONTRATANTE;
              </p>

              <p>têm entre si justo e contratado o seguinte:</p>

              {/* Clause 1 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 1 — OBJETO</h4>
                <p className="mb-2">Prestação de serviços especializados de:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Curadoria de produto</li>
                  <li>Intermediação entre vendedor e comprador</li>
                  <li>Verificação técnica de autenticidade</li>
                  <li>Emissão de parecer opinativo</li>
                  <li>Serviços logísticos técnicos e conferência, quando aplicável</li>
                  <li>Atendimento consultivo personalizado</li>
                </ul>
                <p className="mt-2 italic text-xs">
                  Parágrafo único. A CONTRATADA não comercializa diretamente o produto, não sendo lojista, 
                  fabricante, importadora oficial ou representante de marcas.
                </p>
              </div>

              {/* Clause 2 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 2 — NATUREZA DO SERVIÇO</h4>
                <p>
                  O CONTRATANTE declara ciência de que o serviço possui caráter consultivo, técnico e opinativo, 
                  não constituindo garantia absoluta de autenticidade, laudo pericial judicial ou certificação 
                  oficial de fabricante.
                </p>
              </div>

              {/* Clause 3 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 3 — RESPONSABILIDADE PELO PRODUTO</h4>
                <p>
                  Origem, legalidade de posse, garantia, vícios e assistência técnica são de responsabilidade 
                  exclusiva do vendedor ou fabricante, inexistindo solidariedade ou corresponsabilidade da CONTRATADA.
                </p>
              </div>

              {/* Clause 4 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 4 — POSSE TEMPORÁRIA E DEPÓSITO TÉCNICO</h4>
                <p>
                  Quando aplicável, o produto poderá ser enviado à sede da CONTRATADA exclusivamente para fins 
                  técnicos, não caracterizando aquisição, revenda, estoque ou transferência de titularidade.
                </p>
              </div>

              {/* Clause 5 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 5 — VALORES E PAGAMENTO</h4>
                <p>
                  Valor do serviço:{" "}
                  <strong className="text-foreground">
                    {serviceValue ? formatCurrency(serviceValue) : "A definir"}
                  </strong>.
                </p>
                <p className="mt-1">
                  Valores relativos ao produto não integram a remuneração da CONTRATADA.
                </p>
                <p className="mt-1">
                  A inadimplência superior a 5 dias autoriza suspensão automática do serviço.
                </p>
              </div>

              {/* Clause 6 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 6 — PRAZO</h4>
                <p>
                  O prazo estimado é de <strong className="text-foreground">{estimatedDays}</strong>, podendo 
                  variar por fatores logísticos, regulatórios ou de terceiros.
                </p>
              </div>

              {/* Clause 7 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 7 — LIMITAÇÃO OBJETIVA DE RESPONSABILIDADE</h4>
                <p className="mb-2">
                  A responsabilidade máxima da CONTRATADA limita-se ao valor efetivamente pago pelo serviço, excluindo:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Lucros cessantes</li>
                  <li>Danos indiretos</li>
                  <li>Valorização ou desvalorização de produto</li>
                  <li>Danos morais presumidos</li>
                </ul>
              </div>

              {/* Clause 8 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 8 — OBRIGAÇÕES DO CONTRATANTE</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Fornecer informações verdadeiras</li>
                  <li>Não utilizar o serviço para fins ilícitos</li>
                  <li>Respeitar prazos e pagamentos</li>
                  <li>Não tentar fraudar sistemas ou avaliações</li>
                </ul>
              </div>

              {/* Clause 9 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 9 — INDENIZAÇÃO REVERSA</h4>
                <p className="mb-2">O CONTRATANTE indenizará a CONTRATADA por prejuízos decorrentes de:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Produto ilícito</li>
                  <li>Informações falsas</li>
                  <li>Violação de direitos de terceiros</li>
                  <li>Uso indevido da plataforma</li>
                </ul>
              </div>

              {/* Clause 10 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 10 — CANCELAMENTO</h4>
                <p>
                  Serviços iniciados poderão ter retenção proporcional ao trabalho já executado, a título de 
                  taxa técnica não reembolsável.
                </p>
              </div>

              {/* Clause 11 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 11 — CONFIDENCIALIDADE</h4>
                <p>
                  Informações comerciais, estratégicas e técnicas trocadas entre as partes são confidenciais e 
                  não poderão ser divulgadas sem autorização expressa.
                </p>
              </div>

              {/* Clause 12 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 12 — COMPLIANCE E ANTIFRAUDE</h4>
                <p>
                  A CONTRATADA poderá solicitar documentos, realizar auditorias e suspender operações diante de 
                  indícios de fraude, irregularidade fiscal ou risco reputacional.
                </p>
              </div>

              {/* Clause 13 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 13 — NÃO SOLIDARIEDADE</h4>
                <p>
                  A CONTRATADA não integra cadeia de fornecimento do produto e não responde solidária ou 
                  subsidiariamente por obrigações de vendedores ou fabricantes.
                </p>
              </div>

              {/* Clause 14 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 14 — PREVALÊNCIA CONTRATUAL</h4>
                <p>
                  Este contrato prevalece sobre comunicações informais, mensagens instantâneas, e-mails ou 
                  materiais publicitários.
                </p>
              </div>

              {/* Clause 15 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 15 — ACEITE ELETRÔNICO</h4>
                <p>
                  O aceite eletrônico possui validade jurídica plena, nos termos da legislação brasileira, 
                  equivalendo à assinatura física.
                </p>
              </div>

              {/* Clause 16 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 16 — MEDIAÇÃO PRÉVIA</h4>
                <p>
                  Eventuais conflitos deverão, preferencialmente, ser submetidos a tentativa de mediação antes 
                  de ação judicial.
                </p>
              </div>

              {/* Clause 17 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 17 — PROTEÇÃO DE MARCA E IMAGEM</h4>
                <p>
                  É vedado ao CONTRATANTE utilizar marca, logotipo ou imagem da CONTRATADA sem autorização 
                  prévia e expressa.
                </p>
              </div>

              {/* Clause 18 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 18 — PROTEÇÃO DE DADOS (LGPD)</h4>
                <p>
                  Os dados pessoais serão tratados conforme a{" "}
                  <a href="/politicas" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Política de Privacidade
                  </a>{" "}
                  da CONTRATADA, em conformidade com a Lei nº 13.709/2018.
                </p>
              </div>

              {/* Clause 19 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 19 — CASO FORTUITO E FORÇA MAIOR</h4>
                <p>
                  A CONTRATADA não responderá por falhas decorrentes de eventos fora de seu controle razoável, 
                  incluindo falhas logísticas, tecnológicas ou regulatórias.
                </p>
              </div>

              {/* Clause 20 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 20 — VIGÊNCIA</h4>
                <p>
                  O contrato entra em vigor na data de aceite e encerra-se com a conclusão do serviço contratado.
                </p>
              </div>

              {/* Clause 21 */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">CLÁUSULA 21 — FORO</h4>
                <p>
                  Fica eleito o foro da comarca de Porto Alegre/RS, com renúncia a qualquer outro.
                </p>
              </div>

              {/* End marker */}
              <div className="text-center pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">— Fim do contrato —</p>
              </div>
            </div>
          </div>

          {/* Expand/Collapse button */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (!isExpanded) {
                handleScrollToBottom();
              }
            }}
            className="w-full mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Reduzir
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Expandir contrato
              </>
            )}
          </button>

          {/* Scroll hint */}
          {!hasReadContract && (
            <p className="text-xs text-warning text-center mt-3">
              ⬇ Role até o final do contrato para poder aceitar os termos
            </p>
          )}

          {/* Acceptance checkbox */}
          <div className="mt-6 space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="accept-contract"
                checked={acceptedContract}
                onCheckedChange={(checked) => setAcceptedContract(checked === true)}
                disabled={!hasReadContract}
              />
              <label
                htmlFor="accept-contract"
                className={`text-sm leading-relaxed cursor-pointer ${
                  !hasReadContract ? "opacity-50" : ""
                }`}
              >
                Declaro que li integralmente o <strong>Contrato de Prestação de Serviços</strong> acima 
                e estou de acordo com todas as cláusulas estabelecidas.
              </label>
            </div>

            <Button
              className="w-full btn-gold"
              size="lg"
              onClick={handleAccept}
              disabled={!acceptedContract || !hasReadContract || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Assinar Contrato e Prosseguir para Pagamento
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
