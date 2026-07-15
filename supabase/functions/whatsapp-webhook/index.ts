import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-webhook-secret" };
const digits = (value: string) => value.replace(/\D/g, "");
const e164 = (value: string) => value.startsWith("+") ? `+${digits(value)}` : `+55${digits(value)}`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  const connectionId = url.pathname.split("/").filter(Boolean).pop();
  if (!connectionId) return json({ error: "connection_required" }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: connection } = await supabase.from("channel_connections").select("*").eq("id", connectionId).single();
  if (!connection) return json({ error: "connection_not_found" }, 404);

  const expected = Deno.env.get("WEBHOOK_SIGNING_SECRET") ?? "";
  if (expected && req.headers.get("x-webhook-secret") !== expected) return json({ error: "unauthorized" }, 401);

  const payload = await req.json().catch(() => ({}));
  const eventId = payload.eventId ?? payload.id ?? payload.message?.id;
  const messageId = payload.messageId ?? payload.message?.id ?? eventId;
  if (!eventId || !messageId) return json({ error: "invalid_payload" }, 400);

  const insertedEvent = await supabase.from("webhook_events").insert({ organization_id: connection.organization_id, channel_connection_id: connection.id, provider: connection.provider, external_event_id: eventId, event_type: "message", payload }).select("id").single();
  if (insertedEvent.error?.code === "23505") return json({ duplicate: true });
  if (insertedEvent.error) return json({ error: insertedEvent.error.message }, 500);

  const from = e164(payload.from ?? payload.message?.from ?? "");
  const text = payload.text ?? payload.message?.text ?? "";
  const { data: customer } = await supabase.from("customers").upsert({ organization_id: connection.organization_id, phone_e164: from, full_name: payload.name ?? "Cliente WhatsApp", last_interaction_at: new Date().toISOString() }, { onConflict: "organization_id,phone_e164" }).select("*").single();
  const { data: conversation } = await supabase.from("conversations").upsert({ organization_id: connection.organization_id, channel_connection_id: connection.id, customer_id: customer.id, status: "ai_active", ai_enabled: true, last_message_at: new Date().toISOString(), last_inbound_at: new Date().toISOString(), unread_count: 1 }).select("*").single();

  await supabase.from("messages").insert({ organization_id: connection.organization_id, conversation_id: conversation.id, customer_id: customer.id, channel_connection_id: connection.id, provider_message_id: messageId, provider_event_id: eventId, direction: "inbound", sender_type: "customer", message_type: "text", text_content: text, raw_metadata: payload });
  await supabase.from("webhook_events").update({ processing_status: "processed", processed_at: new Date().toISOString() }).eq("id", insertedEvent.data.id);
  return json({ ok: true, conversationId: conversation.id });
});
