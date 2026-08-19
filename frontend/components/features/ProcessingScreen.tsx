"use client";

import { useEffect, useState } from "react";
import { Layers, Sparkles, XCircle, Loader2 } from "lucide-react";

interface ProcessingScreenProps {
  progresso: number; 
  mensagem?: string;
  onCancel: () => void; 
}

const MENSAGENS_ROTATIVAS = [
  "Lendo a estrutura e os arquivos enviados...",
  "Analisando padrões e dependências do código...",
  "Estruturando o conteúdo do documento técnico...",
  "Sintetizando arquiteturas e fluxos...",
  "Isso pode levar alguns instantes devido ao tamanho do projeto...",
  "Finalizando formatação e gerando o arquivo final...",
];

export function ProcessingScreen({ progresso, mensagem, onCancel }: ProcessingScreenProps) {
  const [indiceMensagem, setIndiceMensagem] = useState(0);

  useEffect(() => {
    if (mensagem) return; 
    const intervalo = setInterval(() => {
      setIndiceMensagem((atual) => (atual + 1) % MENSAGENS_ROTATIVAS.length);
    }, 4000);
    return () => clearInterval(intervalo);
  }, [mensagem]);

  const mensagemExibida = mensagem ?? MENSAGENS_ROTATIVAS[indiceMensagem];

  return (
    <div className="animate-fade-up flex flex-col items-center px-6 py-12 text-center max-w-lg mx-auto">
      
      {/* Ícone Central */}
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-accent/15 animate-ping opacity-75" />
        <div className="absolute inset-2 rounded-full border border-accent/30 bg-surface-elevated/80 shadow-lg flex items-center justify-center">
          <Layers className="h-8 w-8 text-accent animate-pulse" />
        </div>
      </div>

      {/* Título */}
      <h2 className="font-display text-2xl font-semibold text-foreground">
        Gerando sua documentação
      </h2>

      {/* Mensagem Rotativa Fluida */}
      <p className="mt-2 min-h-[2.5rem] font-mono text-sm text-muted-foreground transition-all duration-500 px-4 flex items-center justify-center">
        {mensagemExibida}
      </p>

      {/* Barra de Progresso com Animação Contínua */}
      <div className="mt-8 w-full space-y-2">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-input border border-border/40 relative">
          <div className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-accent to-transparent animate-loading" />
        </div>
        <div className="flex items-center justify-center gap-2 font-mono text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin text-accent" />
          <span>Processando no servidor (aguarde)...</span>
        </div>
      </div>

      {/* Card Informativo Neutro */}
      <div className="mt-8 w-full rounded-2xl border border-border/60 bg-card/40 p-4 text-center backdrop-blur-sm shadow-sm space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span className="font-medium">Processamento de Dados Avançado</span>
        </div>
        <p className="text-xs text-muted-foreground/80 leading-relaxed">
          Projetos maiores exigem análises completas. Assim que o documento estiver pronto, ele aparecerá automaticamente aqui.
        </p>
      </div>

      {/* Botão de Cancelar */}
      <div className="mt-8">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors cursor-pointer"
        >
          <XCircle className="h-4 w-4" />
          Cancelar Processo
        </button>
      </div>

      {/* Estilo da animação da barrinha */}
      <style>{`
        @keyframes loading {
          0% { left: -35%; }
          100% { left: 105%; }
        }
        .animate-loading {
          animation: loading 1.8s infinite ease-in-out;
        }
      `}</style>

    </div>
  );
}