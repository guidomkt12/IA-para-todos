import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace("Bearer ", "");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) return json({ error: "auth_required" }, 401);

  const payload = await req.json().catch(() => ({}));
  const organizationId = String(payload.organization_id || "");
  if (!organizationId) return json({ error: "organization_required" }, 400);

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("organization_id", organizationId)
    .eq("user_id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) return json({ error: "forbidden" }, 403);

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id,name,slug,business_type,phone,email,status,timezone,locale,created_at,updated_at")
    .eq("id", organizationId)
    .single();
  if (orgError) return json({ error: orgError.message }, 500);

  const webhookUrl = Deno.env.get("N8N_MONGO_USER_SYNC_WEBHOOK_URL");
  if (!webhookUrl) return json({ error: "mongo_sync_not_configured" }, 503);

  const syncBody = {
    event: "organization_user_upsert",
    idempotency_key: `${organizationId}:${userData.user.id}:profile`,
    organization,
    user: {
      id: userData.user.id,
      email: userData.user.email,
      role: membership.role,
      last_sign_in_at: userData.user.last_sign_in_at,
      created_at: userData.user.created_at,
    },
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": Deno.env.get("N8N_SHARED_SECRET") ?? "",
    },
    body: JSON.stringify(syncBody),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) return json({ error: "n8n_mongo_sync_failed", details: result }, 502);
  return json({ ok: true, result });
});
