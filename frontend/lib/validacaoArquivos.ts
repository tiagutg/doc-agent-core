import type { TipoDocumentacao } from "@/lib/types";

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

export function filtrarArquivosPorEscopo(
  arquivos: any[],
  tipoDocumentacao: TipoDocumentacao
): ResultadoValidacaoEscopo {
  const arquivosFiltrados: string[] = [];
  const tipo = tipoDocumentacao.toLowerCase();

  const arquivosValidos = arquivos.filter((item) => {
    const nome = (item.nome || item.file?.name || "").toLowerCase();

    if (nome.endsWith(".zip")) {
      return true;
    }

    if (tipo.includes("frontend")) {
      const eBackendPuro = EXTENSOES_BACKEND.some((ext) => nome.endsWith(ext));
      const eBanco = EXTENSOES_DADOS.some((ext) => nome.endsWith(ext));
      
      if (eBackendPuro || eBanco) {
        arquivosFiltrados.push(nome);
        return false;
      }
    }

    if (tipo.includes("backend")) {
      const eFrontendPuro = EXTENSOES_FRONTEND.some((ext) => nome.endsWith(ext));
      
      if (eFrontendPuro) {
        arquivosFiltrados.push(nome);
        return false;
      }
    }


    return true;
  });

  return { arquivosValidos, arquivosFiltrados };
}