# Auditoria de integrações legadas

A pasta `legacy-reference/` não está presente no checkout atual. A classificação abaixo cobre integrações identificadas no código principal.

| Integração | Objetivo | Origem | Destino | HTTP | Auth | Request/Response | Efeitos no banco | Erros/retry | Idempotência | Riscos | n8n/Mongo | Classificação |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `useN8nData`/`n8nPost` | Ler relatórios, instâncias, contatos e acionar eventos | Frontend | Webhooks n8n | GET/POST abstrato | não centralizada no app | shapes flexíveis | indireto no n8n/legado | oculto | não garantida | frontend acoplado a automação privilegiada | depende de n8n; Mongo não confirmado | replace |
| Dashboard de disparos | Relatórios de mensagens em massa | Frontend | n8n/relatórios | GET | legado | arrays de métricas | leitura | oculto | não garantida | domínio proibido no novo MVP | depende de n8n | discard |
| WhatsApp legado | Instâncias e status | Frontend/hook | n8n/UAZAPI | variado | legado | instâncias/status | leitura/ação indireta | oculto | não garantida | tokens/instâncias podem vazar se reutilizados | depende de n8n/UAZAPI | adapt |

Nenhuma credencial, payload real ou script específico foi copiado.
