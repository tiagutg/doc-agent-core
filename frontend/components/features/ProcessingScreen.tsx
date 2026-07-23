"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, FileSearch, Sparkles, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProcessingScreenProps {
  progresso: number; // 0-100
  mensagem?: string;
  onCancel: () => void; // Adicionado para permitir o cancelamento
}

// Mensagens exibidas em rotação enquanto a IA analisa o código,
// dão a sensação de que o processo está avançando mesmo sem progresso exato do backend.
const MENSAGENS_ROTATIVAS = [
  "Lendo a estrutura dos arquivos enviados...",
  "Identificando padrões de arquitetura...",
  "Mapeando componentes e dependências...",
  "Redigindo as seções da documentação...",
  "Formatando o documento final...",
];

export function ProcessingScreen({ progresso, mensagem, onCancel }: ProcessingScreenProps) {
  const [indiceMensagem, setIndiceMensagem] = useState(0);

  // Alterna a mensagem de "skeleton" a cada poucos segundos quando o backend
  // não envia uma mensagem própria (mensagem é opcional na resposta do n8n).
  useEffect(() => {
    if (mensagem) return; // Se o backend já manda uma mensagem específica, não sobrescreve.
    const intervalo = setInterval(() => {
      setIndiceMensagem((atual) => (atual + 1) % MENSAGENS_ROTATIVAS.length);
    }, 3000);
    return () => clearInterval(intervalo);
  }, [mensagem]);

  const mensagemExibida = mensagem ?? MENSAGENS_ROTATIVAS[indiceMensagem];

  return (
    <div className="animate-fade-up flex flex-col items-center px-6 py-16 text-center">
      {/* Ícone central com pulso suave, indicando "IA pensando" */}
      <div className="relative mb-8 flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-accent/10 animate-pulse-soft" />
        <div className="absolute inset-2 rounded-full border border-accent/20" />
        <BrainCircuit className="h-8 w-8 text-accent" />
      </div>

      <h2 className="font-display text-2xl text-foreground">Gerando sua documentação</h2>
      <p className="mt-2 min-h-[1.5rem] font-mono text-sm text-muted-foreground transition-opacity duration-300">
        {mensagemExibida}
      </p>

      {/* Barra de progresso */}
      <div className="mt-8 w-full max-w-sm space-y-2">
        <Progress value={progresso} />
        <div className="flex justify-between font-mono text-xs text-muted-foreground">
          <span>Processando</span>
          <span>{Math.round(progresso)}%</span>
        </div>
      </div>

      {/* Skeleton loaders simulando "linhas de documento" sendo escritas */}
      <div className="mt-10 w-full max-w-sm space-y-3">
        {[100, 85, 92, 60].map((largura, indice) => (
          <div
            key={indice}
            className="h-2.5 rounded-full bg-surface-elevated"
            style={{
              width: `${largura}%`,
              animation: `pulse-soft 1.8s ease-in-out ${indice * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="mt-10 flex items-center gap-2 rounded-full border border-border bg-surface-input px-4 py-2">
        <FileSearch className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-xs text-muted-foreground">
          Estamos analisando seus arquivos, isso pode levar alguns minutos...
        </span>
        <Sparkles className="h-3.5 w-3.5 text-accent" />
      </div>

      {/* Botão de Cancelar Processo */}
      <div className="mt-8">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors cursor-pointer"
        >
          <XCircle className="h-4 w-4" />
          Cancelar Processo
        </button>
      </div>
    </div>
  );
}