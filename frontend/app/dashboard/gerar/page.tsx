"use client";

import { useEffect, useRef, useState } from "react";
import { Wand2, FileArchive, FileCode2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dropzone } from "@/components/features/Dropzone";
import { ConfigForm } from "@/components/features/ConfigForm";
import { ProcessingScreen } from "@/components/features/ProcessingScreen";
import { SuccessCard } from "@/components/features/SuccessCard";
import { useDocGeneration } from "@/hooks/useDocGeneration";
import { useToast } from "@/components/ui/use-toast";
import { salvarItemHistorico } from "@/lib/historico";
import { filtrarArquivosPorEscopo } from "@/lib/validacaoArquivos";
import { formatFileSize } from "@/lib/utils";
import type { ArquivoSelecionado, ConfiguracaoDocumento } from "@/lib/types";

export default function PaginaGerar() {
  const { toast } = useToast();

  const [arquivos, setArquivos] = useState<ArquivoSelecionado[]>([]);

  // Sincroniza o sessionStorage garantindo que se remover, o cache apaga
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (arquivos.length === 0) {
      sessionStorage.removeItem("arquivos_cache");
    } else {
      Promise.all(
        arquivos.map(async (item) => {
          let conteudoTexto = "";
          try {
            conteudoTexto = await item.file.text();
          } catch (err) {
            conteudoTexto = "";
          }
          return {
            id: item.id,
            nome: item.nome,
            tamanho: item.tamanho,
            extensao: item.extensao,
            tipo: item.file.type,
            conteudoTexto,
          };
        })
      ).then((serializados) => {
        sessionStorage.setItem("arquivos_cache", JSON.stringify(serializados));
      });
    }
  }, [arquivos]);

  const [configuracao, setConfiguracao] = useState<ConfiguracaoDocumento>(() => {
    if (typeof window !== "undefined") {
      const formatoSalvo = sessionStorage.getItem("formato_saida");
      const tipoSalvo = sessionStorage.getItem("tipo_documentacao");
      if (formatoSalvo || tipoSalvo) {
        return {
          tipoDocumentacao: (tipoSalvo as any) || "arquitetura-backend",
          formatoSaida: (formatoSalvo as any) || "docx",
        };
      }
    }
    return {
      tipoDocumentacao: "arquitetura-backend",
      formatoSaida: "docx",
    };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("formato_saida", configuracao.formatoSaida);
      sessionStorage.setItem("tipo_documentacao", configuracao.tipoDocumentacao);
    }
  }, [configuracao]);

  const { status, progresso, mensagem, urlArquivoFinal, gerarDocumentacao, reiniciar } =
    useDocGeneration();

  const emProcessamento = status === "enviando" || status === "processando";
  const concluido = status === "concluido" && urlArquivoFinal;

  const ultimaUrlSalva = useRef<string | null>(null);

  useEffect(() => {
    if (status === "concluido" && urlArquivoFinal) {
      const chaveHistoricoSalvo = `historico_salvo_${urlArquivoFinal}`;
      const jaSalvo = sessionStorage.getItem(chaveHistoricoSalvo);

      if (!jaSalvo && ultimaUrlSalva.current !== urlArquivoFinal) {
        salvarItemHistorico({
          nomeArquivo: `documentacao_${configuracao.tipoDocumentacao}.${configuracao.formatoSaida}`,
          tipoDocumentacao: configuracao.tipoDocumentacao,
          formatoSaida: configuracao.formatoSaida,
          status: "concluido",
          urlArquivo: urlArquivoFinal,
        });

        sessionStorage.setItem(chaveHistoricoSalvo, "true");
        ultimaUrlSalva.current = urlArquivoFinal;
      }
    }
  }, [status, urlArquivoFinal, configuracao.formatoSaida, configuracao.tipoDocumentacao]);

  const ultimoErroSalvo = useRef(false);
  
  useEffect(() => {
    if (status === "erro" && !ultimoErroSalvo.current) {
      salvarItemHistorico({
        nomeArquivo: `documentacao_${configuracao.tipoDocumentacao}.${configuracao.formatoSaida}`,
        tipoDocumentacao: configuracao.tipoDocumentacao,
        formatoSaida: configuracao.formatoSaida,
        status: "erro",
      });
      ultimoErroSalvo.current = true;
    }
    if (status !== "erro") ultimoErroSalvo.current = false;
  }, [status, configuracao.formatoSaida, configuracao.tipoDocumentacao]);

  const handleGerarDocumentacao = () => {
    if (arquivos.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum arquivo selecionado",
        description: "Envie ao menos um arquivo de código para gerar a documentação.",
      });
      return;
    }

    const { arquivosValidos, arquivosFiltrados } = filtrarArquivosPorEscopo(arquivos, configuracao.tipoDocumentacao);
    
    if (arquivosFiltrados.length > 0) {
      toast({
        variant: "destructive",
        title: "Arquivos incompatíveis removidos",
        description: `O(s) arquivo(s) [${arquivosFiltrados.join(", ")}] foram ignorados por não pertencerem ao escopo selecionado.`,
      });
      setArquivos(arquivosValidos);
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem("formato_saida", configuracao.formatoSaida);
      sessionStorage.setItem("tipo_documentacao", configuracao.tipoDocumentacao);
    }

    ultimaUrlSalva.current = null;
    gerarDocumentacao(arquivosValidos, configuracao);
  };

  const handleGerarNovamente = () => {
    setArquivos([]);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("formato_saida");
      sessionStorage.removeItem("tipo_documentacao");
      sessionStorage.removeItem("arquivos_cache");
    }
    reiniciar();
  };

  return (
    <main className="flex min-h-screen w-full flex-col px-4 py-8 sm:px-6 md:px-8 md:py-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Gerar Documentação
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Envie o código do seu projeto e receba documentação técnica completa em minutos.
        </p>
      </header>

      <Card className="overflow-hidden w-full">
        {status === "idle" || status === "erro" ? (
          <CardContent className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
              
              {/* COLUNA DA ESQUERDA: Arquivos */}
              <div className="flex flex-col space-y-4">
                <div>
                  <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">
                    1. Envie os arquivos
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Arraste os arquivos do seu projeto ou selecione-os manualmente.
                  </p>
                </div>
                
                {/* Componente Dropzone */}
                <div>
                  <Dropzone 
                    arquivos={arquivos} 
                    onArquivosChange={setArquivos} 
                    tipoDocumentacao={configuracao.tipoDocumentacao} 
                  />
                </div>

                {/* Bloco Isolado e Estilizado para os Arquivos Anexados */}
                {arquivos.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card/40 p-4 space-y-3 backdrop-blur-sm">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Arquivos Anexados ({arquivos.length})
                      </span>
                      <button
                        onClick={() => setArquivos([])}
                        className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remover todos
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {arquivos.map((arquivo, index) => (
                        <div 
                          key={arquivo.id || index}
                          className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface-input/60 px-3.5 py-2.5 transition-all hover:border-border-hover hover:bg-surface-input"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated border border-border/40">
                              {arquivo.extensao === "zip" ? (
                                <FileArchive className="h-4 w-4 text-accent" />
                              ) : (
                                <FileCode2 className="h-4 w-4 text-accent" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-foreground max-w-[200px] sm:max-w-[240px]" title={arquivo.nome}>
                                {arquivo.nome}
                              </p>
                              <p className="font-mono text-[11px] text-muted-foreground/80">
                                {formatFileSize(arquivo.tamanho)}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const novosArquivos = arquivos.filter((_, i) => i !== index);
                              setArquivos(novosArquivos);
                            }}
                            className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-70 transition-all hover:bg-surface-hover hover:text-red-400 hover:opacity-100"
                            title="Remover arquivo"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="h-px w-full bg-border md:hidden" />

              {/* COLUNA DA DIREITA: Configuração e Botão */}
              <div className="flex flex-col space-y-4">
                <div>
                  <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">
                    2. Configure a documentação
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Escolha o tipo de conteúdo e o formato do arquivo final.
                  </p>
                </div>
                
                <div>
                  <ConfigForm
                    configuracao={configuracao}
                    onConfiguracaoChange={setConfiguracao}
                  />
                </div>

                <div className="pt-2">
                  <Button size="lg" className="w-full" onClick={handleGerarDocumentacao}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Gerar Documentação
                  </Button>
                </div>
              </div>
              
            </div>
          </CardContent>
        ) : emProcessamento ? (
          <ProcessingScreen 
            progresso={progresso} 
            mensagem={mensagem} 
            onCancel={() => {
              salvarItemHistorico({
                nomeArquivo: `documentacao_${configuracao.tipoDocumentacao}.${configuracao.formatoSaida}`,
                tipoDocumentacao: configuracao.tipoDocumentacao,
                formatoSaida: configuracao.formatoSaida,
                status: "cancelado",
              });
              reiniciar();
            }} 
          />
        ) : concluido ? (
          <SuccessCard
            urlArquivo={urlArquivoFinal!}
            formatoSaida={configuracao.formatoSaida}
            onGerarNovamente={handleGerarNovamente}
          />
        ) : null}
      </Card>
    </main>
  );
}