import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Plus, Users, CreditCard, Save, Shield, Settings } from "lucide-react";
import DisparosTab from "@/components/dashboard/DisparosTab";
import IATab from "@/components/dashboard/IATab";
import { n8nPost } from "@/lib/api";

type Plano = { plano_id: string; nome: string; limite_numeros: number; limite_mensagens_dia: number; tem_ia: boolean; preco: number | null; ativo: boolean };
export type Cliente = { cliente_id: string; nome?: string; plano_id?: string; ativo?: boolean; config?: Record<string, unknown> };

async function adminCall(body: object) {
  return n8nPost("admin", body);
}

function mergeClientes(primary: Cliente[], fallback: Cliente[] = []) {
  const map = new Map<string, Cliente>();
  [...fallback, ...primary].forEach((cliente) => {
    if (!cliente?.cliente_id) return;
    map.set(cliente.cliente_id, { ...map.get(cliente.cliente_id), ...cliente });
  });
  return Array.from(map.values()).sort((a, b) => a.cliente_id.localeCompare(b.cliente_id));
}

const PLANOS_DEFAULT: Plano[] = [
  { plano_id: "trial",      nome: "Trial",      limite_numeros: 1, limite_mensagens_dia: 25,  tem_ia: false, preco: 0,    ativo: true },
  { plano_id: "starter",    nome: "Starter",   limite_numeros: 1, limite_mensagens_dia: 50,  tem_ia: false, preco: 500,  ativo: true },
  { plano_id: "pro",        nome: "Pro",        limite_numeros: 2, limite_mensagens_dia: 100, tem_ia: false, preco: 800,  ativo: true },
  { plano_id: "business",   nome: "Business",   limite_numeros: 4, limite_mensagens_dia: 200, tem_ia: false, preco: 1000, ativo: true },
  { plano_id: "enterprise", nome: "Enterprise", limite_numeros: 8, limite_mensagens_dia: 400, tem_ia: true,  preco: null, ativo: true },
  { plano_id: "custom",     nome: "Custom",     limite_numeros: 0, limite_mensagens_dia: 0,   tem_ia: false, preco: null, ativo: true },
];

const BADGE_COLORS: Record<string, string> = {
  trial: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  starter: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  business: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  enterprise: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  custom: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
};

function ClientesTab({ clientes, planos, loadingClientes, onRefresh }: { clientes: Cliente[]; planos: Plano[]; loadingClientes: boolean; onRefresh: () => void }) {
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [planosEdit, setPlanosEdit] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSuccesso] = useState<string | null>(null);
  const [clientesLocal, setClientesLocal] = useState<Cliente[]>(clientes);

  useEffect(() => { setClientesLocal(clientes); }, [clientes]);

  const planoInfo = (plano_id?: string) => planos.find(p => p.plano_id === plano_id);

  const atualizarPlano = async (cliente_id: string, plano_id: string) => {
    setSalvandoId(cliente_id);
    try {
      await adminCall({ acao: "atualizar_plano", cliente_id, plano_id });
      setClientesLocal(prev => prev.map(c => c.cliente_id === cliente_id ? { ...c, plano_id } : c));
      setSuccesso(`Plano de ${cliente_id} atualizado!`);
      setTimeout(() => setSuccesso(null), 3000);
    } catch { setErro("Erro ao atualizar plano."); }
    finally { setSalvandoId(null); }
  };

  const toggleAtivo = async (cliente_id: string, ativo: boolean) => {
    try {
      const c = clientesLocal.find(x => x.cliente_id === cliente_id);
      await adminCall({ acao: "atualizar_plano", cliente_id, plano_id: c?.plano_id || "starter", ativo });
      setClientesLocal(prev => prev.map(c => c.cliente_id === cliente_id ? { ...c, ativo } : c));
    } catch {}
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Users size={15} /> Clientes ({clientesLocal.length})</CardTitle>
          <Button variant="outline" size="sm" className="h-7 gap-1" onClick={onRefresh} disabled={loadingClientes}>
            {loadingClientes ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {erro && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md mb-3">{erro}</p>}
        {sucesso && <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-md mb-3">{sucesso}</p>}
        {loadingClientes && clientesLocal.length === 0 ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-2">
            {clientesLocal.map(cliente => {
              const info = planoInfo(cliente.plano_id);
              return (
                <div key={cliente.cliente_id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{cliente.nome || cliente.cliente_id}</span>
                      <span className="text-xs text-muted-foreground font-mono">{cliente.cliente_id}</span>
                      {cliente.plano_id && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${BADGE_COLORS[cliente.plano_id] || BADGE_COLORS.custom}`}>{info?.nome || cliente.plano_id}</span>}
                    </div>
                    {info && <p className="text-[11px] text-muted-foreground mt-0.5">{info.limite_numeros} número{info.limite_numeros !== 1 ? "s" : ""} · {info.limite_mensagens_dia} msgs/dia{info.tem_ia ? " · Com IA" : ""}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={planosEdit[cliente.cliente_id] || cliente.plano_id || ""} onValueChange={v => setPlanosEdit(prev => ({ ...prev, [cliente.cliente_id]: v }))}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue placeholder="Plano" /></SelectTrigger>
                      <SelectContent>{planos.map(p => <SelectItem key={p.plano_id} value={p.plano_id} className="text-xs">{p.nome}</SelectItem>)}</SelectContent>
                    </Select>
                    {planosEdit[cliente.cliente_id] && planosEdit[cliente.cliente_id] !== cliente.plano_id && (
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={() => atualizarPlano(cliente.cliente_id, planosEdit[cliente.cliente_id])} disabled={salvandoId === cliente.cliente_id}>
                        {salvandoId === cliente.cliente_id ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Salvar
                      </Button>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Switch checked={cliente.ativo !== false} onCheckedChange={v => toggleAtivo(cliente.cliente_id, v)} className="scale-75" />
                      <span className="text-[10px] text-muted-foreground">{cliente.ativo !== false ? "Ativo" : "Inativo"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {clientesLocal.length === 0 && !loadingClientes && <p className="text-xs text-muted-foreground text-center py-6">Nenhum cliente cadastrado ainda.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlanosTab({ planos, onPlanosChange }: { planos: Plano[]; onPlanosChange: (planos: Plano[]) => void }) {
  const [criandoPlano, setCriandoPlano] = useState(false);
  const [sucesso, setSuccesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [novoPlano, setNovoPlano] = useState({ plano_id: "", nome: "", limite_numeros: 1, limite_mensagens_dia: 50, tem_ia: false, preco: 0 });

  const criarNovoPlano = async () => {
    if (!novoPlano.plano_id || !novoPlano.nome) return;
    setCriandoPlano(true);
    try {
      await adminCall({ acao: "criar_plano", ...novoPlano });
      onPlanosChange([...planos, { ...novoPlano, ativo: true, preco: novoPlano.preco || null }]);
      setNovoPlano({ plano_id: "", nome: "", limite_numeros: 1, limite_mensagens_dia: 50, tem_ia: false, preco: 0 });
      setSuccesso("Plano criado!"); setTimeout(() => setSuccesso(null), 3000);
    } catch { setErro("Erro ao criar plano."); }
    finally { setCriandoPlano(false); }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><CreditCard size={15} /> Planos Disponíveis</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {erro && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">{erro}</p>}
        {sucesso && <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-md">{sucesso}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {planos.map(p => (
            <div key={p.plano_id} className={`p-3 rounded-lg border border-border ${!p.ativo ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${BADGE_COLORS[p.plano_id] || BADGE_COLORS.custom}`}>{p.nome}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{p.plano_id}</span>
              </div>
              {p.limite_numeros > 0 ? (<><p className="text-sm font-semibold text-foreground mt-1">{p.limite_numeros} número{p.limite_numeros !== 1 ? "s" : ""}</p><p className="text-xs text-muted-foreground">{p.limite_mensagens_dia} mensagens/dia</p><p className="text-xs text-muted-foreground">{p.limite_mensagens_dia / p.limite_numeros} msgs por número</p></>) : (<p className="text-sm text-muted-foreground mt-1">A negociar</p>)}
              <div className="flex items-center gap-3 mt-1.5">
                {p.preco ? <p className="text-xs font-semibold text-foreground">R$ {p.preco}/mês</p> : null}
                <p className="text-xs text-muted-foreground">{p.tem_ia ? "✓ Com IA" : "✗ Sem IA"}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border border-border rounded-lg p-3 space-y-3 mt-4">
          <p className="text-xs font-medium text-foreground flex items-center gap-1"><Plus size={12} /> Criar novo plano</p>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[11px]">ID do plano</Label><Input placeholder="ex: premium" value={novoPlano.plano_id} onChange={e => setNovoPlano(p => ({ ...p, plano_id: e.target.value.toLowerCase().replace(/\s/g, "_") }))} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-[11px]">Nome exibido</Label><Input placeholder="ex: Premium" value={novoPlano.nome} onChange={e => setNovoPlano(p => ({ ...p, nome: e.target.value }))} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-[11px]">Limite de números</Label><Input type="number" min={1} value={novoPlano.limite_numeros} onChange={e => setNovoPlano(p => ({ ...p, limite_numeros: +e.target.value, limite_mensagens_dia: +e.target.value * 50 }))} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-[11px]">Msgs/dia total</Label><Input type="number" min={1} value={novoPlano.limite_mensagens_dia} onChange={e => setNovoPlano(p => ({ ...p, limite_mensagens_dia: +e.target.value }))} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-[11px]">Preço (R$/mês, 0 = negociar)</Label><Input type="number" min={0} value={novoPlano.preco} onChange={e => setNovoPlano(p => ({ ...p, preco: +e.target.value }))} className="h-8 text-xs mt-1" /></div>
            <div className="flex items-end pb-1"><div className="flex items-center gap-2 mt-1"><Switch checked={novoPlano.tem_ia} onCheckedChange={v => setNovoPlano(p => ({ ...p, tem_ia: v }))} className="scale-75" /><Label className="text-[11px]">Com IA</Label></div></div>
          </div>
          <Button size="sm" className="gap-1 text-xs" onClick={criarNovoPlano} disabled={criandoPlano || !novoPlano.plano_id || !novoPlano.nome}>
            {criandoPlano ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Criar plano
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfigurarClienteTab({ clientes, planos, loadingClientes }: { clientes: Cliente[]; planos: Plano[]; loadingClientes: boolean }) {
  const [selectedId, setSelectedId] = useState("");
  const [planoSel, setPlanoSel] = useState("");
  const [ativoSel, setAtivoSel] = useState(true);
  const [salvandoMeta, setSalvandoMeta] = useState(false);
  const [sucessoMeta, setSucessoMeta] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    const c = clientes.find(x => x.cliente_id === selectedId);
    if (c) { setPlanoSel(c.plano_id || ""); setAtivoSel(c.ativo !== false); }
  }, [selectedId, clientes]);

  const salvarMeta = async () => {
    if (!selectedId) return;
    setSalvandoMeta(true);
    try {
      await adminCall({ acao: "atualizar_plano", cliente_id: selectedId, plano_id: planoSel, ativo: ativoSel });
      setSucessoMeta(true); setTimeout(() => setSucessoMeta(false), 3000);
    } catch {}
    finally { setSalvandoMeta(false); }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Settings size={14} /> Selecionar Cliente</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Cliente</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue placeholder={loadingClientes ? "Carregando..." : "Selecione um cliente"} /></SelectTrigger>
              <SelectContent>{clientes.map(c => <SelectItem key={c.cliente_id} value={c.cliente_id} className="text-sm">{c.nome ? `${c.nome} (${c.cliente_id})` : c.cliente_id}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {selectedId && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Plano</Label>
                  <Select value={planoSel} onValueChange={setPlanoSel}>
                    <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{planos.map(p => <SelectItem key={p.plano_id} value={p.plano_id} className="text-sm">{p.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-1"><div className="flex items-center gap-2"><Switch checked={ativoSel} onCheckedChange={setAtivoSel} /><Label className="text-sm">{ativoSel ? "Ativo" : "Inativo"}</Label></div></div>
              </div>
              <Button onClick={salvarMeta} disabled={salvandoMeta} size="sm" className="gap-1.5 text-xs">
                {salvandoMeta ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                {sucessoMeta ? "✓ Salvo!" : "Salvar plano e status"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      {selectedId && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Configurações de disparo — {selectedId}</p>
          <DisparosTab key={`disparos-${selectedId}`} clienteId={selectedId} />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Configurações de IA — {selectedId}</p>
          <IATab key={`ia-${selectedId}`} clienteId={selectedId} />
        </div>
      )}
    </div>
  );
}

export default function AdminTab({ clientesFallback = [] }: { clientesFallback?: Cliente[] }) {
  const [clientes, setClientes] = useState<Cliente[]>(clientesFallback);
  const [planos, setPlanos] = useState<Plano[]>(PLANOS_DEFAULT);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingPlanos, setLoadingPlanos] = useState(false);

  const carregarClientes = useCallback(async () => {
    setLoadingClientes(true);
    try {
      const data = await adminCall({ acao: "listar_clientes" });
      setClientes(mergeClientes(data.clientes || [], clientesFallback));
    } catch {
      setClientes(mergeClientes([], clientesFallback));
    }
    finally { setLoadingClientes(false); }
  }, [clientesFallback]);

  const carregarPlanos = useCallback(async () => {
    setLoadingPlanos(true);
    try { const data = await adminCall({ acao: "listar_planos" }); if (data.planos?.length) setPlanos(data.planos); } catch {}
    finally { setLoadingPlanos(false); }
  }, []);

  useEffect(() => { setClientes((current) => mergeClientes(current, clientesFallback)); }, [clientesFallback]);
  useEffect(() => { carregarClientes(); carregarPlanos(); }, [carregarClientes, carregarPlanos]);

  void loadingPlanos;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Shield size={18} className="text-primary" />
        <h3 className="text-base font-semibold text-foreground">Painel Administrativo</h3>
        <Badge className="bg-primary/10 text-primary text-[10px]">Admin</Badge>
      </div>
      <Tabs defaultValue="clientes" className="space-y-4">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="clientes" className="gap-2 data-[state=active]:bg-card"><Users size={13} />Clientes</TabsTrigger>
          <TabsTrigger value="planos" className="gap-2 data-[state=active]:bg-card"><CreditCard size={13} />Planos</TabsTrigger>
          <TabsTrigger value="configurar" className="gap-2 data-[state=active]:bg-card"><Settings size={13} />Configurar Cliente</TabsTrigger>
        </TabsList>
        <TabsContent value="clientes"><ClientesTab clientes={clientes} planos={planos} loadingClientes={loadingClientes} onRefresh={carregarClientes} /></TabsContent>
        <TabsContent value="planos"><PlanosTab planos={planos} onPlanosChange={setPlanos} /></TabsContent>
        <TabsContent value="configurar"><ConfigurarClienteTab clientes={clientes} planos={planos} loadingClientes={loadingClientes} /></TabsContent>
      </Tabs>
    </div>
  );
}
