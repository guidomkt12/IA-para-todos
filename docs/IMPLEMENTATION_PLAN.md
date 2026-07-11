# Plano de implementação

## Concluído neste corte
- Auditoria do repositório e do legado disponível.
- Novo modelo inicial em migration versionada.
- Camada de domínio TypeScript para autorização, telefone, agenda, mensagens e fluxo vertical.
- Dashboard SPA reorientado para salão/barbearia com onboarding, inbox, CRM, agenda e takeover humano em demo.
- Testes unitários do fluxo vertical, disponibilidade, idempotência, telefone, provider mock e autorização.
- CI, `.env.example` e documentação de deploy.

## Próximos passos
1. Implementar endpoints server-side reais via Supabase Edge Functions ou migrar para Next.js App Router.
2. Conectar formulários do dashboard ao Supabase com RLS validada.
3. Implementar criptografia real de credenciais com `APP_ENCRYPTION_KEY` server-side.
4. Implementar UAZAPI real no provider sem expor tokens no cliente.
5. Adicionar testes de integração contra Supabase local.
6. Implementar lembretes/cron e health panel.
