-- Beauty SaaS foundation: organization-scoped schema for CRM, agenda, inbox and AI.
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TYPE public.organization_role AS ENUM ('platform_admin','owner','admin','receptionist','professional','viewer');
CREATE TYPE public.business_type AS ENUM ('salon','barbershop','beauty_studio','independent_professional','other');
CREATE TYPE public.conversation_status AS ENUM ('ai_active','waiting_customer','waiting_human','human_active','resolved','blocked');

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  business_type public.business_type NOT NULL DEFAULT 'salon',
  document text,
  phone text,
  email text,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  locale text NOT NULL DEFAULT 'pt-BR',
  logo_url text,
  status text NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz,
  plan_id text,
  subscription_status text NOT NULL DEFAULT 'trialing',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.organization_role NOT NULL,
  status text NOT NULL DEFAULT 'active',
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE public.organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  booking_enabled boolean NOT NULL DEFAULT true, ai_enabled boolean NOT NULL DEFAULT true, human_handoff_enabled boolean NOT NULL DEFAULT true, reminders_enabled boolean NOT NULL DEFAULT true,
  default_appointment_interval integer NOT NULL DEFAULT 30, minimum_booking_notice_minutes integer NOT NULL DEFAULT 120, maximum_booking_days_ahead integer NOT NULL DEFAULT 30, cancellation_limit_hours integer NOT NULL DEFAULT 24,
  currency text NOT NULL DEFAULT 'BRL', timezone text NOT NULL DEFAULT 'America/Sao_Paulo', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.locations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, name text NOT NULL, address text, city text, state text, postal_code text, phone text, latitude numeric, longitude numeric, timezone text NOT NULL DEFAULT 'America/Sao_Paulo', active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.services (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, location_id uuid REFERENCES public.locations(id), name text NOT NULL, description text, category text, duration_minutes integer NOT NULL CHECK (duration_minutes > 0), buffer_before_minutes integer NOT NULL DEFAULT 0, buffer_after_minutes integer NOT NULL DEFAULT 0, price numeric(12,2) NOT NULL DEFAULT 0, promotional_price numeric(12,2), active boolean NOT NULL DEFAULT true, online_booking_enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz);
CREATE TABLE public.professionals (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, user_id uuid REFERENCES auth.users(id), display_name text NOT NULL, phone text, email text, bio text, avatar_url text, active boolean NOT NULL DEFAULT true, accepts_online_booking boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz);
CREATE TABLE public.professional_services (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE, service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE, custom_duration_minutes integer, custom_price numeric(12,2), active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (organization_id, professional_id, service_id));
CREATE TABLE public.availability_rules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE, location_id uuid REFERENCES public.locations(id), day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), start_time time NOT NULL, end_time time NOT NULL, break_start_time time, break_end_time time, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.schedule_exceptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, professional_id uuid REFERENCES public.professionals(id), location_id uuid REFERENCES public.locations(id), date date NOT NULL, start_time time, end_time time, exception_type text NOT NULL CHECK (exception_type IN ('available','unavailable','vacation','holiday','custom')), reason text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE public.customers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, full_name text NOT NULL, first_name text, last_name text, phone_e164 text NOT NULL, email text, birth_date date, gender text, preferred_professional_id uuid REFERENCES public.professionals(id), preferred_location_id uuid REFERENCES public.locations(id), source text NOT NULL DEFAULT 'whatsapp', status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','active','inactive','vip','at_risk','blocked')), notes_summary text, last_interaction_at timestamptz, last_appointment_at timestamptz, next_appointment_at timestamptz, total_appointments integer NOT NULL DEFAULT 0, completed_appointments integer NOT NULL DEFAULT 0, no_show_count integer NOT NULL DEFAULT 0, cancelled_count integer NOT NULL DEFAULT 0, estimated_lifetime_value numeric(12,2) NOT NULL DEFAULT 0, marketing_opt_in boolean NOT NULL DEFAULT false, marketing_opt_in_at timestamptz, marketing_opt_in_source text, do_not_contact boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz, UNIQUE (organization_id, phone_e164));
CREATE TABLE public.channel_connections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, provider text NOT NULL CHECK (provider IN ('mock','uazapi','meta_cloud_api')), name text NOT NULL, external_instance_id text, phone_number text, status text NOT NULL DEFAULT 'disconnected', credentials_encrypted text, webhook_secret_encrypted text, last_webhook_at timestamptz, last_success_at timestamptz, last_error_at timestamptz, last_error_message text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (organization_id, provider, external_instance_id));
CREATE TABLE public.conversations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, channel_connection_id uuid REFERENCES public.channel_connections(id), customer_id uuid NOT NULL REFERENCES public.customers(id), status public.conversation_status NOT NULL DEFAULT 'ai_active', assigned_user_id uuid REFERENCES auth.users(id), assigned_professional_id uuid REFERENCES public.professionals(id), ai_enabled boolean NOT NULL DEFAULT true, ai_paused_reason text, last_message_at timestamptz, last_inbound_at timestamptz, last_outbound_at timestamptz, unread_count integer NOT NULL DEFAULT 0, summary text, started_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE, customer_id uuid NOT NULL REFERENCES public.customers(id), channel_connection_id uuid REFERENCES public.channel_connections(id), provider_message_id text, provider_event_id text, direction text NOT NULL CHECK (direction IN ('inbound','outbound')), sender_type text NOT NULL CHECK (sender_type IN ('customer','ai','human','system')), message_type text NOT NULL DEFAULT 'text', text_content text, media_url text, media_mime_type text, media_filename text, reply_to_message_id uuid REFERENCES public.messages(id), status text, error_code text, error_message text, raw_metadata jsonb, sent_at timestamptz, delivered_at timestamptz, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (organization_id, provider_message_id));
CREATE TABLE public.appointments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, location_id uuid REFERENCES public.locations(id), customer_id uuid NOT NULL REFERENCES public.customers(id), professional_id uuid NOT NULL REFERENCES public.professionals(id), service_id uuid NOT NULL REFERENCES public.services(id), conversation_id uuid REFERENCES public.conversations(id), start_at timestamptz NOT NULL, end_at timestamptz NOT NULL, timezone text NOT NULL DEFAULT 'America/Sao_Paulo', status text NOT NULL DEFAULT 'pending', source text NOT NULL DEFAULT 'dashboard', price_snapshot numeric(12,2) NOT NULL, duration_snapshot integer NOT NULL, customer_notes text, internal_notes text, confirmation_status text NOT NULL DEFAULT 'not_requested', confirmed_at timestamptz, cancelled_at timestamptz, cancellation_reason text, completed_at timestamptz, no_show_at timestamptz, created_by_type text NOT NULL DEFAULT 'system', created_by_user_id uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), EXCLUDE USING gist (organization_id WITH =, professional_id WITH =, tstzrange(start_at, end_at, '[)') WITH &&) WHERE (status IN ('pending','confirmed','in_progress')));

CREATE TABLE public.webhook_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, channel_connection_id uuid REFERENCES public.channel_connections(id), provider text NOT NULL, external_event_id text NOT NULL, event_type text NOT NULL, payload jsonb NOT NULL, processing_status text NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0, last_error text, received_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (channel_connection_id, provider, external_event_id));
CREATE TABLE public.audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, actor_type text NOT NULL, actor_user_id uuid REFERENCES auth.users(id), action text NOT NULL, entity_type text NOT NULL, entity_id uuid, before_data jsonb, after_data jsonb, ip_address inet, user_agent text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.usage_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, event_type text NOT NULL, quantity integer NOT NULL DEFAULT 1, metadata jsonb, occurred_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now());

CREATE INDEX idx_messages_conversation_created ON public.messages (conversation_id, created_at DESC);
CREATE INDEX idx_conversations_org_last ON public.conversations (organization_id, last_message_at DESC);
CREATE INDEX idx_conversations_waiting_human ON public.conversations (organization_id, status) WHERE status = 'waiting_human';

CREATE OR REPLACE FUNCTION public.is_org_member(_organization_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = _organization_id AND m.user_id = auth.uid() AND m.status = 'active') OR public.has_role(auth.uid(), 'admin') $$;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY; ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY; ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY; ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY; ALTER TABLE public.services ENABLE ROW LEVEL SECURITY; ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY; ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY; ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY; ALTER TABLE public.schedule_exceptions ENABLE ROW LEVEL SECURITY; ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY; ALTER TABLE public.channel_connections ENABLE ROW LEVEL SECURITY; ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY; ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY; ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY; ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY; ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY; ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_read ON public.organizations FOR SELECT TO authenticated USING (public.is_org_member(id));
CREATE POLICY member_read ON public.organization_members FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY scoped_settings ON public.organization_settings FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY scoped_locations ON public.locations FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY scoped_services ON public.services FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY scoped_professionals ON public.professionals FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY scoped_professional_services ON public.professional_services FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY scoped_availability ON public.availability_rules FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY scoped_exceptions ON public.schedule_exceptions FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY scoped_customers ON public.customers FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY scoped_connections ON public.channel_connections FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY scoped_conversations ON public.conversations FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY scoped_messages ON public.messages FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY scoped_appointments ON public.appointments FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY scoped_webhooks ON public.webhook_events FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY scoped_audit ON public.audit_logs FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY scoped_usage ON public.usage_events FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
