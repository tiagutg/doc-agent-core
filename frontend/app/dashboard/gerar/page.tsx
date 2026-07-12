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
import type { ArquivoSelecionado, ConfiguracaoDocumento } from "@/lib/types";

export default function PaginaGerar() {
  const { toast } = useToast();

  // Estado local: arquivos selecionados e configuração escolhida pelo usuário.
  // Idêntico ao que já existia em app/page.tsx — nenhuma mudança de comportamento.
  const [arquivos, setArquivos] = useState<ArquivoSelecionado[]>([]);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoDocumento>({
    tipoDocumentacao: "arquitetura-backend",
    formatoSaida: "md",
  });

  // Hook central que controla envio + polling + conclusão.
  // API do hook consumida exatamente como antes — nenhuma alteração aqui.
  const { status, progresso, mensagem, urlArquivoFinal, gerarDocumentacao, reiniciar } =
    useDocGeneration();

  const emProcessamento = status === "enviando" || status === "processando";
  const concluido = status === "concluido" && urlArquivoFinal;

  // Evita salvar o mesmo resultado mais de uma vez no histórico
  // (ex: re-renders enquanto o status permanece "concluido").
  const ultimaUrlSalva = useRef<string | null>(null);

  useEffect(() => {
    if (status === "concluido" && urlArquivoFinal && ultimaUrlSalva.current !== urlArquivoFinal) {
      salvarItemHistorico({
        nomeArquivo: `documentacao.${configuracao.formatoSaida}`,
        tipoDocumentacao: configuracao.tipoDocumentacao,
        formatoSaida: configuracao.formatoSaida,
        status: "concluido",
        urlArquivo: urlArquivoFinal,
      });
      ultimaUrlSalva.current = urlArquivoFinal;
    }
  }, [status, urlArquivoFinal, configuracao.formatoSaida, configuracao.tipoDocumentacao]);

  // Também registra falhas no histórico, para rastreabilidade.
  const ultimoErroSalvo = useRef(false);
  useEffect(() => {
    if (status === "erro" && !ultimoErroSalvo.current) {
      salvarItemHistorico({
        nomeArquivo: `documentacao.${configuracao.formatoSaida}`,
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
    ultimaUrlSalva.current = null;
    gerarDocumentacao(arquivos, configuracao);
  };

  const handleGerarNovamente = () => {
    setArquivos([]);
    reiniciar();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10 sm:px-6 md:py-14">
      {/* Cabeçalho da página (a marca "DocForge" já vive na Sidebar) */}
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Gerar Documentação
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Envie o código do seu projeto e receba documentação técnica completa,
          gerada por IA, em minutos.
        </p>
      </header>

      {/* Card principal com o fluxo de estados — mesma lógica de sempre,
          apenas sem a textura "grain-overlay" (não combina com o visual corporativo) */}
      <Card className="overflow-hidden">
        {status === "idle" || status === "erro" ? (
          <>
            <CardHeader>
              <CardTitle>1. Envie os arquivos</CardTitle>
              <CardDescription>
                Arraste os arquivos do seu projeto ou selecione-os manualmente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <Dropzone arquivos={arquivos} onArquivosChange={setArquivos} />

              <div className="h-px w-full bg-border" />

              <div>
                <h2 className="font-display text-lg font-medium text-foreground">
                  2. Configure a documentação
                </h2>
                <p className="mb-4 mt-1 text-sm text-muted-foreground">
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
          <ProcessingScreen progresso={progresso} mensagem={mensagem} />
        ) : concluido ? (
          <SuccessCard
            urlArquivo={urlArquivoFinal!}
            formatoSaida={configuracao.formatoSaida}
            onGerarNovamente={handleGerarNovamente}
          />
        ) : null}
      </Card>

      <footer className="mt-8 text-center font-mono text-xs text-muted-foreground/60">
        Processamento via n8n + IA · Seus arquivos não são armazenados após a geração
      </footer>
    </main>
  );
}
