"use client";

import { useEffect, useRef, useState } from "react";
import { Wand2 } from "lucide-react";
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
import type { ArquivoSelecionado, ConfiguracaoDocumento } from "@/lib/types";

export default function PaginaGerar() {
  const { toast } = useToast();

  const [arquivos, setArquivos] = useState<ArquivoSelecionado[]>([]);
  
  // Inicializa o estado buscando do sessionStorage se disponível (evita reset ao navegar)
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

  // Salva no sessionStorage sempre que a configuração mudar (Persistência em tempo real)
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

  // Salva histórico quando concluído com sucesso (com trava de unicidade por sessão)
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
  
  // Salva histórico quando ocorre erro genérico (ex: falha de rede/API)
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
    }
    reiniciar();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8 sm:px-6 md:py-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Gerar Documentação
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Envie o código do seu projeto e receba documentação técnica completa em minutos.
        </p>
      </header>

      <Card className="overflow-hidden">
        {status === "idle" || status === "erro" ? (
          <>
            <CardHeader>
              <CardTitle>1. Envie os arquivos</CardTitle>
              <CardDescription>
                Arraste os arquivos do seu projeto ou selecione-os manualmente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Dropzone 
                arquivos={arquivos} 
                onArquivosChange={setArquivos} 
                tipoDocumentacao={configuracao.tipoDocumentacao} 
              />

              <div className="h-px w-full bg-border" />

              <div>
                <h2 className="font-display text-base font-semibold text-foreground">
                  2. Configure a documentação
                </h2>
                <p className="mb-3 mt-1 text-sm text-muted-foreground">
                  Escolha o tipo de conteúdo e o formato do arquivo final.
                </p>
                <ConfigForm
                  configuracao={configuracao}
                  onConfiguracaoChange={setConfiguracao}
                />
              </div>

              <Button size="lg" className="w-full" onClick={handleGerarDocumentacao}>
                <Wand2 className="h-4 w-4" />
                Gerar Documentação
              </Button>
            </CardContent>
          </>
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