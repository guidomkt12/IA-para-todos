import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_WEBHOOK_URL = Deno.env.get("N8N_ADMIN_WEBHOOK_URL") ?? "https://n8n.guinevesapi.xyz/webhook/admin";
const DEFAULT_TRIAL_DAYS = 7;
const DEFAULT_TRIAL_DISPAROS_LIMIT = 100;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeClienteId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Não autorizado" }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) return json({ error: "Acesso restrito a administradores" }, 403);

    const payload = await req.json();
    const email = String(payload.email ?? "").trim().toLowerCase();
    const password = String(payload.password ?? "");
    const clienteNome = String(payload.cliente_nome ?? "").trim();
    const clienteId = normalizeClienteId(String(payload.cliente_id || clienteNome || email.split("@")[0]));
    const nicho = String(payload.nicho ?? "").trim();
    const planoId = String(payload.plano_id ?? "trial").trim() || "trial";
    const trialDays = Number(payload.trial_days ?? DEFAULT_TRIAL_DAYS);
    const trialDisparosLimit = Number(payload.trial_disparos_limit ?? DEFAULT_TRIAL_DISPAROS_LIMIT);
    const disparosLimit = payload.disparos_limit === undefined || payload.disparos_limit === null || payload.disparos_limit === ""
      ? null
      : Number(payload.disparos_limit);

    if (!email || !password || !clienteId || !nicho) {
      return json({ error: "E-mail, senha, cliente e nicho são obrigatórios" }, 400);
    }
    if (password.length < 6) return json({ error: "A senha precisa ter no mínimo 6 caracteres" }, 400);
    if (!Number.isFinite(trialDays) || trialDays < 0) return json({ error: "Período de teste inválido" }, 400);
    if (!Number.isFinite(trialDisparosLimit) || trialDisparosLimit < 0) return json({ error: "Limite de disparos do teste inválido" }, 400);
    if (disparosLimit !== null && (!Number.isFinite(disparosLimit) || disparosLimit < 0)) return json({ error: "Limite de disparos do plano inválido" }, 400);

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { cliente_id: clienteId, cliente_nome: clienteNome, nicho },
    });

    if (createError) return json({ error: createError.message }, 400);
    if (!newUser.user) return json({ error: "Usuário não retornado pelo Supabase" }, 500);

    const trialStartsAt = new Date();
    const trialEndsAt = new Date(trialStartsAt.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const permissionPayload = {
      user_id: newUser.user.id,
      cliente_id: clienteId,
      cliente_nome: clienteNome || null,
      nicho,
      plano_id: planoId,
      status: trialDays > 0 ? "trial" : "active",
      trial_starts_at: trialStartsAt.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      trial_disparos_limit: trialDisparosLimit,
      disparos_limit: disparosLimit,
      access_contacts: true,
      access_cities: true,
    };

    const { error: permissionError } = await adminClient
      .from("user_permissions")
      .upsert(permissionPayload, { onConflict: "user_id" });

    if (permissionError) {
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return json({ error: permissionError.message }, 400);
    }

    await adminClient.from("user_roles").upsert({ user_id: newUser.user.id, role: "user" }, { onConflict: "user_id,role" });

    let n8nSynced = false;
    let n8nError: string | null = null;
    try {
      const n8nResponse = await fetch(ADMIN_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "criar_cliente",
          origem: "supabase_edge_create_user",
          email,
          ...permissionPayload,
        }),
      });
      n8nSynced = n8nResponse.ok;
      if (!n8nResponse.ok) n8nError = await n8nResponse.text();
      if (n8nResponse.ok) {
        await adminClient
          .from("user_permissions")
          .update({ n8n_synced_at: new Date().toISOString() })
          .eq("user_id", newUser.user.id);
      }
    } catch (error) {
      n8nError = error instanceof Error ? error.message : "Erro ao sincronizar n8n";
    }

    return json({
      user: { id: newUser.user.id, email: newUser.user.email },
      cliente: permissionPayload,
      n8n_synced: n8nSynced,
      n8n_error: n8nError,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Erro inesperado" }, 500);
  }
});
