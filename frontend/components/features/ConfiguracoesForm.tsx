"use client";

import { useEffect, useState } from "react";
import { Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  CONFIGURACOES_PADRAO,
  obterConfiguracoes,
  salvarConfiguracoes,
  type ConfiguracoesApp,
  type IdiomaApp,
  type TemaApp,
} from "@/lib/configuracoes";

export function ConfiguracoesForm() {
  const { toast } = useToast();
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesApp>(CONFIGURACOES_PADRAO);

  // Carrega as configurações salvas apenas no cliente (evita mismatch de SSR).
  useEffect(() => {
    setConfiguracoes(obterConfiguracoes());
  }, []);

  const handleSalvar = () => {
    salvarConfiguracoes(configuracoes);
    toast({
      title: "Configurações salvas",
      description: "Suas preferências foram atualizadas neste navegador.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preferências gerais</CardTitle>
          <CardDescription>
            Aplicadas apenas neste navegador - ainda sem sincronização com backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Tema
            </label>
            <Select
              value={configuracoes.tema}
              onValueChange={(value) =>
                setConfiguracoes((atual) => ({ ...atual, tema: value as TemaApp }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claro">Claro (padrão)</SelectItem>
                <SelectItem value="escuro">Escuro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Idioma
            </label>
            <Select
              value={configuracoes.idioma}
              onValueChange={(value) =>
                setConfiguracoes((atual) => ({ ...atual, idioma: value as IdiomaApp }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Nome da empresa
            </label>
            <Input
              placeholder="Ex: Mindworks Tecnologia"
              value={configuracoes.nomeEmpresa}
              onChange={(e) =>
                setConfiguracoes((atual) => ({ ...atual, nomeEmpresa: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Usado futuramente para personalizar o cabeçalho dos documentos gerados.
            </p>
          </div>

          <Button onClick={handleSalvar}>
            <Save className="h-4 w-4" />
            Salvar configurações
          </Button>
        </CardContent>
      </Card>

      {/* Placeholder para autenticação futura — desabilitado por enquanto */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Autenticação
          </CardTitle>
          <CardDescription>
            Login corporativo e permissões por usuário chegam em uma próxima etapa,
            junto com a integração de backend.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
