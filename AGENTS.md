# AGENTS.md

## Produto
Este repositório está sendo convertido para um SaaS multiempresa de atendimento, CRM e agenda para salões de beleza, barbearias, estúdios e profissionais autônomos.

## Regras de domínio
- Não reintroduzir campanhas frias, raspagem, importação automática de listas ou lógica de prospecção.
- Não aceitar `organization_id` vindo do navegador sem validação no servidor/RLS.
- Não expor tokens de UAZAPI, chaves Supabase service role, segredos de webhook ou prompts internos no frontend.
- Dados estruturados de preço, duração, profissional e disponibilidade devem vir do banco/ferramentas, nunca de texto livre da IA.
- Todo dado de negócio novo deve ser associado a `organization_id`, `created_at` e `updated_at` quando persistido.

## Stack atual
Aplicação Vite + React + TypeScript + Tailwind/shadcn-ui com Supabase. Preserve a stack até existir motivo técnico para migração.

## Testes
Execute `npm run lint`, `npm run test` e `npm run build` antes de finalizar mudanças relevantes.
