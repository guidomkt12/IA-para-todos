-- Add 'gestor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor';

-- Create gestor_clients mapping table
CREATE TABLE public.gestor_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, cliente_id)
);

ALTER TABLE public.gestor_clients ENABLE ROW LEVEL SECURITY;

-- Admins can manage gestor_clients
CREATE POLICY "Admins can manage gestor_clients"
ON public.gestor_clients
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Gestors can view their own client assignments
CREATE POLICY "Gestors can view own client assignments"
ON public.gestor_clients
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);