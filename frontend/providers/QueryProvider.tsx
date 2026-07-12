"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Provider global do @tanstack/react-query.
 * Necessário para que o hook useDocGeneration consiga usar useMutation/useQuery
 * com polling automático em qualquer parte da árvore de componentes.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState garante que o QueryClient seja criado uma única vez por sessão do navegador,
  // evitando recriação a cada re-render do componente pai.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
