import type { FormatoSaida, TipoDocumentacao } from "@/lib/types";


const CHAVE_STORAGE = "docforge:historico";
const LIMITE_ITENS = 50; 

export type StatusHistorico = "concluido" | "erro" | "cancelado";

export interface ItemHistorico {
  id: string;
  nomeArquivo: string;
  dataGeracao: string; 
  tipoDocumentacao: TipoDocumentacao;
  formatoSaida: FormatoSaida;
  status: StatusHistorico;
  urlArquivo?: string; 
}

export function listarHistorico(): ItemHistorico[] {
  if (typeof window === "undefined") return [];

  try {
    const bruto = window.localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) return [];
    const itens = JSON.parse(bruto) as ItemHistorico[];
    return Array.isArray(itens) ? itens : [];
  } catch {
    
    return [];
  }
}

export function salvarItemHistorico(item: Omit<ItemHistorico, "id" | "dataGeracao">): ItemHistorico {
  const novoItem: ItemHistorico = {
    ...item,
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    dataGeracao: new Date().toISOString(),
  };

  const itensAtuais = listarHistorico();
  const itensAtualizados = [novoItem, ...itensAtuais].slice(0, LIMITE_ITENS);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(itensAtualizados));
  }

  return novoItem;
}

export function removerItemHistorico(id: string): void {
  if (typeof window === "undefined") return;
  const itensAtualizados = listarHistorico().filter((item) => item.id !== id);
  window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(itensAtualizados));
}

export function limparHistorico(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHAVE_STORAGE);
}

export const ROTULO_TIPO_DOCUMENTACAO: Record<TipoDocumentacao, string> = {
  "arquitetura-backend": "Backend",
  "estrutura-frontend": "Frontend",
  "visao-geral-cliente": "Visão Geral",
};