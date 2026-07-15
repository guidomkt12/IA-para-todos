import { supabase } from "@/integrations/supabase/client";
import { appointmentEnd } from "./scheduling";
import { normalizePhoneToE164 } from "./phone";

const db = supabase as any;

export async function getActiveOrganization() {
  const { data, error } = await db.from("organizations").select("*, organization_members!inner(role)").limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createOrganization(input: { name: string; slug: string; business_type: string; phone?: string; email?: string }) {
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) throw new Error("auth_required");
  const { data: organization, error } = await db.from("organizations").insert(input).select("*").single();
  if (error) throw error;
  const membership = { organization_id: organization.id, user_id: userResult.user.id, role: "owner", status: "active" };
  const { error: memberError } = await db.from("organization_members").insert(membership);
  if (memberError) throw memberError;
  await db.from("organization_settings").insert({ organization_id: organization.id });
  await db.from("onboarding_progress").insert({ organization_id: organization.id, current_step: "unidade", completed_steps: ["empresa"] });
  return organization;
}

export async function loadDashboardData(organizationId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const week = new Date(today);
  week.setDate(week.getDate() + 7);
  const [appointments, customers, conversations, inbound, outbound, services, professionals, connections, progress] = await Promise.all([
    db.from("appointments").select("*, services(name), professionals(display_name), customers(full_name)").eq("organization_id", organizationId).gte("start_at", today.toISOString()).lt("start_at", week.toISOString()).order("start_at"),
    db.from("customers").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
    db.from("conversations").select("*, customers(full_name, phone_e164)").eq("organization_id", organizationId).order("last_message_at", { ascending: false }).limit(20),
    db.from("messages").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("direction", "inbound"),
    db.from("messages").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("direction", "outbound"),
    db.from("services").select("*").eq("organization_id", organizationId).is("archived_at", null),
    db.from("professionals").select("*").eq("organization_id", organizationId).is("archived_at", null),
    db.from("channel_connections").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(1),
    db.from("onboarding_progress").select("*").eq("organization_id", organizationId).maybeSingle(),
  ]);
  for (const result of [appointments, customers, conversations, services, professionals, connections, progress]) {
    if (result.error) throw result.error;
  }
  return {
    appointments: appointments.data ?? [],
    customers: customers.data ?? [],
    conversations: conversations.data ?? [],
    messagesInbound: inbound.count ?? 0,
    messagesOutbound: outbound.count ?? 0,
    services: services.data ?? [],
    professionals: professionals.data ?? [],
    connection: connections.data?.[0],
    progress: progress.data,
  };
}

export async function createService(organizationId: string, input: { name: string; duration_minutes: number; price: number; category?: string }) {
  const { data, error } = await db.from("services").insert({ organization_id: organizationId, ...input }).select("*").single();
  if (error) throw error;
  return data;
}

export async function createProfessional(organizationId: string, input: { display_name: string; email?: string; phone?: string; service_ids?: string[] }) {
  const { data, error } = await db.from("professionals").insert({ organization_id: organizationId, display_name: input.display_name, email: input.email, phone: input.phone }).select("*").single();
  if (error) throw error;
  if (input.service_ids?.length) {
    await db.from("professional_services").insert(input.service_ids.map((service_id) => ({ organization_id: organizationId, professional_id: data.id, service_id })));
  }
  return data;
}

export async function createAvailability(organizationId: string, input: { professional_id: string; day_of_week: number; start_time: string; end_time: string; break_start_time?: string; break_end_time?: string }) {
  const { data, error } = await db.from("availability_rules").insert({ organization_id: organizationId, ...input }).select("*").single();
  if (error) throw error;
  return data;
}

export async function createCustomerFromPhone(organizationId: string, phone: string, name = "Cliente WhatsApp") {
  const phone_e164 = normalizePhoneToE164(phone);
  const { data, error } = await db.from("customers").upsert({ organization_id: organizationId, phone_e164, full_name: name, last_interaction_at: new Date().toISOString() }, { onConflict: "organization_id,phone_e164" }).select("*").single();
  if (error) throw error;
  return data;
}

export async function createAppointment(organizationId: string, input: { customer_id: string; professional_id: string; service_id: string; start_at: string; source?: string }) {
  const { data: service, error: serviceError } = await db.from("services").select("*").eq("organization_id", organizationId).eq("id", input.service_id).single();
  if (serviceError) throw serviceError;
  const { data, error } = await db.from("appointments").insert({ organization_id: organizationId, ...input, end_at: appointmentEnd(input.start_at, service), price_snapshot: service.price, duration_snapshot: service.duration_minutes, source: input.source ?? "dashboard" }).select("*").single();
  if (error) throw error;
  return data;
}

export async function takeoverConversation(organizationId: string, conversationId: string) {
  const { data: userResult } = await supabase.auth.getUser();
  const { data, error } = await db.from("conversations").update({ status: "human_active", ai_enabled: false, ai_paused_reason: "human_takeover", assigned_user_id: userResult.user?.id ?? null }).eq("organization_id", organizationId).eq("id", conversationId).select("*").single();
  if (error) throw error;
  return data;
}
