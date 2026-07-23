"use client";

import { CheckCircle2, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormatoSaida } from "@/lib/types";

interface SuccessCardProps {
  urlArquivo: string;
  formatoSaida: FormatoSaida;
  onGerarNovamente: () => void;
}

export function SuccessCard({ urlArquivo, formatoSaida, onGerarNovamente }: SuccessCardProps) {
  // Dispara o download do arquivo de forma forçada utilizando Blob para evitar que o navegador abra o PDF em outra aba.
  const baixarArquivo = async () => {
    try {
      const response = await fetch(urlArquivo);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `documentacao.${formatoSaida}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      // Fallback de segurança caso ocorra algum bloqueio de CORS
      window.open(urlArquivo, "_blank");
    }
  };

  return (
    <div className="animate-fade-up flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
        <CheckCircle2 className="h-8 w-8 text-accent" />
      </div>

      <h2 className="font-display text-2xl text-foreground">Documentação pronta!</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Seu arquivo foi gerado com sucesso e já está disponível para download em
        formato <span className="font-mono text-foreground">.{formatoSaida}</span>.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={baixarArquivo}>
          <Download className="h-4 w-4" />
          Baixar documentação
        </Button>
        <Button size="lg" variant="outline" onClick={onGerarNovamente}>
          <RotateCcw className="h-4 w-4" />
          Gerar outro documento
        </Button>
      </div>
    </div>
  );
}