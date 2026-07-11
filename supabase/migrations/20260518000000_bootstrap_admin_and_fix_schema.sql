-- Bootstrap: allow any authenticated user to insert their own role ONCE
-- (only if no admin exists yet, making this safe)
CREATE OR REPLACE FUNCTION public.bootstrap_admin(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only runs if no admin exists at all (first-time setup)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- Grant execute to authenticated users (only works when no admin exists)
GRANT EXECUTE ON FUNCTION public.bootstrap_admin(UUID) TO authenticated;
