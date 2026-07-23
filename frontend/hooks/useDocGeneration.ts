"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { salvarItemHistorico } from "@/lib/historico";
import type { ArquivoSelecionado, ConfiguracaoDocumento, StatusGeracao } from "@/lib/types";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || null;
const supabase = createClient();
const INTERVALO_CONSULTA_MS = 3000;

const STORAGE_KEY_STATUS = "docforge_status";
const STORAGE_KEY_PROGRESSO = "docforge_progresso";
const STORAGE_KEY_MENSAGEM = "docforge_mensagem";
const STORAGE_KEY_URL = "docforge_url";
const STORAGE_KEY_JOBID = "docforge_jobid";

export function useDocGeneration() {
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Recupera do sessionStorage incluindo "concluido" para manter a tela de download ativa ao trocar de aba
  const [status, setStatus] = useState<StatusGeracao>(() => {
    if (typeof window !== "undefined") {
      const salvo = sessionStorage.getItem(STORAGE_KEY_STATUS) as StatusGeracao;
      if (salvo === "enviando" || salvo === "processando" || salvo === "concluido") {
        return salvo;
      }
    }
    return "idle";
  });

  const [progresso, setProgresso] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const salvoStatus = sessionStorage.getItem(STORAGE_KEY_STATUS);
      if (salvoStatus === "enviando" || salvoStatus === "processando" || salvoStatus === "concluido") {
        const val = sessionStorage.getItem(STORAGE_KEY_PROGRESSO);
        return val ? parseInt(val, 10) : 0;
      }
    }
    return 0;
  });

  const [mensagem, setMensagem] = useState<string | undefined>(() => {
    if (typeof window !== "undefined") {
      const salvoStatus = sessionStorage.getItem(STORAGE_KEY_STATUS);
      if (salvoStatus === "enviando" || salvoStatus === "processando" || salvoStatus === "concluido") {
        return sessionStorage.getItem(STORAGE_KEY_MENSAGEM) || undefined;
      }
    }
    return undefined;
  });

  const [urlArquivoFinal, setUrlArquivoFinal] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const salvoStatus = sessionStorage.getItem(STORAGE_KEY_STATUS);
      if (salvoStatus === "enviando" || salvoStatus === "processando" || salvoStatus === "concluido") {
        return sessionStorage.getItem(STORAGE_KEY_URL) || null;
      }
    }
    return null;
  });

  const [jobId, setJobId] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const salvoStatus = sessionStorage.getItem(STORAGE_KEY_STATUS);
      if (salvoStatus === "enviando" || salvoStatus === "processando" || salvoStatus === "concluido") {
        const val = sessionStorage.getItem(STORAGE_KEY_JOBID);
        return val ? parseInt(val, 10) : null;
      }
    }
    return null;
  });

  const modoSimulado = useRef(!WEBHOOK_URL || !supabase);

  const persistirEstado = (
    novoStatus: StatusGeracao,
    novoProgresso: number,
    novaMensagem: string | undefined,
    novaUrl: string | null,
    novoJobId: number | null
  ) => {
    setStatus(novoStatus);
    setProgresso(novoProgresso);
    setMensagem(novaMensagem);
    setUrlArquivoFinal(novaUrl);
    setJobId(novoJobId);

    if (typeof window !== "undefined") {
      // Removido o "concluido" daqui para que ele seja salvo no sessionStorage e não limpo ao trocar de aba
      if (novoStatus === "idle" || novoStatus === "erro") {
        sessionStorage.clear();
      } else {
        sessionStorage.setItem(STORAGE_KEY_STATUS, novoStatus);
        sessionStorage.setItem(STORAGE_KEY_PROGRESSO, novoProgresso.toString());
        if (novaMensagem) sessionStorage.setItem(STORAGE_KEY_MENSAGEM, novaMensagem);
        else sessionStorage.removeItem(STORAGE_KEY_MENSAGEM);
        if (novaUrl) sessionStorage.setItem(STORAGE_KEY_URL, novaUrl);
        else sessionStorage.removeItem(STORAGE_KEY_URL);
        if (novoJobId) sessionStorage.setItem(STORAGE_KEY_JOBID, novoJobId.toString());
        else sessionStorage.removeItem(STORAGE_KEY_JOBID);
      }
    }
  };

  const reiniciar = useCallback(async () => {
    if (jobId && !modoSimulado.current) {
      try {
        await supabase!
          .from("documents")
          .update({ 
            status: "cancelled", 
            message: "Processo cancelado pelo usuário." 
          })
          .eq("id", jobId);
      } catch (err) {
        console.error("Erro ao notificar cancelamento ao Supabase:", err);
      }
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    persistirEstado("idle", 0, undefined, null, null);
    if (typeof window !== "undefined") {
      sessionStorage.clear();
    }
  }, [jobId]);

  const mutationEnvio = useMutation({
    mutationFn: async ({ arquivos, configuracao }: { arquivos: ArquivoSelecionado[], configuracao: ConfiguracaoDocumento }) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (modoSimulado.current) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return { jobId: Date.now() };
      }

      const formData = new FormData();
      arquivos.forEach((a) => formData.append("arquivos", a.file));
      formData.append(
        "config",
        JSON.stringify({
          tipoDocumentacao: configuracao.tipoDocumentacao,
          formatoSaida: configuracao.formatoSaida,
        })
      );

      const { data } = await axios.post<{ jobId: number }>(WEBHOOK_URL as string, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        signal: controller.signal,
      });
      return data;
    },
    onMutate: () => {
      persistirEstado("enviando", 0, undefined, null, null);
    },
    onSuccess: (data) => {
      persistirEstado("processando", 1, undefined, null, data.jobId);
    },
    onError: (erro) => {
      if (axios.isCancel(erro) || (erro as any)?.name === "CanceledError") {
        return;
      }

      persistirEstado("erro", progresso, mensagem, null, jobId);
      toast({
        variant: "destructive",
        title: "Falha ao enviar arquivos",
        description: erro instanceof Error ? erro.message : "Não foi possível iniciar o processamento.",
      });
    },
  });

  useEffect(() => {
    if (status !== "processando") return;

    const intervaloProgresso = setInterval(() => {
      setProgresso((prev) => {
        if (prev >= 95) return 95;
        if (prev >= 90) return prev + 1;
        const proximo = prev + 2;
        if (typeof window !== "undefined") {
          sessionStorage.setItem(STORAGE_KEY_PROGRESSO, proximo.toString());
        }
        return proximo;
      });
    }, 2000);

    return () => clearInterval(intervaloProgresso);
  }, [status]);

  const queryResult = useQuery({
    queryKey: ["status-job", jobId],
    queryFn: async () => {
      if (modoSimulado.current) {
        return simularProximaEtapa(jobId as number, progresso);
      }

      const { data, error } = await supabase!
        .from("documents")
        .select("*")
        .eq("id", jobId as number)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: status === "processando" && !!jobId,
    refetchInterval: (query) => {
      const dados = query.state.data;
      if (
        dados?.status === "completed" || 
        dados?.status === "error" || 
        dados?.status === "erro" || 
        dados?.status === "cancelled"
      ) {
        return false;
      }
      return INTERVALO_CONSULTA_MS;
    },
  });

  useEffect(() => {
    if (queryResult.data) {
      atualizarComLinhaDoSupabase(queryResult.data);
    }
  }, [queryResult.data]);

  function atualizarComLinhaDoSupabase(jobData: any) {
    if (jobData) {
      const msgAtual = jobData.message || mensagem;
      if (jobData.message) {
        setMensagem(jobData.message);
        if (typeof window !== "undefined") sessionStorage.setItem(STORAGE_KEY_MENSAGEM, jobData.message);
      }
      
      if (jobData.status === "cancelled") {
        persistirEstado("idle", 0, "Processo cancelado.", null, null);
        if (typeof window !== "undefined") {
          sessionStorage.clear();
        }
        return;
      }

      if (jobData.status === "completed") {
        if (jobData.file_url) {
          persistirEstado("concluido", 100, msgAtual, jobData.file_url, jobId);
          toast({
            title: "Documentação gerada com sucesso",
            description: "Seu arquivo está pronto para download.",
          });
        } else {
          persistirEstado("erro", progresso, msgAtual, null, jobId);
          toast({
            variant: "destructive",
            title: "Documento gerado, mas sem link de download",
            description: "O processamento terminou, porém o arquivo final não foi encontrado.",
          });
        }
      } 
      else if (jobData.status === "erro" || jobData.status === "error") {
        persistirEstado("erro", progresso, msgAtual, null, jobId);
        toast({
          variant: "destructive",
          title: "Erro na geração",
          description: jobData.message || "Ocorreu um erro ao processar seu projeto.",
        });
      }
    }
  }

  const gerarDocumentacao = useCallback((arquivos: ArquivoSelecionado[], configuracao: ConfiguracaoDocumento) => {
    mutationEnvio.mutate({ arquivos, configuracao });
  }, [mutationEnvio]);

  return { status, progresso, mensagem, urlArquivoFinal, gerarDocumentacao, reiniciar };
}

const ETAPAS_SIMULADAS = [
  { progresso: 20, mensagem: "Arquivos filtrados, iniciando análise..." },
  { progresso: 60, mensagem: "Fatos extraídos, redigindo documentação..." },
  { progresso: 85, mensagem: "Documento redigido, convertendo formato..." },
  { progresso: 100, mensagem: "Documento finalizado." },
];

async function simularProximaEtapa(jobId: number, progressoAtual: number): Promise<any> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const proxima =
    ETAPAS_SIMULADAS.find((etapa) => etapa.progresso > progressoAtual) ??
    ETAPAS_SIMULADAS[ETAPAS_SIMULADAS.length - 1];

  const concluido = proxima.progresso >= 100;

  return {
    id: jobId,
    execution_id: jobId,
    status: concluido ? "completed" : "processing",
    progress: proxima.progresso,
    message: proxima.mensagem,
    content: null,
    format: "md",
    file_url: concluido
      ? "data:text/plain;charset=utf-8," +
        encodeURIComponent("# Documentação gerada automaticamente\n\nArquivo de exemplo simulado localmente.")
      : null,
    created_at: new Date().toISOString(),
  };
}