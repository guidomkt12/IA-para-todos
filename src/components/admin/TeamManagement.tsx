import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Pencil, Trash2, Loader2, UsersRound } from "lucide-react";

interface GestorRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
  allowed_clients: string[];
}

interface Props {
  allClients: string[];
}

export default function TeamManagement({ allClients }: Props) {
  const { toast } = useToast();
  const [gestors, setGestors] = useState<GestorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formClients, setFormClients] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchGestors = useCallback(async () => {
    setLoading(true);
    try {
      // Get all users with gestor role
      const { data: gestorRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "gestor");

      if (!gestorRoles?.length) {
        setGestors([]);
        setLoading(false);
        return;
      }

      const userIds = gestorRoles.map((r) => r.user_id);

      // Fetch profiles and client assignments in parallel
      const [profilesRes, clientsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, email, display_name").in("user_id", userIds),
        supabase.from("gestor_clients").select("user_id, cliente_id").in("user_id", userIds),
      ]);

      const profiles = profilesRes.data || [];
      const clients = clientsRes.data || [];

      const rows: GestorRow[] = userIds.map((uid) => {
        const profile = profiles.find((p) => p.user_id === uid);
        const userClients = clients.filter((c) => c.user_id === uid).map((c) => c.cliente_id);
        return {
          user_id: uid,
          email: profile?.email || null,
          display_name: profile?.display_name || null,
          allowed_clients: userClients,
        };
      });

      setGestors(rows);
    } catch {
      toast({ title: "Erro ao carregar gestores", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGestors();
  }, [fetchGestors]);

  const resetForm = () => {
    setEditingUserId(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormClients([]);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (gestor: GestorRow) => {
    setEditingUserId(gestor.user_id);
    setFormName(gestor.display_name || "");
    setFormEmail(gestor.email || "");
    setFormPassword("");
    setFormClients(gestor.allowed_clients);
    setDialogOpen(true);
  };

  const toggleClient = (clienteId: string) => {
    setFormClients((prev) =>
      prev.includes(clienteId) ? prev.filter((c) => c !== clienteId) : [...prev, clienteId]
    );
  };

  const handleSave = async () => {
    if (!formEmail) return;
    setSaving(true);

    try {
      let userId = editingUserId;

      if (!editingUserId) {
        // Create new user via edge function
        if (!formPassword || formPassword.length < 6) {
          toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
          setSaving(false);
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ email: formEmail, password: formPassword }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        userId = result.user.id;

        // Assign gestor role
        await supabase.from("user_roles").insert({ user_id: userId, role: "gestor" as any });

        // Update display_name in profiles
        if (formName) {
          await supabase.from("profiles").update({ display_name: formName }).eq("user_id", userId);
        }
      } else {
        // Update display_name
        if (formName) {
          await supabase.from("profiles").update({ display_name: formName }).eq("user_id", userId);
        }
      }

      if (!userId) throw new Error("Falha ao obter ID do usuário");

      // Sync client assignments: delete all then insert new
      await supabase.from("gestor_clients").delete().eq("user_id", userId);
      if (formClients.length > 0) {
        const rows = formClients.map((cid) => ({ user_id: userId!, cliente_id: cid }));
        const { error } = await supabase.from("gestor_clients").insert(rows);
        if (error) throw error;
      }

      toast({ title: editingUserId ? "Gestor atualizado" : "Gestor criado com sucesso" });
      setDialogOpen(false);
      resetForm();
      fetchGestors();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este gestor?")) return;
    try {
      await Promise.all([
        supabase.from("gestor_clients").delete().eq("user_id", userId),
        supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "gestor" as any),
      ]);
      toast({ title: "Gestor removido" });
      fetchGestors();
    } catch (err: any) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><UsersRound size={18} /> Gestão de Equipe / Acessos</CardTitle>
            <CardDescription>Gerencie gestores e seus acessos a clientes</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openCreate}><UserPlus size={14} /> Adicionar Gestor</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingUserId ? "Editar Gestor" : "Novo Gestor"}</DialogTitle>
                <DialogDescription>
                  {editingUserId ? "Atualize os dados e clientes liberados" : "Crie um novo gestor e selecione os clientes que ele poderá acessar"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input placeholder="Nome do gestor" value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    placeholder="gestor@email.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    disabled={!!editingUserId}
                  />
                </div>
                {!editingUserId && (
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <Input type="password" placeholder="Mínimo 6 caracteres" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Clientes Liberados</Label>
                  {allClients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado no sistema</p>
                  ) : (
                    <div className="border border-border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                      {allClients.map((cid) => (
                        <label key={cid} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                          <Checkbox
                            checked={formClients.includes(cid)}
                            onCheckedChange={() => toggleClient(cid)}
                          />
                          <span className="text-sm font-mono">{cid}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <><Loader2 size={14} className="animate-spin mr-2" /> Salvando...</> : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
        ) : gestors.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum gestor cadastrado</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Clientes Liberados</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gestors.map((g) => (
                <TableRow key={g.user_id}>
                  <TableCell>{g.display_name || "—"}</TableCell>
                  <TableCell>{g.email || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {g.allowed_clients.length === 0 ? (
                        <span className="text-muted-foreground text-sm">Nenhum</span>
                      ) : (
                        g.allowed_clients.map((cid) => (
                          <Badge key={cid} variant="secondary" className="font-mono text-xs">{cid}</Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(g)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(g.user_id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
