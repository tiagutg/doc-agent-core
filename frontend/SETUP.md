# Setup — Doc-as-a-Service (Frontend)

Execute estes comandos **na raiz do repositório** (onde já está o backend em Python).
Tudo será isolado dentro da subpasta `/frontend`, sem misturar com os arquivos Python.

## 1. Criar o projeto Next.js dentro de /frontend

```bash
npx create-next-app@latest frontend --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*"
cd frontend
```

Durante o prompt interativo, responda:
- Would you like to use Turbopack? → Yes (opcional, mais rápido em dev)
- Would you like to customize the default import alias? → No (mantenha `@/*`)

## 2. Instalar dependências do projeto

```bash
npm install axios @tanstack/react-query react-dropzone lucide-react
npm install class-variance-authority clsx tailwind-merge
```

## 3. Inicializar o shadcn/ui

```bash
npx shadcn@latest init
```

Configuração recomendada quando perguntado:
- Style → Default
- Base color → Neutral
- CSS variables → Yes

## 4. Adicionar os componentes shadcn/ui utilizados

```bash
npx shadcn@latest add button select card progress toast
```

> Este comando gera automaticamente os arquivos em `frontend/components/ui/`.
> Os arquivos entregues abaixo (`button.tsx`, `select.tsx`, `card.tsx`, `progress.tsx`, `toast.tsx`, `toaster.tsx`, `use-toast.ts`)
> já estão prontos e podem substituir os gerados pelo CLI, garantindo consistência com o restante do código.

## 5. Rodar o projeto em desenvolvimento

```bash
npm run dev
```

O projeto ficará disponível em `http://localhost:3000`.

## 6. Variável de ambiente do Webhook (n8n)

Crie um arquivo `frontend/.env.local`:

```bash
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://seu-n8n.exemplo.com/webhook/gerar-documentacao
NEXT_PUBLIC_N8N_STATUS_URL=https://seu-n8n.exemplo.com/webhook/status-documentacao
```

Essas URLs são consumidas pelo hook `useDocGeneration` (ver `frontend/hooks/useDocGeneration.ts`).

---

## Estrutura final de pastas

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── select.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   └── use-toast.ts
│   └── features/
│       ├── Dropzone.tsx
│       ├── ConfigForm.tsx
│       ├── ProcessingScreen.tsx
│       └── SuccessCard.tsx
├── hooks/
│   └── useDocGeneration.ts
├── lib/
│   ├── utils.ts
│   └── types.ts
└── providers/
    └── QueryProvider.tsx
```
