const CHAVE_STORAGE = "docforge:configuracoes";

export type TemaApp = "claro" | "escuro";
export type IdiomaApp = "pt-BR" | "en-US";

export interface ConfiguracoesApp {
  tema: TemaApp;
  idioma: IdiomaApp;
  nomeEmpresa: string;
}

export const CONFIGURACOES_PADRAO: ConfiguracoesApp = {
  tema: "claro",
  idioma: "pt-BR",
  nomeEmpresa: "",
};

export function obterConfiguracoes(): ConfiguracoesApp {
  if (typeof window === "undefined") return CONFIGURACOES_PADRAO;

  try {
    const bruto = window.localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) return CONFIGURACOES_PADRAO;
    return { ...CONFIGURACOES_PADRAO, ...(JSON.parse(bruto) as Partial<ConfiguracoesApp>) };
  } catch {
    return CONFIGURACOES_PADRAO;
  }
}

export function salvarConfiguracoes(configuracoes: ConfiguracoesApp): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(configuracoes));
  aplicarTema(configuracoes.tema);
}

export function aplicarTema(tema: TemaApp): void {
  if (typeof window === "undefined") return;
  document.documentElement.classList.toggle("dark", tema === "escuro");
}
