# AGENTS.md

## Produto
SaaS multiempresa de atendimento, CRM e agenda para salões de beleza, barbearias, estúdios e profissionais autônomos.

## Regras de domínio
- Não reintroduzir campanhas frias, raspagem, importação automática de listas ou lógica de prospecção.
- Não aceitar `organization_id` vindo do navegador sem validação por sessão/RLS.
- Não expor tokens de UAZAPI, chaves service role, segredos de webhook ou credenciais no frontend.
- Preço, duração, profissional e disponibilidade devem vir do banco/ferramentas.
- Todo dado de negócio persistido deve possuir `organization_id`, `created_at` e `updated_at`.

## Stack
Vite + React + TypeScript + Tailwind/shadcn-ui + Supabase. Backend privilegiado via Supabase Edge Functions.

## Testes
Execute `npm run lint`, `npm run typecheck`, `npm run test` e `npm run build` antes de finalizar mudanças relevantes.
