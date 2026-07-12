"use client";

import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { FileCode2, UploadCloud, X } from "lucide-react";
import { cn, formatFileSize, generateId, getFileExtension } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { ArquivoSelecionado } from "@/lib/types";

// Extensões de código aceitas pela plataforma. Ajuste conforme as linguagens suportadas pelo backend.
const EXTENSOES_ACEITAS = {
  "text/plain": [
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".rb", ".php",
    ".c", ".cpp", ".h", ".cs", ".rs", ".swift", ".kt", ".sql", ".json",
    ".yaml", ".yml", ".md", ".env", ".html", ".css",
  ],
};

const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB por arquivo

interface DropzoneProps {
  arquivos: ArquivoSelecionado[];
  onArquivosChange: (arquivos: ArquivoSelecionado[]) => void;
  disabled?: boolean;
}

export function Dropzone({ arquivos, onArquivosChange, disabled }: DropzoneProps) {
  const { toast } = useToast();

  // Callback disparado quando arquivos são soltos ou selecionados.
  const onDrop = useCallback(
    (arquivosAceitos: File[], arquivosRejeitados: FileRejection[]) => {
      // Notifica o usuário sobre arquivos que não passaram na validação (tipo ou tamanho).
      if (arquivosRejeitados.length > 0) {
        toast({
          variant: "destructive",
          title: "Alguns arquivos foram rejeitados",
          description: `${arquivosRejeitados.length} arquivo(s) excedem 10MB ou possuem um tipo não suportado.`,
        });
      }

      const novosArquivos: ArquivoSelecionado[] = arquivosAceitos.map((file) => ({
        id: generateId(),
        file,
        nome: file.name,
        tamanho: file.size,
        extensao: getFileExtension(file.name),
      }));

      onArquivosChange([...arquivos, ...novosArquivos]);
    },
    [arquivos, onArquivosChange, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: EXTENSOES_ACEITAS,
    maxSize: TAMANHO_MAXIMO_BYTES,
    disabled,
    multiple: true,
  });

  const removerArquivo = (id: string) => {
    onArquivosChange(arquivos.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Área de drag & drop */}
      <div
        {...getRootProps()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-200",
          isDragActive
            ? "border-accent bg-accent/[0.06] scale-[1.01]"
            : "border-border hover:border-border-hover hover:bg-surface-hover/40",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            "mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-elevated transition-transform duration-200",
            isDragActive && "scale-110 border-accent/40"
          )}
        >
          <UploadCloud
            className={cn(
              "h-6 w-6 text-muted-foreground transition-colors",
              isDragActive && "text-accent"
            )}
          />
        </div>

        <p className="font-display text-lg text-foreground">
          {isDragActive ? "Solte os arquivos aqui" : "Arraste seus arquivos de código"}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          ou <span className="text-accent underline-offset-4 group-hover:underline">clique para selecionar</span> do seu computador
        </p>
        <p className="mt-4 font-mono text-xs text-muted-foreground/70">
          .py .js .ts .java .go .rb .php .rs — até 10MB por arquivo
        </p>
      </div>

      {/* Lista de arquivos selecionados */}
      {arquivos.length > 0 && (
        <ul className="space-y-2">
          {arquivos.map((arquivo) => (
            <li
              key={arquivo.id}
              className="animate-fade-up flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-input px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-elevated">
                  <FileCode2 className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{arquivo.nome}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatFileSize(arquivo.tamanho)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removerArquivo(arquivo.id)}
                disabled={disabled}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-red-400 disabled:pointer-events-none"
                aria-label={`Remover ${arquivo.nome}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
