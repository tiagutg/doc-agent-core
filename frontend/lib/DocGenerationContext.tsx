"use client";

import { createContext, useContext, ReactNode } from "react";
import { useDocGeneration } from "@/hooks/useDocGeneration";
import type { ArquivoSelecionado, ConfiguracaoDocumento } from "@/lib/types";

interface DocGenerationContextType {
  status: ReturnType<typeof useDocGeneration>["status"];
  progresso: number;
  mensagem: string | undefined;
  urlArquivoFinal: string | null;
  gerarDocumentacao: (arquivos: ArquivoSelecionado[], config: ConfiguracaoDocumento) => void;
  reiniciar: () => void;
}

const DocGenerationContext = createContext<DocGenerationContextType | undefined>(undefined);

export function DocGenerationProvider({ children }: { children: ReactNode }) {
  const docGen = useDocGeneration();

  return (
    <DocGenerationContext.Provider value={docGen}>
      {children}
    </DocGenerationContext.Provider>
  );
}

export function useDocGenerationContext() {
  const context = useContext(DocGenerationContext);
  if (!context) {
    throw new Error("useDocGenerationContext deve ser usado dentro de um DocGenerationProvider");
  }
  return context;
}