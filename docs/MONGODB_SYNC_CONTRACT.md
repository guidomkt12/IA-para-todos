# Contrato de sincronização MongoDB

## Edge Function

`POST /functions/v1/mongo-user-sync`

Headers:

- `Authorization: Bearer <supabase-user-token>`

Body:

```json
{
  "organization_id": "uuid"
}
```

A função identifica o usuário autenticado, valida se ele é membro ativo da organização, carrega a organização no Supabase e chama o webhook n8n configurado em `N8N_MONGO_USER_SYNC_WEBHOOK_URL`.

## Payload enviado ao n8n

```json
{
  "event": "organization_user_upsert",
  "idempotency_key": "<organization_id>:<user_id>:profile",
  "organization": {
    "id": "uuid",
    "name": "Studio Exemplo",
    "slug": "studio-exemplo",
    "business_type": "salon",
    "status": "trial"
  },
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "role": "owner"
  }
}
```

## Collection MongoDB

`beauty_users`

Chave de upsert: `idempotency_key`.

Campos mínimos:

- `idempotency_key`
- `organization`
- `user`
- `event`
- `synced_at`

## Regras

- Não salvar tokens Supabase, service role, tokens UAZAPI ou segredos de webhook no MongoDB.
- Não usar MongoDB como fonte primária para agenda, CRM, mensagens ou organizações.
- Não aceitar `organization_id` vindo direto do navegador no n8n; ele deve passar pela Edge Function.
