import type { TipoDocumentacao } from "@/lib/types";

// Mapeamento completo de extensões por categoria técnica
const EXTENSOES_BACKEND = [
  ".py", ".php", ".rb", ".go", ".cs", ".java", ".rs", ".cpp", ".c", ".h", ".swift", ".kt"
];

const EXTENSOES_FRONTEND = [
  ".tsx", ".jsx", ".vue", ".svelte", ".html", ".css", ".scss", ".sass", ".less"
];

const EXTENSOES_MOBILE = [
  ".swift", ".kt", ".java", ".dart", ".m", ".h"
];

const EXTENSOES_DADOS = [
  ".sql", ".prisma", ".graphql", ".gql", ".db", ".sqlite"
];

const EXTENSOES_DEVOPS = [
  ".dockerfile", ".tf", ".hcl", ".yaml", ".yml", ".sh"
];

export interface ResultadoValidacaoEscopo {
  arquivosValidos: any[];
  arquivosFiltrados: string[];
}

/**
 * Validação rigorosa e abrangente para evitar ruído e economizar tokens.
 * Filtra arquivos que não pertencem ao contexto selecionado pela documentação.
 */
export function filtrarArquivosPorEscopo(
  arquivos: any[],
  tipoDocumentacao: TipoDocumentacao
): ResultadoValidacaoEscopo {
  const arquivosFiltrados: string[] = [];
  const tipo = tipoDocumentacao.toLowerCase();

  const arquivosValidos = arquivos.filter((item) => {
    const nome = (item.nome || item.file?.name || "").toLowerCase();

    // Se for arquivo compactado (.zip), geralmente permitimos pois ele pode conter a árvore inteira
    if (nome.endsWith(".zip")) {
      return true;
    }

    // Regra para Documentação Frontend
    if (tipo.includes("frontend")) {
      const eBackendPuro = EXTENSOES_BACKEND.some((ext) => nome.endsWith(ext));
      const eBanco = EXTENSOES_DADOS.some((ext) => nome.endsWith(ext));
      
      if (eBackendPuro || eBanco) {
        arquivosFiltrados.push(nome);
        return false;
      }
    }

    // Regra para Documentação Backend
    if (tipo.includes("backend")) {
      const eFrontendPuro = EXTENSOES_FRONTEND.some((ext) => nome.endsWith(ext));
      
      if (eFrontendPuro) {
        arquivosFiltrados.push(nome);
        return false;
      }
    }

    // Você pode adicionar mais regras específicas aqui conforme novos tipos forem criados no sistema (ex: mobile, banco de dados, etc.)

    return true;
  });

  return { arquivosValidos, arquivosFiltrados };
}