import { redirect } from "next/navigation";

// A raiz da aplicação não renderiza mais o formulário diretamente:
// com a introdução do dashboard (Sidebar + rotas /dashboard/*), o fluxo de
// geração foi movido para /dashboard/gerar. Mantemos "/" apenas como
// ponto de entrada que redireciona para a rota funcional.
export default function PaginaRaiz() {
  redirect("/dashboard/gerar");
}
