"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileStack, History, Settings, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemNavegacao {
  href: string;
  label: string;
  icone: typeof Wand2;
}

// Fonte única de verdade para os itens de navegação do dashboard.
// Adicionar uma nova rota do dashboard = adicionar uma linha aqui.
const ITENS_NAVEGACAO: ItemNavegacao[] = [
  { href: "/dashboard/gerar", label: "Gerar", icone: Wand2 },
  { href: "/dashboard/historico", label: "Histórico", icone: History },
  { href: "/dashboard/configuracoes", label: "Configurações", icone: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar fixa — visível em telas médias/grandes */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-navy text-navy-foreground md:flex">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <FileStack className="h-[18px] w-[18px]" />
          </div>
          <div>
            <p className="font-display text-base font-semibold leading-none">DocForge</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/50">
              Mindworks
            </p>
          </div>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {ITENS_NAVEGACAO.map((item) => {
            const ativo = pathname?.startsWith(item.href);
            const Icone = item.icone;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  ativo
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icone className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-6 py-5">
          <p className="font-mono text-[10px] text-white/40">
            Processamento via n8n + IA
          </p>
        </div>
      </aside>

      {/* Barra de navegação inferior — visível apenas em telas pequenas */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-navy py-2 md:hidden">
        {ITENS_NAVEGACAO.map((item) => {
          const ativo = pathname?.startsWith(item.href);
          const Icone = item.icone;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-[11px] font-medium transition-colors",
                ativo ? "text-white" : "text-white/50"
              )}
            >
              <Icone className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
