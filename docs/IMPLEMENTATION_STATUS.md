# Implementation Status

- Landing page nova: parcialmente implementada.
- Autenticação: preserva Supabase Auth existente; não validada em runtime neste ambiente.
- App shell: parcialmente implementado com rotas reais.
- Onboarding: parcialmente implementado com persistência Supabase.
- Serviços/profissionais/horários: parcialmente implementados com persistência Supabase.
- CRM: parcialmente implementado com leitura Supabase e empty states.
- Agenda: parcialmente implementada com criação Supabase e constraint de conflito na migration.
- Inbox: parcialmente implementado com persistência Supabase e takeover.
- Integração WhatsApp: estrutura server-side via Edge Functions; UAZAPI/n8n real depende de variáveis.
- Webhook: estrutura server-side com idempotência; não validado contra provider real.
- IA com ferramentas: pendente.
- E2E/screenshots: pendente por instalação incompleta de dependências/browser no ambiente.
