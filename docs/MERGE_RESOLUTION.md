# Merge do pull request

O pull request antigo chamado `Codex-generated pull request` ficou com conflitos porque foi aberto a partir de uma base anterior e adicionava arquivos que também passaram a existir na branch de destino.

## O que fazer

1. Não faça merge do PR antigo/conflitante.
2. Feche ou abandone o PR antigo.
3. Use o PR novo criado a partir da branch `rebuild/beauty-saas-conflict-free`.

Essa branch foi criada em cima da branch local de destino mais recente (`work`) e transforma os arquivos que apareciam como conflito em alterações normais sobre a base.

## Arquivos que estavam em conflito

- `.env.example`
- `.github/workflows/ci.yml`
- `AGENTS.md`
- `src/lib/beauty/authorization.ts`
- `src/lib/beauty/phone.ts`
- `src/lib/beauty/scheduling.ts`
- `src/pages/Dashboard.tsx`

## Estado esperado

No PR novo, esses arquivos não devem aparecer como add/add conflict. Se o GitHub ainda mostrar conflito, você provavelmente está olhando o PR antigo e não o PR novo.
