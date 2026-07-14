"use client";

import { FileText, FileType2, Layers } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  OPCOES_FORMATO_SAIDA,
  OPCOES_TIPO_DOCUMENTACAO,
  type ConfiguracaoDocumento,
  type FormatoSaida,
  type TipoDocumentacao,
} from "@/lib/types";

interface ConfigFormProps {
  configuracao: ConfiguracaoDocumento;
  onConfiguracaoChange: (configuracao: ConfiguracaoDocumento) => void;
  disabled?: boolean;
}

// Ícone representativo para cada formato de saída, usado nos radio cards.
const ICONE_FORMATO: Record<FormatoSaida, typeof FileText> = {
  md: FileText,
  docx: FileType2,
  pdf: Layers,
};

export function ConfigForm({ configuracao, onConfiguracaoChange, disabled }: ConfigFormProps) {
  const atualizarTipo = (tipoDocumentacao: TipoDocumentacao) => {
    onConfiguracaoChange({ ...configuracao, tipoDocumentacao });
  };

  const atualizarFormato = (formatoSaida: FormatoSaida) => {
    onConfiguracaoChange({ ...configuracao, formatoSaida });
  };

  return (
    <div className="space-y-5">
      {/* Select: Tipo de Documentação */}
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Tipo de documentação
        </label>
        <Select
          value={configuracao.tipoDocumentacao}
          onValueChange={(value) => atualizarTipo(value as TipoDocumentacao)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de documentação" />
          </SelectTrigger>
          <SelectContent>
            {OPCOES_TIPO_DOCUMENTACAO.map((opcao) => (
              <SelectItem key={opcao.value} value={opcao.value}>
                <div className="flex flex-col gap-0.5 py-0.5">
                  <span className="font-medium">{opcao.label}</span>
                  <span className="text-xs text-muted-foreground">{opcao.descricao}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Radio cards: Formato de Saída */}
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Formato de saída
        </label>
        <div role="radiogroup" className="grid grid-cols-3 gap-3">
          {OPCOES_FORMATO_SAIDA.map((opcao) => {
            const Icone = ICONE_FORMATO[opcao.value];
            const selecionado = configuracao.formatoSaida === opcao.value;

            return (
              <button
                key={opcao.value}
                type="button"
                role="radio"
                aria-checked={selecionado}
                disabled={disabled}
                onClick={() => atualizarFormato(opcao.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
                  selecionado
                    ? "border-accent/50 bg-accent/[0.08] shadow-[0_0_0_1px_rgba(245,194,66,0.2)]"
                    : "border-border bg-surface-input hover:border-border-hover hover:bg-surface-hover"
                )}
              >
                <Icone
                  className={cn(
                    "h-5 w-5",
                    selecionado ? "text-accent" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "font-mono text-xs",
                    selecionado ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  .{opcao.value}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
