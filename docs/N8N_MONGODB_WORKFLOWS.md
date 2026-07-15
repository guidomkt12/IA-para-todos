# Workflows n8n + MongoDB + UAZAPI

Estes workflows são templates para importar no n8n. Eles usam o repositório legado apenas como referência de contrato (`admin`, `uazapi-manager`, `saas-chat`, `cliente_id`, QR/status/desconexão), mas preservam o novo domínio com `organization_id` validado no backend Supabase.

## Arquivos

- `n8n/workflows/beauty_mongo_user_sync.json`
- `n8n/workflows/beauty_uazapi_instance_manager.json`
- `n8n/workflows/beauty_whatsapp_webhook_ingest.json`

## Credenciais e variáveis no n8n

Configure no n8n, nunca no frontend:

- `N8N_SHARED_SECRET`
- `UAZAPI_BASE_URL`
- `UAZAPI_ADMIN_TOKEN`
- `SUPABASE_FUNCTIONS_URL`
- `WEBHOOK_SIGNING_SECRET`
- Credencial MongoDB chamada `MongoDB Beauty SaaS`

## Fluxo 1 — Mongo User Sync

Endpoint n8n sugerido: `POST /webhook/beauty/mongo-user-sync`.

Origem: Supabase Edge Function `mongo-user-sync`.

Efeito: upsert idempotente na collection `beauty_users` com `organization`, `user`, `role` e `synced_at`.

Segurança:

- valida `x-internal-secret` contra `N8N_SHARED_SECRET`;
- não aceita chamada direta do navegador;
- não usa `organization_id` arbitrário sem a Edge Function validar associação do usuário.

## Fluxo 2 — UAZAPI Instance Manager

Endpoint n8n sugerido: `POST /webhook/beauty/uazapi-instance`.

Origem: Supabase Edge Function `whatsapp-instance`.

Ações aceitas:

- `create`
- `status`
- `pairing`
- `configure_webhook`
- `disconnect`
- `delete`

Efeito: chama UAZAPI server-side e registra/upserta estado em `whatsapp_instances` no MongoDB para auditoria operacional.

## Fluxo 3 — WhatsApp Webhook Ingest

Endpoint n8n sugerido: `POST /webhook/beauty/whatsapp-webhook/:connectionId`.

Origem: UAZAPI.

Efeito:

1. normaliza `connectionId` e `eventId`;
2. faz upsert do evento bruto em `whatsapp_webhook_events` no MongoDB;
3. chama a Edge Function Supabase `whatsapp-webhook/{connectionId}` para persistir cliente, conversa e mensagem no Supabase.

## Observações

MongoDB aqui é trilha operacional e compatibilidade com fluxos legados. O banco principal do SaaS continua sendo Supabase Postgres com RLS.
