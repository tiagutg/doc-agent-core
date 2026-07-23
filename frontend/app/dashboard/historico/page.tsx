"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HistoricoTable } from "@/components/features/HistoricoTable";
import { useToast } from "@/components/ui/use-toast";
import {
  limparHistorico,
  listarHistorico,
  removerItemHistorico,
  type ItemHistorico,
} from "@/lib/historico";

export default function PaginaHistorico() {
  const { toast } = useToast();
  const [itens, setItens] = useState<ItemHistorico[]>([]);

  // Carrega o histórico do localStorage apenas no cliente (evita mismatch de SSR).
  useEffect(() => {
    setItens(listarHistorico());
  }, []);

  const handleRemover = (id: string) => {
    removerItemHistorico(id);
    setItens(listarHistorico());
  };

  const handleLimparTudo = () => {
    limparHistorico();
    setItens([]);
    toast({ title: "Histórico limpo", description: "Todos os itens foram removidos." });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-8 sm:px-6 md:py-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Histórico</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Documentações geradas anteriormente.
          </p>
        </div>

        {itens.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleLimparTudo}>
            <Trash2 className="h-3.5 w-3.5" />
            Limpar tudo
          </Button>
        )}
      </header>

      <HistoricoTable itens={itens} onRemover={handleRemover} />
    </main>
  );
}
