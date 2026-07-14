"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client"; // Importe seu cliente Supabase
import type { ArquivoSelecionado, ConfiguracaoDocumento, RespostaStatusJob, StatusGeracao } from "@/lib/types";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!;
const supabase = createClient();

export function useDocGeneration() {
  const { toast } = useToast();
  const [status, setStatus] = useState<StatusGeracao>("idle");
  const [progresso, setProgresso] = useState(0);
  const [mensagem, setMensagem] = useState<string | undefined>(undefined);
  const [urlArquivoFinal, setUrlArquivoFinal] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // 1. Mutação de Envio (Real)
  const mutationEnvio = useMutation({
    mutationFn: async ({ arquivos, configuracao }: { arquivos: ArquivoSelecionado[], configuracao: ConfiguracaoDocumento }) => {
      const formData = new FormData();
      arquivos.forEach((a) => formData.append("data", a.file)); // 'data' como configurado no n8n
      formData.append("config", JSON.stringify(configuracao));

      const { data } = await axios.post<{ job_id: string }>(WEBHOOK_URL, formData);
      return data;
    },
    onSuccess: (data) => {
      setJobId(data.job_id); // ID retornado pelo n8n
      setStatus("processando");
    }
  });

  // 2. Query de Monitoramento (Real - Supabase)
  const { data: jobData } = useQuery({
    queryKey: ["status-job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("job_id", jobId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!jobId && status === "processando",
    refetchInterval: (query) => (query.state.data?.status === "concluido" ? false : 3000),
  });

  // 3. Atualização de estado
  useEffect(() => {
    if (jobData) {
      setProgresso(jobData.progresso);
      setMensagem(jobData.mensagem);
      if (jobData.status === "concluido") {
        setStatus("concluido");
        setUrlArquivoFinal(jobData.url_arquivo);
      }
    }
  }, [jobData]);

  const gerarDocumentacao = useCallback((arquivos: ArquivoSelecionado[], configuracao: ConfiguracaoDocumento) => {
    mutationEnvio.mutate({ arquivos, configuracao });
  }, [mutationEnvio]);

  return { status, progresso, mensagem, urlArquivoFinal, gerarDocumentacao, reiniciar: () => setStatus("idle") };
}