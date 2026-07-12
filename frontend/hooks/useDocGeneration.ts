"use client";

import { useCallback, useRef, useState } from "react";
import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import type {
  ArquivoSelecionado,
  ConfiguracaoDocumento,
  RespostaStatusJob,
  StatusGeracao,
} from "@/lib/types";

const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ?? "/api/mock/gerar-documentacao";
const STATUS_URL =
  process.env.NEXT_PUBLIC_N8N_STATUS_URL ?? "/api/mock/status-documentacao";

const INTERVALO_POLLING_MS = 5000; // Consulta o status a cada 5 segundos, conforme solicitado.

/**
 * Hook responsável por todo o fluxo assíncrono de geração de documentação:
 * 1. Envia os arquivos + configuração via POST para o webhook do n8n.
 * 2. Recebe um jobId de volta.
 * 3. Faz polling (a cada 5s) em um endpoint de status até receber "concluido" ou "erro".
 *
 * OBS: Como o backend real (n8n) ainda não está integrado neste momento,
 * este hook simula o comportamento completo (envio + processamento + conclusão)
 * quando as variáveis de ambiente NEXT_PUBLIC_N8N_WEBHOOK_URL / STATUS_URL não
 * estão configuradas. Basta configurá-las no .env.local para apontar para o n8n real
 * que a simulação é automaticamente substituída pelas chamadas HTTP reais.
 */
export function useDocGeneration() {
  const { toast } = useToast();
  const [status, setStatus] = useState<StatusGeracao>("idle");
  const [progresso, setProgresso] = useState(0);
  const [mensagem, setMensagem] = useState<string | undefined>(undefined);
  const [urlArquivoFinal, setUrlArquivoFinal] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // Guarda se estamos em modo simulado (sem backend real configurado).
  const modoSimulado = useRef(
    !process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || !process.env.NEXT_PUBLIC_N8N_STATUS_URL
  );

  /** Reseta todo o estado do fluxo, usado ao clicar em "Gerar outro documento". */
  const reiniciar = useCallback(() => {
    setStatus("idle");
    setProgresso(0);
    setMensagem(undefined);
    setUrlArquivoFinal(null);
    setJobId(null);
  }, []);

  // ------------------------------------------------------------------
  // 1. MUTATION: envio inicial dos arquivos + configuração (POST)
  // ------------------------------------------------------------------
  const mutationEnvio = useMutation({
    mutationFn: async ({
      arquivos,
      configuracao,
    }: {
      arquivos: ArquivoSelecionado[];
      configuracao: ConfiguracaoDocumento;
    }) => {
      if (modoSimulado.current) {
        // --- SIMULAÇÃO: gera um jobId falso localmente, sem chamar rede real ---
        await new Promise((resolve) => setTimeout(resolve, 800));
        return { jobId: `job_${Date.now()}` };
      }

      // --- INTEGRAÇÃO REAL: monta um FormData com os arquivos + metadados ---
      const formData = new FormData();
      arquivos.forEach((arquivoSelecionado) => {
        formData.append("arquivos", arquivoSelecionado.file);
      });
      formData.append("tipoDocumentacao", configuracao.tipoDocumentacao);
      formData.append("formatoSaida", configuracao.formatoSaida);

      const { data } = await axios.post<{ jobId: string }>(WEBHOOK_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return data;
    },
    onMutate: () => {
      setStatus("enviando");
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      setStatus("processando");
    },
    onError: (erro) => {
      setStatus("erro");
      toast({
        variant: "destructive",
        title: "Falha ao enviar arquivos",
        description:
          erro instanceof Error ? erro.message : "Não foi possível iniciar o processamento.",
      });
    },
  });

  // ------------------------------------------------------------------
  // 2. QUERY com polling: consulta o status do job a cada 5 segundos
  // ------------------------------------------------------------------
  useQuery({
    queryKey: ["status-documentacao", jobId],
    queryFn: async (): Promise<RespostaStatusJob> => {
      if (modoSimulado.current) {
        return simularEtapaDeProcessamento(jobId!, progresso);
      }

      const { data } = await axios.get<RespostaStatusJob>(STATUS_URL, {
        params: { jobId },
      });
      return data;
    },
    enabled: status === "processando" && !!jobId,
    refetchInterval: (query) => {
      // Interrompe o polling assim que o job for concluído ou falhar.
      const dados = query.state.data;
      if (dados?.status === "concluido" || dados?.status === "erro") return false;
      return INTERVALO_POLLING_MS;
    },
    // A cada resposta do polling, atualizamos o estado visual da tela de processamento.
    // (usamos um efeito derivado abaixo através do "select" + callback onSuccess não existe
    // no v5 do react-query para useQuery, então tratamos a atualização diretamente aqui)
    select: (data) => {
      atualizarComRespostaDoJob(data);
      return data;
    },
  });

  /** Aplica a resposta do polling ao estado local (progresso, mensagem, conclusão ou erro). */
  function atualizarComRespostaDoJob(resposta: RespostaStatusJob) {
    if (resposta.progresso !== undefined) setProgresso(resposta.progresso);
    if (resposta.mensagem) setMensagem(resposta.mensagem);

    if (resposta.status === "concluido" && resposta.urlArquivo) {
      setProgresso(100);
      setUrlArquivoFinal(resposta.urlArquivo);
      setStatus("concluido");
      toast({
        title: "Documentação gerada com sucesso",
        description: "Seu arquivo está pronto para download.",
      });
    }

    if (resposta.status === "erro") {
      setStatus("erro");
      toast({
        variant: "destructive",
        title: "Erro ao processar documentação",
        description: resposta.erro ?? "Ocorreu um erro inesperado durante o processamento.",
      });
    }
  }

  /** Função pública chamada pela página principal para iniciar todo o fluxo. */
  const gerarDocumentacao = useCallback(
    (arquivos: ArquivoSelecionado[], configuracao: ConfiguracaoDocumento) => {
      setProgresso(0);
      mutationEnvio.mutate({ arquivos, configuracao });
    },
    [mutationEnvio]
  );

  return {
    status,
    progresso,
    mensagem,
    urlArquivoFinal,
    gerarDocumentacao,
    reiniciar,
  };
}

// ----------------------------------------------------------------------
// Simulação local do backend (n8n + IA), usada apenas quando as variáveis
// de ambiente do webhook não estão configuradas. Facilita o desenvolvimento
// e a demonstração do fluxo completo de UI sem depender do backend real.
// ----------------------------------------------------------------------
const ETAPAS_SIMULADAS = [
  { progresso: 20, mensagem: "Lendo a estrutura dos arquivos enviados..." },
  { progresso: 45, mensagem: "Identificando padrões de arquitetura..." },
  { progresso: 65, mensagem: "Mapeando componentes e dependências..." },
  { progresso: 85, mensagem: "Redigindo as seções da documentação..." },
  { progresso: 100, mensagem: "Documento finalizado." },
];

async function simularEtapaDeProcessamento(
  jobId: string,
  progressoAtual: number
): Promise<RespostaStatusJob> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const proximaEtapa =
    ETAPAS_SIMULADAS.find((etapa) => etapa.progresso > progressoAtual) ??
    ETAPAS_SIMULADAS[ETAPAS_SIMULADAS.length - 1];

  if (proximaEtapa.progresso >= 100) {
    return {
      jobId,
      status: "concluido",
      progresso: 100,
      mensagem: proximaEtapa.mensagem,
      // Em produção esta URL viria do n8n (ex: link de um bucket S3/Drive).
      urlArquivo: "data:text/plain;charset=utf-8," + encodeURIComponent(
        "# Documentação gerada automaticamente\n\nEste é um arquivo de exemplo simulado localmente."
      ),
    };
  }

  return {
    jobId,
    status: "processando",
    progresso: proximaEtapa.progresso,
    mensagem: proximaEtapa.mensagem,
  };
}
