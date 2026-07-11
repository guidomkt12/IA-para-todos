import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Navigate, useNavigate } from "react-router-dom";
import {
  LogOut, Shield, UserPlus, Eye, Loader2,
  UsersRound, FileText, Clock, CreditCard, Settings, Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import logoDark from "@/assets/ontrigger-logo.png";
import logoWhite from "@/assets/ontrigger-logo-white.png";
import ScriptTemplatesManager from "@/components/admin/ScriptTemplatesManager";
import TeamManagement from "@/components/admin/TeamManagement";
import AdminTab from "@/components/dashboard/AdminTab";
import { n8nPost, PLANOS } from "@/lib/api";

const PLANOS_LIST = PLANOS.map(p => ({ plano_id: p.id, nome: p.nome }));

interface UserPermissionRow {
  id: string;
  user_id: string;
  cliente_id: string;
  cliente_nome: string | null;
  plano_id: string;
  status: string;
  trial_ends_at: string | null;
  access_contacts: boolean;
  access_cities: boolean;
  created_at: string;
}

interface MongoCliente {
  cliente_id: string;
  nome?: string;
  empresa?: string;
  email?: string;
  plano_id?: string;
  ativo?: boolean;
  trial_expires_at?: string;
  config?: { nicho?: string; limitePorNumero?: number; horarioAcionamento?: number; [k: string]: any };
}

async function fetchLastAccess(clienteId: string): Promise<string | null> {
  try {
    const data = await n8nPost("track-access", { cliente_id: clienteId, action: "get" });
    return data?.last_access || null;
  } catch {
    return null;
  }
}

function LastAccessBadge({ lastAccess }: { lastAccess: string | null | undefined }) {
  if (!lastAccess) {
    return <Badge variant="outline" className="text-muted-foreground border-muted text-[10px]">Nunca acessou</Badge>;
  }
  const date = new Date(lastAccess);
  if (isNaN(date.getTime())) {
    return <Badge variant="outline" className="text-muted-foreground border-muted text-[10px]">Nunca acessou</Badge>;
  }
  const diffMs = Date.now() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const label = formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  const colorClass = diffDays > 7
    ? "text-destructive border-destructive/30"
    : diffDays > 3
      ? "text-yellow-500 border-yellow-500/30"
      : "text-green-500 border-green-500/30";
  return (
    <div className="flex items-center gap-1.5">
      <Clock size={12} className={diffDays > 7 ? "text-destructive" : diffDays > 3 ? "text-yellow-500" : "text-green-500"} />
      <Badge variant="outline" className={`${colorClass} text-[10px]`}>{label}</Badge>
    </div>
  );
}

function gerarClienteIdDoEmail(email: string): string {
  if (!email || !email.includes("@")) return "";
  return email
    .split("@")[0]
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 20);
}

export default function Admin() {
  const { user, isAdmin, isGestor, allowedClients, loading: authLoading, signOut, setImpersonateClienteId } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissionRow[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; email: string | null }[]>([]);
  const [mongoClientes, setMongoClientes] = useState<MongoCliente[]>([]);
  const [lastAccessMap, setLastAccessMap] = useState<Record<string, string | null>>({});

  // Config modal state
  const [configOpen, setConfigOpen] = useState(false);
  const [configCliente, setConfigCliente] = useState<string | null>(null);
  const [configUserId, setConfigUserId] = useState<string | null>(null);
  const [cfgPlano, setCfgPlano] = useState("trial");
  const [cfgAtivo, setCfgAtivo] = useState(true);
  const [cfgTrialExpires, setCfgTrialExpires] = useState("");
  const [cfgNicho, setCfgNicho] = useState("");
  const [cfgLimite, setCfgLimite] = useState(30);
  const [cfgHorario, setCfgHorario] = useState(8);
  const [cfgEmail, setCfgEmail] = useState("");
  const [cfgSaving, setCfgSaving] = useState(false);

  // Vincular existing user modal state
  const [vincularOpen, setVincularOpen] = useState(false);
  const [vincularCliente, setVincularCliente] = useState<string | null>(null);
  const [vincularEmail, setVincularEmail] = useState("");
  const [vincularNome, setVincularNome] = useState("");
  const [vincularPlano, setVincularPlano] = useState("trial");
  const [vincularSaving, setVincularSaving] = useState(false);

  // New client modal state
  const [novoOpen, setNovoOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoSenha, setNovoSenha] = useState("");
  const [novoWhatsapp, setNovoWhatsapp] = useState("");
  const [novoPlano, setNovoPlano] = useState("trial");
  const [novoCriando, setNovoCriando] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const logo = theme === "dark" ? logoWhite : logoDark;

  const clienteIdPreview = gerarClienteIdDoEmail(novoEmail);

  const refreshMongoClientes = useCallback(() => {
    n8nPost("admin", { acao: "listar_clientes" })
      .then((d) => setMongoClientes(d.clientes || []))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    const [permsRes, profsRes] = await Promise.all([
      supabase.from("user_permissions").select("*"),
      supabase.from("profiles").select("user_id, email"),
    ]);
    setPermissions(permsRes.data || []);
    setProfiles(profsRes.data || []);
  }, []);

  useEffect(() => {
    if (!authLoading && (isAdmin || isGestor)) {
      fetchData();
      refreshMongoClientes();
    }
  }, [authLoading, isAdmin, isGestor, fetchData, refreshMongoClientes]);

  const getEmailForUserId = useCallback(
    (userId: string) => profiles.find((p) => p.user_id === userId)?.email || "—",
    [profiles]
  );

  const allClients = useMemo(() => {
    const set = new Set(permissions.map((p) => p.cliente_id).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [permissions]);

  const clientFallback = useMemo(() => permissions.map((p) => ({
    cliente_id: p.cliente_id,
    nome: p.cliente_nome || getEmailForUserId(p.user_id),
    plano_id: p.plano_id,
    ativo: p.status !== 'paused' && p.status !== 'cancelled',
    config: {},
  })), [permissions, getEmailForUserId]);

  const visibleClients = useMemo(() => {
    // Include MongoDB clients that may not have a user_permissions row yet
    const fromMongo = mongoClientes.map(c => c.cliente_id).filter(Boolean) as string[];
    const all = [...new Set([...allClients, ...fromMongo])].sort((a, b) => a.localeCompare(b));
    if (isAdmin) return all;
    if (isGestor) return all.filter((cid) => allowedClients.includes(cid));
    return [];
  }, [isAdmin, isGestor, allClients, mongoClientes, allowedClients]);

  // Unified client rows: Supabase data as primary, MongoDB as fallback for display name
  const clientRows = useMemo(() =>
    visibleClients.map((cid) => {
      const perm = permissions.find((p) => p.cliente_id === cid);
      const mongo = mongoClientes.find((c) => c.cliente_id === cid);
      const email = perm ? getEmailForUserId(perm.user_id) : "—";
      const nome = mongo?.nome || mongo?.empresa || perm?.cliente_nome || (email !== "—" ? email.split("@")[0] : cid);
      const plano = mongo?.plano_id || perm?.plano_id || "trial";
      const ativo = perm ? perm.status !== 'paused' && perm.status !== 'cancelled' : true;
      return { cid, perm, mongo, email, nome, plano, ativo };
    }),
    [visibleClients, permissions, mongoClientes, getEmailForUserId]
  );

  useEffect(() => {
    if (!visibleClients.length) return;
    visibleClients.forEach((cid) => {
      if (lastAccessMap[cid] !== undefined) return;
      fetchLastAccess(cid).then((la) => {
        setLastAccessMap((prev) => ({ ...prev, [cid]: la }));
      });
    });
  }, [visibleClients, lastAccessMap]);

  const handleOpenConfig = (cid: string) => {
    const perm = permissions.find((p) => p.cliente_id === cid);
    const mongo = mongoClientes.find((c) => c.cliente_id === cid);
    setConfigCliente(cid);
    setConfigUserId(perm?.user_id || null);
    setCfgEmail(perm ? getEmailForUserId(perm.user_id) : "");
    setCfgPlano(mongo?.plano_id || perm?.plano_id || "trial");
    setCfgAtivo(perm ? perm.status !== 'paused' && perm.status !== 'cancelled' : true);
    setCfgTrialExpires(perm?.trial_ends_at ? perm.trial_ends_at.slice(0, 16) : "");
    setCfgNicho(mongo?.config?.nicho || "");
    setCfgLimite(mongo?.config?.limitePorNumero ?? 30);
    setCfgHorario(mongo?.config?.horarioAcionamento ?? 8);
    setConfigOpen(true);
  };

  const handleVincular = async () => {
    if (!vincularCliente || !vincularEmail) return;
    setVincularSaving(true);
    try {
      const profile = profiles.find((p) => p.email === vincularEmail);
      if (!profile) {
        toast({ title: "Usuário não encontrado", description: "Nenhuma conta com este e-mail existe no sistema.", variant: "destructive" });
        return;
      }
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const existingPerm = permissions.find((p) => p.user_id === profile.user_id);
      if (existingPerm) {
        const { error } = await supabase.from("user_permissions")
          .update({ cliente_id: vincularCliente, cliente_nome: vincularNome || existingPerm.cliente_nome })
          .eq("user_id", profile.user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_permissions").insert({
          user_id: profile.user_id,
          cliente_id: vincularCliente,
          cliente_nome: vincularNome || null,
          plano_id: vincularPlano,
          status: vincularPlano === "trial" ? "trial" : "active",
          trial_ends_at: vincularPlano === "trial" ? trialEndsAt : null,
          access_contacts: true,
          access_cities: true,
        });
        if (error) throw error;
      }
      toast({ title: "Conta vinculada!", description: `${vincularEmail} → ${vincularCliente}` });
      setVincularOpen(false);
      setVincularEmail(""); setVincularNome(""); setVincularPlano("trial");
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro ao vincular", description: err.message, variant: "destructive" });
    } finally {
      setVincularSaving(false);
    }
  };

  const handleSalvarConfig = async () => {
    if (!configCliente || !configUserId) return;
    setCfgSaving(true);
    try {
      let targetUserId = configUserId;

      // Re-link to a different user if email changed
      const currentEmail = getEmailForUserId(configUserId);
      if (cfgEmail && cfgEmail !== currentEmail && cfgEmail !== "—") {
        const profile = profiles.find((p) => p.email === cfgEmail);
        if (!profile) {
          toast({ title: "E-mail não encontrado", description: "Nenhuma conta com este e-mail no sistema.", variant: "destructive" });
          setCfgSaving(false);
          return;
        }
        // Update the user_id in user_permissions to point to the correct auth user
        const { error: relinkErr } = await supabase
          .from("user_permissions")
          .update({ user_id: profile.user_id })
          .eq("user_id", configUserId);
        if (relinkErr) throw relinkErr;
        targetUserId = profile.user_id;
      }

      const newStatus = cfgAtivo ? (cfgPlano === 'trial' ? 'trial' : 'active') : 'paused';
      const { error: supaErr } = await supabase
        .from("user_permissions")
        .update({
          plano_id: cfgPlano,
          status: newStatus,
          trial_ends_at: cfgTrialExpires ? new Date(cfgTrialExpires).toISOString() : null,
        })
        .eq("user_id", targetUserId);
      if (supaErr) throw supaErr;

      // Sync operational config to MongoDB via n8n
      await n8nPost("admin", {
        acao: "atualizar_cliente_completo",
        cliente_id: configCliente,
        plano_id: cfgPlano,
        ativo: cfgAtivo,
        trial_expires_at: cfgTrialExpires ? new Date(cfgTrialExpires).toISOString() : undefined,
        config: { nicho: cfgNicho, limitePorNumero: cfgLimite, horarioAcionamento: cfgHorario },
      }).catch(() => {}); // non-blocking

      toast({ title: "Configurações salvas" });
      setConfigOpen(false);
      fetchData();
      refreshMongoClientes();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setCfgSaving(false);
    }
  };

  const handleCriarCliente = async () => {
    if (!novoNome || !novoEmail || !novoSenha) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (novoSenha.length < 6) {
      toast({ title: "Senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    setNovoCriando(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: novoEmail,
        password: novoSenha,
        options: { data: { full_name: novoNome } },
      });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Erro ao criar usuário no Auth");

      const clienteId = gerarClienteIdDoEmail(novoEmail) + "_" + Date.now().toString().slice(-6);
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error: permError } = await supabase.from("user_permissions").insert({
        user_id: userId,
        cliente_id: clienteId,
        cliente_nome: novoNome,
        plano_id: novoPlano,
        status: novoPlano === "trial" ? "trial" : "active",
        trial_ends_at: novoPlano === "trial" ? trialEndsAt : null,
        access_contacts: true,
        access_cities: true,
      });
      if (permError) throw permError;

      await n8nPost("admin", {
        acao: "criar_cliente",
        cliente_id: clienteId,
        nome: novoNome,
        whatsapp: novoWhatsapp,
        email: novoEmail,
        plano_id: novoPlano,
      }).catch(() => {});

      toast({ title: "Cliente criado!", description: `${novoEmail} → ${clienteId}` });
      setNovoOpen(false);
      setNovoNome(""); setNovoEmail(""); setNovoSenha(""); setNovoWhatsapp(""); setNovoPlano("trial");
      setTimeout(() => { fetchData(); refreshMongoClientes(); }, 1200);
    } catch (err: any) {
      toast({ title: "Erro ao criar cliente", description: err.message, variant: "destructive" });
    } finally {
      setNovoCriando(false);
    }
  };

  const handleViewAsClient = (clienteId: string) => {
    if (isGestor && !allowedClients.includes(clienteId)) {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar este cliente.", variant: "destructive" });
      return;
    }
    setImpersonateClienteId(clienteId);
    navigate("/dashboard");
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin && !isGestor) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="OnTrigger" className="h-6" />
            <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">{isAdmin ? "Admin" : "Gestor"}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="text-muted-foreground hover:text-foreground" />
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground gap-2">
              Dashboard
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={signOut}>
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className={`grid w-full max-w-3xl ${isAdmin ? "grid-cols-4" : "grid-cols-1"}`}>
            <TabsTrigger value="clients" className="gap-2"><Shield size={14} /> Clientes</TabsTrigger>
            {isAdmin && <TabsTrigger value="team" className="gap-2"><UsersRound size={14} /> Equipe</TabsTrigger>}
            {isAdmin && <TabsTrigger value="plans" className="gap-2"><CreditCard size={14} /> Planos</TabsTrigger>}
            {isAdmin && <TabsTrigger value="templates" className="gap-2"><FileText size={14} /> Templates</TabsTrigger>}
          </TabsList>

          {/* ── Clientes tab (merged Clientes + Usuários) ── */}
          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Shield size={18} /> Clientes</CardTitle>
                    <CardDescription>
                      {isGestor ? "Clientes liberados para seu acesso" : `${clientRows.length} cliente${clientRows.length !== 1 ? "s" : ""} cadastrado${clientRows.length !== 1 ? "s" : ""}`}
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <Button onClick={() => setNovoOpen(true)} className="gap-2">
                      <Plus size={14} /> Novo Cliente
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {clientRows.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {isGestor ? "Nenhum cliente liberado para sua conta" : "Nenhum cliente cadastrado"}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Cliente ID</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Trial até</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Último acesso</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientRows.map(({ cid, perm, nome, email, plano, ativo }) => (
                          <TableRow key={cid}>
                            <TableCell className="font-medium max-w-[130px] truncate">{nome}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                              {perm ? email : <span className="text-amber-500 text-xs italic">sem conta</span>}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{cid}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{plano}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {perm?.trial_ends_at
                                ? new Date(perm.trial_ends_at).toLocaleDateString("pt-BR")
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {perm ? (
                                <Badge
                                  variant={ativo ? "default" : "outline"}
                                  className={ativo ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs" : "text-xs"}
                                >
                                  {perm.status === "trial" ? "Trial" : ativo ? "Ativo" : "Inativo"}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">Sem acesso</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <LastAccessBadge lastAccess={lastAccessMap[cid]} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {isAdmin && (
                                  perm ? (
                                    <Button
                                      size="sm" variant="ghost"
                                      className="h-7 gap-1 text-xs"
                                      onClick={() => handleOpenConfig(cid)}
                                    >
                                      <Settings size={12} /> Configurar
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm" variant="ghost"
                                      className="h-7 gap-1 text-xs text-amber-500 hover:text-amber-400"
                                      onClick={() => { setVincularCliente(cid); setVincularOpen(true); }}
                                    >
                                      <UserPlus size={12} /> Vincular
                                    </Button>
                                  )
                                )}
                                <Button
                                  size="sm" variant="outline"
                                  className="h-7 gap-1 text-xs"
                                  onClick={() => handleViewAsClient(cid)}
                                >
                                  <Eye size={12} /> Ver Painel
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="team">
              <TeamManagement allClients={allClients} />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="plans">
              <AdminTab clientesFallback={clientFallback} />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="templates">
              <ScriptTemplatesManager />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* ── Config Sheet ── */}
      <Sheet open={configOpen} onOpenChange={setConfigOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings size={16} /> Configurar: <span className="font-mono text-sm">{configCliente}</span>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label className="text-xs font-medium">E-mail do usuário vinculado</Label>
              <Input
                type="email"
                value={cfgEmail}
                onChange={(e) => setCfgEmail(e.target.value)}
                placeholder="usuario@email.com"
                className="h-9 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">Altere para re-vincular este cliente a outra conta.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Plano</Label>
              <Select value={cfgPlano} onValueChange={setCfgPlano}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANOS_LIST.map((p) => (
                    <SelectItem key={p.plano_id} value={p.plano_id} className="text-sm">{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Trial expira em</Label>
              <Input
                type="datetime-local"
                value={cfgTrialExpires}
                onChange={(e) => setCfgTrialExpires(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <Label className="text-sm font-medium">Conta ativa</Label>
              <Switch checked={cfgAtivo} onCheckedChange={setCfgAtivo} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Nicho</Label>
              <Input
                value={cfgNicho}
                onChange={(e) => setCfgNicho(e.target.value)}
                placeholder="Ex: Psicólogos, Nutricionistas..."
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Limite por número/dia</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={cfgLimite}
                onChange={(e) => setCfgLimite(Number(e.target.value))}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Horário de acionamento</Label>
              <Select value={String(cfgHorario)} onValueChange={(v) => setCfgHorario(Number(v))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[6, 7, 8, 9, 10, 11, 12].map((h) => (
                    <SelectItem key={h} value={String(h)} className="text-sm">
                      {String(h).padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSalvarConfig} disabled={cfgSaving} className="w-full">
              {cfgSaving ? <Loader2 size={15} className="animate-spin mr-2" /> : null}
              Salvar configurações
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Novo Cliente Dialog ── */}
      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={16} /> Novo Cliente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome completo *</Label>
              <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome do responsável" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail *</Label>
              <Input
                type="email"
                value={novoEmail}
                onChange={(e) => setNovoEmail(e.target.value)}
                placeholder="usuario@email.com"
                className="h-9 text-sm"
              />
              {clienteIdPreview && (
                <p className="text-[11px] text-muted-foreground">
                  Cliente ID gerado: <span className="font-mono text-foreground">{clienteIdPreview}_<span className="opacity-40">XXXXXX</span></span>
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Senha temporária *</Label>
              <Input type="password" value={novoSenha} onChange={(e) => setNovoSenha(e.target.value)} placeholder="Mínimo 6 caracteres" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">WhatsApp</Label>
              <Input value={novoWhatsapp} onChange={(e) => setNovoWhatsapp(e.target.value)} placeholder="5531999999999" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Plano inicial</Label>
              <Select value={novoPlano} onValueChange={setNovoPlano}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANOS_LIST.map((p) => (
                    <SelectItem key={p.plano_id} value={p.plano_id} className="text-sm">{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoOpen(false)}>Cancelar</Button>
            <Button onClick={handleCriarCliente} disabled={novoCriando} className="gap-2">
              {novoCriando ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Criar cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Vincular Conta Dialog ── */}
      <Dialog open={vincularOpen} onOpenChange={setVincularOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={16} /> Vincular conta: <span className="font-mono text-sm">{vincularCliente}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Informe o e-mail de um usuário já cadastrado no sistema para vinculá-lo a este cliente.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail do usuário *</Label>
              <Input
                type="email"
                value={vincularEmail}
                onChange={(e) => setVincularEmail(e.target.value)}
                placeholder="usuario@email.com"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do cliente (opcional)</Label>
              <Input value={vincularNome} onChange={(e) => setVincularNome(e.target.value)} placeholder="Nome" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Plano</Label>
              <Select value={vincularPlano} onValueChange={setVincularPlano}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANOS_LIST.map((p) => (
                    <SelectItem key={p.plano_id} value={p.plano_id} className="text-sm">{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVincularOpen(false)}>Cancelar</Button>
            <Button onClick={handleVincular} disabled={vincularSaving} className="gap-2">
              {vincularSaving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
