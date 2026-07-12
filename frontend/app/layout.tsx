import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";

// Fonte de destaque (títulos): Inter — identidade corporativa Mindworks,
// substitui a antiga Fraunces (serifada/editorial).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

// Fonte de corpo: humanista, alta legibilidade em dashboards corporativos.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

// Fonte monoespaçada: usada em labels técnicos, badges e nomes de arquivo.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "DocForge — Documentação de Software como Serviço",
  description:
    "Envie seu código e receba documentação técnica gerada por IA em Markdown, Word ou PDF.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.variable} ${plexSans.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-body text-foreground antialiased`}
      >
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
