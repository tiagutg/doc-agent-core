import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { DocGenerationProvider } from "@/lib/DocGenerationContext";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "DocForge - Documentação de Software",
  description:
    "Envie seu código e receba documentação técnica gerada em Markdown, Word ou PDF.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Script síncrono para aplicar o tema escuro antes de renderizar e evitar o flash branco */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const salvo = localStorage.getItem("docforge:configuracoes");
                if (salvo) {
                  const config = JSON.parse(salvo);
                  if (config.tema === "escuro") {
                    document.documentElement.classList.add("dark");
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${plexSans.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-body text-foreground antialiased`}
      >
        <QueryProvider>
          <DocGenerationProvider>
            {children}
            <Toaster />
          </DocGenerationProvider>
        </QueryProvider>
      </body>
    </html>
  );
}