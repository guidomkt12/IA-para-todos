# Legacy Connector Map

Pesquisa executada com `rg -n "https?://|fetch\(|axios|n8n|uazapi|instance|qrcode|pairing|webhook|mongodb|cliente_id|business_id|token|send/text|send/media|connection|status|disconnect|delete instance" -S src supabase README.md package.json vercel.json .env`.

| Origem | Endpoint | Método | Headers/Auth | Body | Resposta | Finalidade | n8n | UAZAPI | MongoDB | Riscos | Decisão |
|---|---|---:|---|---|---|---|---|---|---|---|---|
| `src/lib/api.ts` | `https://n8n.guinevesapi.xyz/webhook/{path}` | POST | `Content-Type`, `x-webhook-secret` vindo de `VITE_WEBHOOK_SECRET` | body arbitrário | JSON/texto | Proxy genérico antigo para n8n | Sim | Indireta | Indireto | Segredo no frontend, acoplamento a webhooks privilegiados | Substituir por Edge Functions autenticadas |
| `src/components/dashboard/WhatsAppTab.tsx` | `uazapi-manager` via `n8nPost` | POST | frontend secret | `{ cliente_id, acao: listar/status/qr/disconnect/criar_instancia/deletar_instancia }` | instâncias, status, QR | Gestão de instâncias WhatsApp | Sim | Sim | Provável | `cliente_id` arbitrário no navegador, ações privilegiadas client-side | Adaptar contrato em `whatsapp-instance` server-side |
| `src/components/dashboard/ChatTab.tsx` | `saas-chat` e `uazapi-manager` via `n8nPost` | POST | frontend secret | `cliente_id`, instância, conversa/mensagem | mensagens e envio | Chat antigo | Sim | Sim | Provável | envio privilegiado pelo browser, domínio antigo | Substituir por inbox Supabase + provider server-side |
| `src/components/dashboard/IATab.tsx` | `admin` via `n8nPost` | POST | frontend secret | `buscar_config`, `atualizar_ia` com `cliente_id` | config | Config IA antiga | Sim | Não direto | Sim | prompts/config no frontend e Mongo legado | Substituir por `ai_settings` no Supabase |
| `src/components/dashboard/ConfigTab.tsx` | `admin` via `n8nPost` | POST | frontend secret | `buscar_config`, plano/config | config | Config cliente/plano | Sim | Não direto | Sim | mistura billing/config legada | Substituir por organizations/settings/plans |
| `src/components/dashboard/DisparosTab.tsx` | `admin` via `n8nPost` | POST | frontend secret | config disparos | config | Disparos frios | Sim | Indireta | Sim | Domínio proibido | Descartar |
| `src/components/dashboard/LeadsImportModal.tsx` | `import-contatos` via `n8nPost` | POST | frontend secret | `{ cliente_id, contatos }` | resultado importação | Importação de leads | Sim | Não direto | Sim | LGPD/prospecção/listas frias | Descartar |
| `src/components/dashboard/ScriptsTab.tsx` | `https://n8n.guinevesapi.xyz/webhook/update-script` | POST | JSON | `{ cliente_id, novo_script }` | status | Script comercial | Sim | Não | Sim | prompt/script de prospecção | Descartar |
| `supabase/functions/create-user/index.ts` | `N8N_ADMIN_WEBHOOK_URL` ou `/webhook/admin` | POST | `Content-Type` | usuário/plano/cliente | status | Sincronização admin antiga | Sim | Não direto | Sim | sincronização Mongo como fonte operacional | Adaptar somente padrão server-side |
| `src/pages/Admin.tsx` | `admin`, `track-access` via `n8nPost` | POST | frontend secret | clientes/planos | clientes/config | Admin legado | Sim | Não direto | Sim | Mongo como fallback, `cliente_id` | Substituir por platform Supabase |

Nenhum token ou dado real foi copiado para a nova implementação. A nova arquitetura usa Supabase como persistência e Edge Functions como backend para chamadas privilegiadas.
