# Deploy

1. Criar projeto Supabase e aplicar migrations em `supabase/migrations`.
2. Configurar Supabase Auth e URLs autorizadas.
3. Criar variáveis da `.env.example` na Vercel, sem valores reais no Git.
4. Criar projeto Vercel conectado ao GitHub.
5. Build command: `npm run build`; output: `dist`.
6. Configurar domínio e redirects da SPA.
7. Configurar webhooks de mensagens apontando para camada server-side futura.
8. Configurar cron protegido por `CRON_SECRET` quando jobs forem ativados.
9. Testar provider mock, criação de organização, serviço, profissional, disponibilidade, webhook simulado, agenda e takeover.
10. Rollback: reverter release Vercel e migration somente via script revisado.

Não declare produção pronta sem executar lint, typecheck/testes e build.
