"use client";

import { useCallback, useEffect } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { FileArchive, FileCode2, UploadCloud, X } from "lucide-react";
import { cn, formatFileSize, generateId, getFileExtension } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { ArquivoSelecionado, TipoDocumentacao } from "@/lib/types";
import { filtrarArquivosPorEscopo } from "@/lib/validacaoArquivos";

const EXTENSOES_ACEITAS = {
  "text/plain": [
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".rb", ".php",
    ".c", ".cpp", ".h", ".cs", ".rs", ".swift", ".kt", ".sql", ".json",
    ".yaml", ".yml", ".md", ".env", ".html", ".css",
  ],
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
};

const TAMANHO_MAXIMO_BYTES = 50 * 1024 * 1024; // 50 MB por arquivo

interface DropzoneProps {
  arquivos: ArquivoSelecionado[];
  onArquivosChange: (arquivos: ArquivoSelecionado[]) => void;
  tipoDocumentacao?: TipoDocumentacao;
  disabled?: boolean;
}

export function Dropzone({ arquivos, onArquivosChange, tipoDocumentacao, disabled }: DropzoneProps) {
  const { toast } = useToast();

  // Ao carregar a tela, tenta restaurar os arquivos salvos no sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined" && arquivos.length === 0) {
      const arquivosSalvosJson = sessionStorage.getItem("arquivos_cache");
      if (arquivosSalvosJson) {
        try {
          const cacheParsed = JSON.parse(arquivosSalvosJson);
          const arquivosRestaurados: ArquivoSelecionado[] = cacheParsed.map((item: any) => {
            // Recria o objeto File virtual a partir do conteúdo salvo
            const file = new File([item.conteudoTexto], item.nome, { type: item.tipo || "text/plain" });
            return {
              id: item.id,
              file,
              nome: item.nome,
              tamanho: item.tamanho,
              extensao: item.extensao,
            };
          });
          onArquivosChange(arquivosRestaurados);
        } catch (e) {
          console.error("Erro ao restaurar arquivos do cache", e);
        }
      }
    }
  }, []);

  // Função auxiliar para atualizar o estado e persistir no sessionStorage
  const atualizarEPersistir = (novosArquivos: ArquivoSelecionado[]) => {
    onArquivosChange(novosArquivos);

    if (typeof window !== "undefined") {
      if (novosArquivos.length === 0) {
        sessionStorage.removeItem("arquivos_cache");
      } else {
        // Para salvar no Storage, lemos as propriedades essenciais e o conteúdo de texto de cada arquivo
        Promise.all(
          novosArquivos.map(async (item) => {
            let conteudoTexto = "";
            try {
              conteudoTexto = await item.file.text();
            } catch (err) {
              conteudoTexto = "";
            }
            return {
              id: item.id,
              nome: item.nome,
              tamanho: item.tamanho,
              extensao: item.extensao,
              tipo: item.file.type,
              conteudoTexto,
            };
          })
        ).then((serializados) => {
          sessionStorage.setItem("arquivos_cache", JSON.stringify(serializados));
        });
      }
    }
  };

  const onDrop = useCallback(
    (arquivosAceitos: File[], arquivosRejeitados: FileRejection[]) => {
      if (arquivosRejeitados.length > 0) {
        toast({
          variant: "destructive",
          title: "Alguns arquivos foram rejeitados",
          description: `${arquivosRejeitados.length} arquivo(s) excedem 50MB ou possuem um tipo não suportado.`,
        });
      }

      const novosMapeados: ArquivoSelecionado[] = arquivosAceitos.map((file) => ({
        id: generateId(),
        file,
        nome: file.name,
        tamanho: file.size,
        extensao: getFileExtension(file.name),
      }));

      // Combina com os já existentes antes de validar o escopo
      const combinados = [...arquivos, ...novosMapeados];

      // Se houver um tipo de documentação definido, valida o escopo
      if (tipoDocumentacao) {
        const { arquivosValidos, arquivosFiltrados } = filtrarArquivosPorEscopo(combinados, tipoDocumentacao);
        
        if (arquivosFiltrados.length > 0) {
          toast({
            variant: "destructive",
            title: "Arquivos incompatíveis ignorados",
            description: `O(s) arquivo(s) [${arquivosFiltrados.join(", ")}] foram removidos por não pertencerem ao escopo de ${tipoDocumentacao}.`,
          });
          atualizarEPersistir(arquivosValidos);
        } else {
          atualizarEPersistir(combinados);
        }
      } else {
        atualizarEPersistir(combinados);
      }
    },
    [arquivos, tipoDocumentacao, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: EXTENSOES_ACEITAS,
    maxSize: TAMANHO_MAXIMO_BYTES,
    disabled,
    multiple: true,
  });

  const removerArquivo = (id: string) => {
    const filtrados = arquivos.filter((a) => a.id !== id);
    atualizarEPersistir(filtrados);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-9 text-center transition-all duration-200",
          isDragActive
            ? "border-accent bg-accent/[0.06] scale-[1.01]"
            : "border-border hover:border-border-hover hover:bg-surface-hover/40",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            "mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-elevated transition-transform duration-200",
            isDragActive && "scale-110 border-accent/40"
          )}
        >
          <UploadCloud
            className={cn(
              "h-5 w-5 text-muted-foreground transition-colors",
              isDragActive && "text-accent"
            )}
          />
        </div>

        <p className="font-display text-base font-medium text-foreground">
          {isDragActive ? "Solte os arquivos aqui" : "Arraste seus arquivos de código"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          ou <span className="text-accent underline-offset-4 group-hover:underline">clique para selecionar</span> do seu computador
        </p>
        <p className="mt-3 font-mono text-xs text-muted-foreground/70">
          .py .js .ts .java .go .rb .php .rs .zip — até 50MB por arquivo
        </p>
      </div>

      {arquivos.length > 0 && (
        <ul className="space-y-2">
          {arquivos.map((arquivo) => (
            <li
              key={arquivo.id}
              className="animate-fade-up flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-input px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-elevated">
                  {arquivo.extensao === "zip" ? (
                    <FileArchive className="h-4 w-4 text-accent" />
                  ) : (
                    <FileCode2 className="h-4 w-4 text-accent" />
                  )}
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