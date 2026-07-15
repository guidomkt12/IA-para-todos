# Legacy Connector Map

Pesquisa executada no repositório com `rg -n "https?://|fetch\(|axios|n8n|uazapi|instance|qrcode|pairing|webhook|mongodb|cliente_id|business_id|token|send/text|send/media|connection|status|disconnect|delete instance" -S src supabase README.md package.json vercel.json .env`.

| Origem | Endpoint | Método | Headers/Auth | Body | Resposta | Finalidade | n8n | UAZAPI | MongoDB | Riscos | Decisão |
|---|---|---:|---|---|---|---|---|---|---|---|---|
| `src/lib/api.ts` | `https://n8n.guinevesapi.xyz/webhook/{path}` | POST | `x-webhook-secret` vindo de `VITE_WEBHOOK_SECRET` | JSON arbitrário | JSON/texto | Proxy frontend para webhooks antigos | Sim | Indireta | Indireto | segredo no navegador; sem autorização por organização | substituir por Edge Functions autenticadas |
| `src/components/dashboard/WhatsAppTab.tsx` | `uazapi-manager` via `n8nPost` | POST | segredo frontend | `cliente_id`, `acao`: listar/status/qr/disconnect/criar/deletar | instâncias, status, QR | gestão WhatsApp | Sim | Sim | provável | `cliente_id` arbitrário e ação privilegiada no browser | adaptar contrato em provider server-side |
| `src/components/dashboard/ChatTab.tsx` | `saas-chat`, `uazapi-manager` | POST | segredo frontend | cliente, instância, conversa, mensagem | mensagens/envio | chat legado | Sim | Sim | provável | envio privilegiado pelo navegador | substituir por inbox Supabase + Edge Function |
| `src/components/dashboard/IATab.tsx` | `admin` | POST | segredo frontend | `buscar_config`, `atualizar_ia`, `cliente_id` | config | config IA antiga | Sim | Não direto | Sim | prompts/config no frontend | substituir por `ai_settings` Supabase |
| `src/components/dashboard/ConfigTab.tsx` | `admin` | POST | segredo frontend | config/plano | config | config cliente | Sim | Não direto | Sim | mistura billing/config legado | substituir por settings/plans |
| `src/components/dashboard/DisparosTab.tsx` | `admin` | POST | segredo frontend | config disparos | config | disparos frios | Sim | indireta | Sim | domínio proibido | descartar |
| `src/components/dashboard/LeadsImportModal.tsx` | `import-contatos` | POST | segredo frontend | `cliente_id`, contatos | resultado | importação de leads | Sim | Não | Sim | LGPD/prospecção | descartar |
| `src/components/dashboard/ScriptsTab.tsx` | `/webhook/update-script` | POST | JSON | `cliente_id`, script | status | script comercial | Sim | Não | Sim | prompt de prospecção | descartar |
| `supabase/functions/create-user/index.ts` | `N8N_ADMIN_WEBHOOK_URL` | POST | server-side | usuário/plano/cliente | status | sincronização admin | Sim | Não direto | Sim | Mongo como fonte operacional | adaptar apenas padrão server-side |
| `src/pages/Admin.tsx` | `admin`, `track-access` | POST | segredo frontend | clientes/planos | clientes/config | admin legado | Sim | Não direto | Sim | Mongo fallback; `cliente_id` | substituir por platform Supabase |

Nenhum dado real, token, prompt de prospecção ou script específico foi migrado.
