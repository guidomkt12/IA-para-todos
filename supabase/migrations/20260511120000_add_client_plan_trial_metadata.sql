-- Add client account metadata used by the admin panel, trial period and plan enforcement.
ALTER TABLE public.user_permissions
  ADD COLUMN IF NOT EXISTS cliente_nome TEXT,
  ADD COLUMN IF NOT EXISTS nicho TEXT,
  ADD COLUMN IF NOT EXISTS plano_id TEXT NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS trial_disparos_limit INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS disparos_limit INTEGER,
  ADD COLUMN IF NOT EXISTS n8n_synced_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.user_permissions
  ALTER COLUMN access_contacts SET DEFAULT true,
  ALTER COLUMN access_cities SET DEFAULT true;

UPDATE public.user_permissions
SET access_contacts = true,
    access_cities = true,
    plano_id = COALESCE(NULLIF(plano_id, ''), 'trial'),
    status = COALESCE(NULLIF(status, ''), 'trial'),
    trial_starts_at = COALESCE(trial_starts_at, created_at, now()),
    trial_ends_at = COALESCE(trial_ends_at, COALESCE(created_at, now()) + interval '7 days'),
    trial_disparos_limit = COALESCE(trial_disparos_limit, 100);

ALTER TABLE public.user_permissions
  ADD CONSTRAINT user_permissions_status_check
  CHECK (status IN ('trial', 'active', 'paused', 'cancelled'));
