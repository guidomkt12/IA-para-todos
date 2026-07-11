# Mapa de migração

| Componente antigo | Componente novo | Estratégia | Riscos | Testes necessários |
|---|---|---|---|---|
| `cliente_id` | `organization_id` | criar novas tabelas e associar usuários por `organization_members` | acesso cruzado se misturar modelos | RLS entre organizações |
| Leads/contatos de prospecção | `customers` CRM opt-in | migrar somente contatos consentidos e necessários | LGPD/consentimento | normalização E.164 e opt-in |
| Disparos | lembretes transacionais | descartar campanhas frias | abuso de mensagens | jobs idempotentes |
| Chat legado | `conversations/messages` | adaptar apenas contrato de mensagem | duplicidade | webhook duplicado |
| UAZAPI via n8n | `MessagingProvider`/`InstanceProvider` | encapsular provider | tokens no frontend | segredo e parser |
| Métricas de prospecção | métricas operacionais | substituir fórmulas | métricas enganosas | KPIs documentados |
