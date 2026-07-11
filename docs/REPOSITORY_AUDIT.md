# Auditoria do repositório

## Encontrado
- Stack: Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query e Supabase JS.
- Banco: Supabase Postgres com migrations em `supabase/migrations`.
- Autenticação: Supabase Auth via `src/contexts/AuthContext.tsx`.
- Multi-tenancy anterior: baseado em `cliente_id` em `user_permissions` e `gestor_clients`, com papéis `admin`, `gestor` e usuário comum.
- Integrações: hooks e API genérica para n8n em `src/hooks/useN8nData.ts` e `src/lib/api.ts`.
- Domínio anterior: dashboard de prospecção, disparos, leads, cidades, relatórios de IA e WhatsApp.
- Deploy: Vercel/Vite com `vercel.json` e scripts npm.
- Testes: Vitest configurado com teste mínimo.

## Reutilizar
- Componentes base shadcn/ui.
- Autenticação Supabase como base temporária.
- Estrutura de Vite/React para o primeiro corte vertical.
- Supabase migrations e RLS como mecanismo de isolamento.
- Utilitários genéricos de datas e UI.

## Remover ou não copiar
- Lógica de prospecção, disparos frios e importação de leads.
- Acoplamento do dashboard a n8n como fonte primária de dados de negócio.
- `cliente_id` como identidade principal do tenant em novas tabelas.
- Prompts, scripts ou modelos associados ao SaaS anterior.

## Refatorar
- Trocar o domínio de dashboard comercial por operação de beleza: organizações, serviços, profissionais, clientes, conversas e agendamentos.
- Criar autorização centralizada por `organization_members`.
- Isolar UAZAPI atrás de providers genéricos de instância e mensagens.
- Substituir métricas de disparos por métricas operacionais: agenda, conversas, CRM e IA.

## Riscos técnicos
- O app atual é Vite client-side; endpoints reais de webhook precisam de funções Supabase, Edge Functions ou migração futura para framework server-capable.
- Código antigo usa `any` e dados remotos com shape flexível.
- RLS antiga protege tabelas antigas, mas não atende o novo modelo por organização.
- A integração n8n anterior não deve ser usada como camada de autorização.

## Dependências externas
- Supabase Auth/Postgres/Edge Functions.
- n8n e UAZAPI no legado, classificados como referências técnicas.
- Vercel para hosting estático/SPA.

## Isolamento atual de tenants
O isolamento anterior usa `user_permissions.cliente_id` e `gestor_clients.cliente_id`, suficiente para o domínio antigo, mas inadequado para o novo produto. O novo modelo usa `organizations`, `organization_members` e RLS por `organization_id`.

## Adaptabilidade
O repositório pode ser adaptado com segurança se a mudança for incremental: manter UI e auth genéricas, criar novo schema por organização, introduzir providers isolados e descontinuar rotas/hook de prospecção.
