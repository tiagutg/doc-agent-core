/**
 * Tipos centrais da aplicação Doc-as-a-Service.
 * Mantidos separados em lib/types.ts para serem importados
 * tanto pelos componentes quanto pelo hook de geração.
 */

/** Tipo de documentação que a IA deve gerar a partir do código enviado */
export type TipoDocumentacao =
  | "arquitetura-backend"
  | "estrutura-frontend"
  | "visao-geral-cliente";

/** Formato de arquivo final entregue ao usuário */
export type FormatoSaida = "md" | "docx" | "pdf";

/** Estados possíveis do fluxo de geração de documentação */
export type StatusGeracao =
  | "idle" // Nada foi enviado ainda
  | "enviando" // Upload dos arquivos em andamento (POST inicial)
  | "processando" // n8n / IA está analisando o código (polling em andamento)
  | "concluido" // Documento pronto, URL de download disponível
  | "erro"; // Algo falhou no envio ou no processamento

/** Representa um arquivo selecionado pelo usuário na área de upload */
export interface ArquivoSelecionado {
  id: string;
  file: File;
  nome: string;
  tamanho: number;
  extensao: string;
}

/** Configuração escolhida pelo usuário antes de gerar a documentação */
export interface ConfiguracaoDocumento {
  tipoDocumentacao: TipoDocumentacao;
  formatoSaida: FormatoSaida;
}

/** Resposta esperada do webhook do n8n ao consultar o status do job */
export interface RespostaStatusJob {
  jobId: string;
  status: "processando" | "concluido" | "erro";
  progresso?: number; // 0-100, opcional, usado para a barra de progresso
  mensagem?: string; // Mensagem amigável sobre a etapa atual
  urlArquivo?: string; // Presente apenas quando status === "concluido"
  erro?: string; // Presente apenas quando status === "erro"
}

/** Opções exibidas no Select de "Tipo de Documentação" */
export const OPCOES_TIPO_DOCUMENTACAO: {
  value: TipoDocumentacao;
  label: string;
  descricao: string;
}[] = [
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

/** Opções exibidas no Select de "Formato de Saída" */
export const OPCOES_FORMATO_SAIDA: {
  value: FormatoSaida;
  label: string;
}[] = [
  { value: "md", label: "Markdown (.md)" },
  { value: "docx", label: "Word (.docx)" },
  { value: "pdf", label: "PDF (.pdf)" },
];
