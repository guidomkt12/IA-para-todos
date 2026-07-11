-- Allow gestors to read user_permissions for their allowed clients
CREATE POLICY "Gestors can view permissions for allowed clients"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'gestor') 
  AND cliente_id IN (
    SELECT gc.cliente_id FROM public.gestor_clients gc WHERE gc.user_id = auth.uid()
  )
);