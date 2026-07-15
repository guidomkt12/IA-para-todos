# Domínio do SaaS de beleza

Entidades centrais: `organizations`, `organization_members`, `locations`, `services`, `professionals`, `professional_services`, `availability_rules`, `customers`, `conversations`, `messages`, `appointments`, `ai_settings`, `channel_connections`, `webhook_events` e `audit_logs`.

O fluxo vertical obrigatório é: criar organização, cadastrar serviço, cadastrar profissional, definir disponibilidade, conectar provider mock, simular mensagem, criar cliente/conversa, IA consulta dados reais, agenda horário, exibe no CRM/agenda e permite takeover humano.

Regras críticas: preço e duração vêm de `services`; horários vêm de `availability_rules` e conflitos de `appointments`; telefone é normalizado para E.164; todo dado operacional é isolado por `organization_id`.
