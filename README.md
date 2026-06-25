# Casa Forte Compras

Sistema interno da Casa Forte para criação de pedidos de compra de materiais de obra, enriquecimento automático via IA, geração de PDF e envio aos fornecedores via WhatsApp.

## Stack

Next.js 16 (App Router) · TypeScript · Supabase (Auth, Postgres, Storage) · TailwindCSS · Shadcn/UI · Gemini/OpenAI API · Evolution API (WhatsApp).

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
# preencha as variáveis do Supabase, IA (Gemini/OpenAI) e Evolution API (WhatsApp)
npm install
npm run dev
```

Nunca exponha `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY` ou `EVOLUTION_API_KEY` no frontend — essas chaves só devem ser usadas em código server-side (`src/lib/supabase/admin.ts`, `src/lib/whatsapp/evolution-client.ts`, rotas de API, Server Actions).

## Variáveis de ambiente para deploy (Railway)

Ao configurar o serviço no Railway, defina as seguintes variáveis de ambiente
(sem valores reais aqui — preencha diretamente no painel do Railway):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
AI_PROVIDER=
GEMINI_API_KEY=
GEMINI_MODEL=
IMAGE_SEARCH_PROVIDER=none
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=casaforte
```

Notas:

- `NEXT_PUBLIC_APP_URL` deve apontar para a URL pública final do app (ex.: o
  subdomínio configurado, como `https://compras.casaforteinc.com.br`), pois é
  usada para montar links absolutos (ex.: logo no PDF do pedido).
- `IMAGE_SEARCH_PROVIDER=none` é o padrão — não há busca paga de imagem
  habilitada neste projeto; o fluxo de imagens é manual (upload + aprovação).
- `EVOLUTION_API_URL` e `EVOLUTION_API_KEY` apontam para a instância da
  Evolution API usada para envio de WhatsApp; `EVOLUTION_INSTANCE` é o nome da
  instância configurada nela (padrão `casaforte`).
- Nenhuma dessas chaves deve ser commitada no repositório nem aparecer em
  variáveis `NEXT_PUBLIC_*` além das já marcadas como públicas acima.

## Geração de PDF (Puppeteer/Chromium no Railway)

O documento do pedido é renderizado de HTML para PDF real (`application/pdf`)
usando Chromium headless via `puppeteer` (`src/lib/pdf/render-pdf.ts`). O
Chromium baixado pelo `npm install` do Puppeteer precisa de bibliotecas de
sistema para rodar — o arquivo `nixpacks.toml` na raiz do projeto já declara
essas dependências (`aptPkgs`) para o builder padrão do Railway (Nixpacks).
Não é necessário nenhum passo manual além de manter esse arquivo no deploy.
