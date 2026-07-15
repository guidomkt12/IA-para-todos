import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Action = "create" | "status" | "pairing" | "configure_webhook" | "disconnect" | "delete";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const auth = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
  if (!userData.user) return json({ error: "auth_required" }, 401);

  const payload = await req.json().catch(() => ({}));
  const action = payload.action as Action;
  const { data: member } = await supabase.from("organization_members").select("organization_id, role").eq("user_id", userData.user.id).eq("status", "active").limit(1).maybeSingle();
  if (!member) return json({ error: "organization_required" }, 403);

  const n8nUrl = Deno.env.get("N8N_UAZAPI_WEBHOOK_URL");
  if (!n8nUrl) return json({ error: "provider_not_configured" }, 503);

  const providerResponse = await fetch(n8nUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": Deno.env.get("N8N_SHARED_SECRET") ?? "" },
    body: JSON.stringify({ action, organization_id: member.organization_id, instance_name: payload.instance_name }),
  });
  const providerPayload = await providerResponse.json().catch(() => ({}));
  if (!providerResponse.ok) return json({ error: "provider_error", details: providerPayload }, 502);

  if (action === "create") {
    await supabase.from("channel_connections").upsert({
      organization_id: member.organization_id,
      provider: "n8n_uazapi",
      name: payload.instance_name ?? "WhatsApp",
      external_instance_id: providerPayload.instanceId,
      status: "pairing",
      webhook_secret_encrypted: providerPayload.webhookSecret ? "managed-server-side" : null,
    }, { onConflict: "organization_id,provider,external_instance_id" });
  }

  return json({ ...providerPayload, organizationId: member.organization_id });
});
