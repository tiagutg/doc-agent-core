import type { FormatoSaida, TipoDocumentacao } from "@/lib/types";

/**
 * Persistência de histórico via localStorage.
 * Por enquanto não há backend para isso — quando existir, esta é a camada
 * a ser substituída por chamadas HTTP, mantendo a mesma assinatura de funções
 * para não exigir mudanças nas páginas que a consomem.
 */

const CHAVE_STORAGE = "docforge:historico";
const LIMITE_ITENS = 50; // Evita que o localStorage cresça indefinidamente.

// Adicionado "cancelado" aos status possíveis
export type StatusHistorico = "concluido" | "erro" | "cancelado";

export interface ItemHistorico {
  id: string;
  nomeArquivo: string;
  dataGeracao: string; // ISO string
  tipoDocumentacao: TipoDocumentacao;
  formatoSaida: FormatoSaida;
  status: StatusHistorico;
  urlArquivo?: string; // Ausente quando status === "erro" ou "cancelado"
}

/** Lê todos os itens salvos, do mais recente para o mais antigo. */
export function listarHistorico(): ItemHistorico[] {
  if (typeof window === "undefined") return [];

  try {
    const bruto = window.localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) return [];
    const itens = JSON.parse(bruto) as ItemHistorico[];
    return Array.isArray(itens) ? itens : [];
  } catch {
    // JSON corrompido ou localStorage indisponível: falha de forma segura.
    return [];
  }
}

/** Adiciona um novo item ao topo do histórico, respeitando o limite máximo. */
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

/** Remove um item específico do histórico pelo id. */
export function removerItemHistorico(id: string): void {
  if (typeof window === "undefined") return;
  const itensAtualizados = listarHistorico().filter((item) => item.id !== id);
  window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(itensAtualizados));
}

/** Limpa todo o histórico salvo. */
export function limparHistorico(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHAVE_STORAGE);
}

/** Rótulos amigáveis para exibição do tipo de documentação na tabela de histórico. */
export const ROTULO_TIPO_DOCUMENTACAO: Record<TipoDocumentacao, string> = {
  "arquitetura-backend": "Backend",
  "estrutura-frontend": "Frontend",
  "visao-geral-cliente": "Visão Geral",
};