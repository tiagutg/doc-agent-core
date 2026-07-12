import { ConfiguracoesForm } from "@/components/features/ConfiguracoesForm";

export default function PaginaConfiguracoes() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10 sm:px-6 md:py-14">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Preferências da aplicação, salvas neste navegador.
        </p>
      </header>

      <ConfiguracoesForm />
    </main>
  );
}
