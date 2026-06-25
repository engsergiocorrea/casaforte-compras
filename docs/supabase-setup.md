# Setup do Supabase — Casa Forte Compras

Este documento descreve como provisionar o banco de dados, aplicar as migrations,
criar o bucket de Storage e validar a Etapa 2 do sistema.

## 1. Pré-requisitos

- Conta no [Supabase](https://supabase.com).
- Node.js instalado (para usar `npx supabase`, sem precisar instalar o CLI globalmente).

## 2. Criar o projeto Supabase

1. Acesse o [dashboard do Supabase](https://supabase.com/dashboard) e crie um novo projeto.
2. Guarde a senha do banco gerada na criação (necessária para `supabase link`/`db push` quando solicitado).
3. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (nunca expor no frontend)

Preencha essas três variáveis em `.env.local` (a partir de `.env.example`).

## 3. Aplicar as migrations

As migrations vivem em `supabase/migrations/` e são aplicadas em ordem numérica:

| Arquivo | Conteúdo |
|---|---|
| `001_initial_schema.sql` | Todas as tabelas do domínio + índices |
| `002_rls_policies.sql` | RLS habilitada em todas as tabelas + funções auxiliares + policies por papel |
| `003_seed_categories.sql` | Seed das 20 categorias de materiais |
| `004_storage_bucket.sql` | Criação do bucket `purchase-orders` (privado) + policies de storage |

### Opção A — Supabase CLI (recomendado)

```bash
cd ~/Desktop/casaforte-compras
npx supabase login
npx supabase link --project-ref <seu-project-ref>
npx supabase db push
```

O `<project-ref>` é o identificador do projeto, visível na URL do dashboard
(`https://supabase.com/dashboard/project/<project-ref>`) ou em **Project Settings → General**.

### Opção B — SQL Editor do dashboard

Caso não queira instalar/usar o CLI agora, copie o conteúdo de cada arquivo,
nesta ordem (001 → 002 → 003 → 004), e execute em **SQL Editor** no dashboard do Supabase.

## 4. Criar o bucket de Storage `purchase-orders`

A migration `004_storage_bucket.sql` já cria o bucket via SQL
(`insert into storage.buckets ...`) e suas policies de RLS. Se preferir criar manualmente
pelo dashboard (ex.: rodou apenas 001-003), siga:

1. Vá em **Storage** no dashboard do Supabase.
2. Clique em **New bucket**.
3. Nome: `purchase-orders`.
4. Marque como **privado** (não público) — o acesso é feito por URLs assinadas
   geradas pelo backend (`src/lib/supabase/admin.ts`), nunca por URL pública direta.
5. Se criado pelo dashboard (sem rodar a migration 004), aplique as policies de
   `storage.objects` manualmente executando apenas a parte de `create policy` do
   arquivo `004_storage_bucket.sql` no SQL Editor.

Uso do bucket: armazenar os PDFs/HTMLs gerados dos pedidos de compra e as imagens
de referência dos materiais (catálogo e itens de pedido).

## 5. Validar se as tabelas foram criadas

No dashboard do Supabase:

1. **Table Editor** → confirme que as 14 tabelas existem:
   `profiles`, `obras`, `engenheiros`, `obra_engenheiros`, `categorias_materiais`,
   `fornecedores`, `materiais_catalogo`, `material_images`, `pedidos_compra`,
   `pedido_compra_itens`, `aprovacoes_pedido`, `whatsapp_envios`,
   `respostas_fornecedores`, `activity_logs`.
2. **Table Editor → categorias_materiais** → confirme as 20 linhas do seed.
3. **Authentication → Policies** (ou **Database → Policies**) → confirme que
   todas as tabelas acima aparecem com RLS **habilitada** e com policies listadas.
4. **Storage** → confirme que o bucket `purchase-orders` existe e está marcado
   como privado.
5. Via SQL Editor, rode para confirmar as funções auxiliares:
   ```sql
   select proname from pg_proc where proname in (
     'current_profile_role', 'current_profile_id', 'is_admin_or_staff'
   );
   ```
   Deve retornar as 3 funções.

## 6. Próximo passo

Com o banco validado, a Etapa 3 cria os primeiros usuários/perfis de teste e os
CRUDs (obras, engenheiros, fornecedores, categorias, catálogo de materiais).
