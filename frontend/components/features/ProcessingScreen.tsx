"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, FileSearch, Sparkles, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProcessingScreenProps {
  progresso: number; 
  mensagem?: string;
  onCancel: () => void; 
}

const MENSAGENS_ROTATIVAS = [
  "Lendo a estrutura dos arquivos enviados...",
  "Identificando padrões de arquitetura...",
  "Mapeando componentes e dependências...",
  "Redigindo as seções da documentação...",
  "Formatando o documento final...",
];

export function ProcessingScreen({ progresso, mensagem, onCancel }: ProcessingScreenProps) {
  const [indiceMensagem, setIndiceMensagem] = useState(0);

  useEffect(() => {
    if (mensagem) return; 
    const intervalo = setInterval(() => {
      setIndiceMensagem((atual) => (atual + 1) % MENSAGENS_ROTATIVAS.length);
    }, 3000);
    return () => clearInterval(intervalo);
  }, [mensagem]);

  const mensagemExibida = mensagem ?? MENSAGENS_ROTATIVAS[indiceMensagem];

  return (
    <div className="animate-fade-up flex flex-col items-center px-6 py-16 text-center">
      <div className="relative mb-8 flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-accent/10 animate-pulse-soft" />
        <div className="absolute inset-2 rounded-full border border-accent/20" />
        <BrainCircuit className="h-8 w-8 text-accent" />
      </div>

      <h2 className="font-display text-2xl text-foreground">Gerando sua documentação</h2>
      <p className="mt-2 min-h-[1.5rem] font-mono text-sm text-muted-foreground transition-opacity duration-300">
        {mensagemExibida}
      </p>

      <div className="mt-8 w-full max-w-sm space-y-2">
        <Progress value={progresso} />
        <div className="flex justify-between font-mono text-xs text-muted-foreground">
          <span>Processando...</span>
          <span>{Math.round(progresso)}%</span>
        </div>
      </div>

      <div className="mt-10 flex h-16 w-full max-w-sm items-center justify-center relative overflow-hidden">
        <div className="absolute w-32 h-32 rounded-full border border-accent/20 animate-ping opacity-30" style={{ animationDuration: '3s' }} />
        <div className="absolute w-20 h-20 rounded-full border border-accent/30 animate-pulse" />
        <div className="flex items-center gap-1.5 z-10">
          <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0s' }} />
          <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.2s' }} />
          <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-full border border-border bg-surface-input px-4 py-2">
        <FileSearch className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-xs text-muted-foreground">
          Estamos analisando seus arquivos, isso pode levar alguns minutos...
        </span>
        <Sparkles className="h-3.5 w-3.5 text-accent" />
      </div>

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