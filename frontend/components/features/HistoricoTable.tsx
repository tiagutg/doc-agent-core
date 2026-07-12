"use client";

import { Download, FileX2, Inbox, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROTULO_TIPO_DOCUMENTACAO, type ItemHistorico } from "@/lib/historico";

interface HistoricoTableProps {
  itens: ItemHistorico[];
  onRemover: (id: string) => void;
}

/** Formata a data ISO salva no histórico para o padrão brasileiro (dd/mm/aaaa hh:mm). */
function formatarData(dataIso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dataIso));
}

function baixarArquivo(item: ItemHistorico) {
  if (!item.urlArquivo) return;
  const link = document.createElement("a");
  link.href = item.urlArquivo;
  link.download = item.nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function HistoricoTable({ itens, onRemover }: HistoricoTableProps) {
  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
        <Inbox className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Nenhuma documentação gerada ainda. O histórico é preenchido
          automaticamente a cada geração concluída.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {/* Cabeçalho — visível apenas em telas médias/grandes */}
      <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-border bg-surface-elevated px-5 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground md:grid">
        <span>Nome</span>
        <span>Data</span>
        <span>Tipo</span>
        <span>Status</span>
        <span className="text-right">Ações</span>
      </div>

      <ul className="divide-y divide-border">
        {itens.map((item) => (
          <li
            key={item.id}
            className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center md:gap-4"
          >
            <span className="truncate text-sm font-medium text-foreground">
              {item.nomeArquivo}
            </span>

            <span className="text-xs text-muted-foreground md:font-mono">
              {formatarData(item.dataGeracao)}
            </span>

            <span className="text-xs text-muted-foreground">
              {ROTULO_TIPO_DOCUMENTACAO[item.tipoDocumentacao]}
            </span>

            <span>
              {item.status === "concluido" ? (
                <Badge variant="success">Concluído</Badge>
              ) : (
                <Badge variant="destructive">Erro</Badge>
              )}
            </span>

            <div className="flex items-center justify-start gap-1 md:justify-end">
              <Button
                variant="ghost"
                size="icon"
                disabled={!item.urlArquivo}
                onClick={() => baixarArquivo(item)}
                aria-label={`Baixar ${item.nomeArquivo}`}
              >
                {item.urlArquivo ? (
                  <Download className="h-4 w-4" />
                ) : (
                  <FileX2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemover(item.id)}
                aria-label={`Remover ${item.nomeArquivo} do histórico`}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
