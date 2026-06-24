# Casa Forte Compras

Sistema interno da Casa Forte para criação de pedidos de compra de materiais de obra, enriquecimento automático via IA, geração de PDF e envio aos fornecedores via WhatsApp.

## Stack

Next.js 16 (App Router) · TypeScript · Supabase (Auth, Postgres, Storage) · TailwindCSS · Shadcn/UI · OpenAI API · WhatsApp Cloud API.

## Status do projeto

Implementado até agora (**Etapa 1**):

- Setup do projeto, Tailwind, Shadcn/UI.
- Identidade visual da Casa Forte (laranja `#E8390E`, fundo `#F7F7F7`, cards brancos).
- Clients Supabase (`browser`, `server`, `admin`) e middleware de sessão.
- Layout base (sidebar + header) e página de login.
- Estrutura de pastas completa (`src/app`, `src/lib`, `src/types`, `supabase/migrations`).
- Agentes Claude Code em `.claude/agents`.

Próximas etapas (ver histórico de planejamento): migrations/RLS/seeds, CRUDs, pedidos, IA automática, PDF, WhatsApp, dashboard/relatórios, segurança.

## Configuração

```bash
cp .env.example .env.local
# preencha as variáveis do Supabase, OpenAI e WhatsApp Cloud API
npm install
npm run dev
```

Nunca exponha `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` ou `WHATSAPP_ACCESS_TOKEN` no frontend — essas chaves só devem ser usadas em código server-side (`src/lib/supabase/admin.ts`, rotas de API, Server Actions).
