import { Sidebar } from "@/components/features/Sidebar";

/**
 * Layout compartilhado por todas as rotas /dashboard/*.
 * Renderiza a Sidebar fixa e reserva o espaço correspondente no conteúdo
 * (md:pl-64 no desktop, pb-16 no mobile para não ficar atrás da barra inferior).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pb-20 md:pb-0 md:pl-64">{children}</div>
    </div>
  );
}
