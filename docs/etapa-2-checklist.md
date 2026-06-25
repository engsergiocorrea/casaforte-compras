# Checklist de validação — Etapa 2 (Banco de dados)

Marque cada item após validar no dashboard do Supabase ou via `psql`/SQL Editor.

## Migrations

- [ ] `001_initial_schema.sql` aplicada sem erro
- [ ] `002_rls_policies.sql` aplicada sem erro
- [ ] `003_seed_categories.sql` aplicada sem erro
- [ ] `004_storage_bucket.sql` aplicada sem erro

## Tabelas (14)

- [ ] `profiles`
- [ ] `obras`
- [ ] `engenheiros`
- [ ] `obra_engenheiros`
- [ ] `categorias_materiais`
- [ ] `fornecedores`
- [ ] `materiais_catalogo`
- [ ] `material_images`
- [ ] `pedidos_compra`
- [ ] `pedido_compra_itens`
- [ ] `aprovacoes_pedido`
- [ ] `whatsapp_envios`
- [ ] `respostas_fornecedores`
- [ ] `activity_logs`

## RLS e funções auxiliares

- [ ] RLS habilitada em todas as 14 tabelas
- [ ] Função `current_profile_role()` existe
- [ ] Função `current_profile_id()` existe
- [ ] Função `is_admin_or_staff()` existe
- [ ] Policies visíveis em **Database → Policies** para cada tabela

## Seeds

- [ ] `categorias_materiais` contém as 20 categorias esperadas (Cimento, Areia,
      Brita, Aço, Madeira, Hidráulica, Elétrica, Pintura, Revestimentos,
      Ferramentas, Locação de equipamentos, Esquadrias, Gesso,
      Impermeabilização, Piscina, Paisagismo, Cobertura, Telhado, Concreto, Outros)

## Storage

- [ ] Bucket `purchase-orders` existe
- [ ] Bucket está marcado como **privado** (não público)
- [ ] Policies de `storage.objects` para o bucket aparecem em **Storage → Policies**

## Variáveis de ambiente

- [ ] `.env.local` criado a partir de `.env.example`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` preenchido
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` preenchido
- [ ] `SUPABASE_SERVICE_ROLE_KEY` preenchido (apenas server-side, nunca versionar)

## Critério de conclusão da Etapa 2

A Etapa 2 está concluída quando todos os itens acima estiverem marcados.
Somente após isso a Etapa 3 (CRUDs) deve ser iniciada.
