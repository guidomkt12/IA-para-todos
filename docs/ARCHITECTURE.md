# Arquitetura

## Aplicação atual
SPA Vite + React, Supabase no cliente e componentes shadcn/ui. O primeiro corte vertical foi implementado como domínio TypeScript testável e UI local demonstrável sem credenciais reais.

## Camadas novas
- `src/lib/beauty/types.ts`: contratos do domínio.
- `src/lib/beauty/phone.ts`: normalização E.164.
- `src/lib/beauty/authorization.ts`: papéis e permissões centralizadas.
- `src/lib/beauty/scheduling.ts`: disponibilidade, buffers e conflitos.
- `src/lib/beauty/messaging.ts`: providers mock/UAZAPI e normalização de webhooks.
- `src/lib/beauty/verticalFlow.ts`: orquestração in-memory do corte vertical para testes e demo.

## Produção futura
Webhooks reais devem rodar server-side com service role protegida, validação de segredo por conexão, idempotência em banco e RLS para operações do dashboard.
