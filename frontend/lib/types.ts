export type TipoDocumentacao =
  | "arquitetura-backend"
  | "estrutura-frontend"
  | "visao-geral-cliente";

export type FormatoSaida = "md" | "docx" | "pdf";

export type StatusGeracao =
  | "idle" 
  | "enviando" 
  | "processando"
  | "concluido" 
  | "erro"; 

export interface ArquivoSelecionado {
  id: string;
  file: File;
  nome: string;
  tamanho: number;
  extensao: string;
}

export interface ConfiguracaoDocumento {
  tipoDocumentacao: TipoDocumentacao;
  formatoSaida: FormatoSaida;
}

export interface RespostaStatusJob {
  jobId: string;
  status: "processando" | "concluido" | "erro";
  progresso?: number; 
  mensagem?: string; 
  urlArquivo?: string; 
  erro?: string;
} 

export interface OpcaoTipoDocumentacao {
  value: TipoDocumentacao;
  label: string;
  descricao: string;
}

export interface OpcaoFormatoSaida {
  value: FormatoSaida;
  label: string;
}

export const OPCOES_TIPO_DOCUMENTACAO: OpcaoTipoDocumentacao[] = [
  {
    value: "arquitetura-backend",
    label: "Arquitetura de Backend",
    descricao: "Endpoints, modelos de dados, serviços e integrações",
  },
  {
    value: "estrutura-frontend",
    label: "Estrutura de Frontend",
    descricao: "Componentes, rotas, hooks e fluxo de estado",
  },
  {
    value: "visao-geral-cliente",
    label: "Visão Geral (Não-técnica)",
    descricao: "Resumo funcional para clientes e stakeholders",
  },
];

export const OPCOES_FORMATO_SAIDA: OpcaoFormatoSaida[] = [
  { value: "md", label: "Markdown (.md)" },
  { value: "docx", label: "Word (.docx)" },
  { value: "pdf", label: "PDF (.pdf)" },
];