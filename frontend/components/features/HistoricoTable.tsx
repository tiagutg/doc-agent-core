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

/** Extrai o nome real do arquivo a partir da URL do Supabase ou usa o fallback. */
function obterNomeArquivo(item: ItemHistorico): string {
  if (item.urlArquivo) {
    try {
      const urlObj = new URL(item.urlArquivo);
      const partes = urlObj.pathname.split("/");
      const ultimoSegmento = partes[partes.length - 1];
      if (ultimoSegmento) {
        return decodeURIComponent(ultimoSegmento);
      }
    } catch {
      const partes = item.urlArquivo.split("/");
      const arquivoQuery = partes.pop()?.split("?")[0];
      if (arquivoQuery) {
        return decodeURIComponent(arquivoQuery);
      }
    }
  }
  return item.nomeArquivo || "documentacao.docx";
}

async function baixarArquivo(item: ItemHistorico) {
  if (!item.urlArquivo || (item.status as any) === "cancelado") return;
  const nomeFinal = obterNomeArquivo(item);

  try {
    const response = await fetch(item.urlArquivo);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = nomeFinal;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(item.urlArquivo, "_blank");
  }
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
      <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-border bg-surface-elevated px-5 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground md:grid">
        <span>Nome</span>
        <span>Data</span>
        <span>Tipo</span>
        <span>Status</span>
        <span className="text-right">Ações</span>
      </div>

      <ul className="divide-y divide-border">
        {itens.map((item) => {
          const nomeExibicao = obterNomeArquivo(item);
          const statusAtual = item.status as string;
          const isCancelado = statusAtual === "cancelado";
          const isConcluido = statusAtual === "concluido";

          return (
            <li
              key={item.id}
              className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center md:gap-4"
            >
              <span className="truncate text-sm font-medium text-foreground">
                {nomeExibicao}
              </span>

              <span className="text-xs text-muted-foreground md:font-mono">
                {formatarData(item.dataGeracao)}
              </span>

              <span className="text-xs text-muted-foreground">
                {ROTULO_TIPO_DOCUMENTACAO[item.tipoDocumentacao]}
              </span>

              <span>
                {isConcluido ? (
                  <Badge variant="success">Concluído</Badge>
                ) : isCancelado ? (
                  <Badge variant="outline">Cancelado</Badge>
                ) : (
                  <Badge variant="destructive">Erro</Badge>
                )}
              </span>

              <div className="flex items-center justify-start gap-1 md:justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!item.urlArquivo || isCancelado}
                  onClick={() => baixarArquivo(item)}
                  aria-label={`Baixar ${nomeExibicao}`}
                >
                  {item.urlArquivo && !isCancelado ? (
                    <Download className="h-4 w-4" />
                  ) : (
                    <FileX2 className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemover(item.id)}
                  aria-label={`Remover ${nomeExibicao} do histórico`}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}