# Contratos de webhook

## Endpoint planejado
`POST /api/webhooks/messaging/[provider]/[connectionId]`

## Evento interno normalizado
```ts
{
  externalEventId: string;
  externalMessageId: string;
  fromPhoneE164: string;
  toPhoneE164: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'unsupported';
  text?: string;
  raw: unknown;
}
```

## Segurança
Validar provider, conexão, segredo/assinatura, tamanho do payload e idempotência por `provider + external_event_id + channel_connection_id` antes de processar.
