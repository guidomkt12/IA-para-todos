import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, RefreshCw, CheckCircle2, QrCode,
  WifiOff, Plus, Trash2, Smartphone, AlertCircle,
} from "lucide-react";
import { n8nPost, getPlano } from "@/lib/api";

type Instancia = {
  instancia_id: string;
  nome: string;
  token: string;
  server_url: string;
  connected?: boolean;
  status?: string;
};

async function callUazapi(clienteId: string, acao: string, extra: Record<string, unknown> = {}) {
  return n8nPost("uazapi-manager", { cliente_id: clienteId, acao, ...extra });
}

export default function WhatsAppTab({ clienteId }: { clienteId: string }) {
  const [limiteInstancias, setLimiteInstancias] = useState(1);

  useEffect(() => {
    if (!clienteId) return;
    n8nPost("admin", { acao: "buscar_config", cliente_id: clienteId })
      .then((data) => {
        const planoId = data?.plano_id || data?.config?.plano;
        if (planoId) setLimiteInstancias(getPlano(planoId).numeros);
      })
      .catch(() => {});
  }, [clienteId]);

  const [instancias, setInstancias]       = useState<Instancia[]>([]);
  const [listLoading, setListLoading]     = useState(true);
  const [criandoInstancia, setCriandoInstancia] = useState(false);
  const [deletandoId, setDeletandoId]     = useState<string | null>(null);
  const [qrStates, setQrStates]           = useState<Record<string, string | null>>({});
  const [qrLoading, setQrLoading]         = useState<Record<string, boolean>>({});
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({});
  const [error, setError]                 = useState<string | null>(null);
  const pollRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const stopPolling = (id: string) => {
    if (pollRefs.current[id]) { clearInterval(pollRefs.current[id]); delete pollRefs.current[id]; }
  };

  const carregarInstancias = useCallback(async () => {
    if (!clienteId) return;
    setListLoading(true); setError(null);
    try {
      const data = await callUazapi(clienteId, "listar");
      const lista: Instancia[] = data.instancias || [];
      const comStatus = await Promise.all(lista.map(async (inst) => {
        try {
          const s = await callUazapi(clienteId, "status", { instancia_id: inst.instancia_id });
          return { ...inst, connected: s.connected, status: s.status };
        } catch { return { ...inst, connected: false, status: "erro" }; }
      }));
      setInstancias(comStatus);
    } catch { setError("Não foi possível carregar as instâncias."); }
    finally { setListLoading(false); }
  }, [clienteId]);

  useEffect(() => {
    carregarInstancias();
    return () => Object.keys(pollRefs.current).forEach(stopPolling);
  }, [carregarInstancias]);

  const fetchStatus = async (instancia_id: string, silent = false) => {
    if (!silent) setStatusLoading(p => ({ ...p, [instancia_id]: true }));
    try {
      const data = await callUazapi(clienteId, "status", { instancia_id });
      setInstancias(prev => prev.map(i => i.instancia_id === instancia_id ? { ...i, connected: data.connected, status: data.status } : i));
      if (data.connected) { setQrStates(p => ({ ...p, [instancia_id]: null })); stopPolling(instancia_id); }
    } catch {}
    finally { if (!silent) setStatusLoading(p => ({ ...p, [instancia_id]: false })); }
  };

  const fetchQr = async (instancia_id: string) => {
    setQrLoading(p => ({ ...p, [instancia_id]: true }));
    setQrStates(p => ({ ...p, [instancia_id]: null }));
    try {
      const data = await callUazapi(clienteId, "qr", { instancia_id });
      if (data.qrcode) {
        setQrStates(p => ({ ...p, [instancia_id]: data.qrcode }));
        stopPolling(instancia_id);
        pollRefs.current[instancia_id] = setInterval(() => fetchStatus(instancia_id, true), 4000);
      } else { setError("QR Code indisponível. Tente novamente."); }
    } catch { setError("Erro ao gerar QR Code."); }
    finally { setQrLoading(p => ({ ...p, [instancia_id]: false })); }
  };

  const handleDisconnect = async (instancia_id: string) => {
    try {
      await callUazapi(clienteId, "disconnect", { instancia_id });
      setInstancias(prev => prev.map(i => i.instancia_id === instancia_id ? { ...i, connected: false, status: "disconnected" } : i));
      setQrStates(p => ({ ...p, [instancia_id]: null }));
      stopPolling(instancia_id);
    } catch { setError("Erro ao desconectar."); }
  };

  const handleCriarInstancia = async () => {
    if (instancias.length >= limiteInstancias) return;
    setCriandoInstancia(true); setError(null);
    try {
      const nome = `Número ${instancias.length + 1}`;
      const instancia_id = `${clienteId}_${Date.now()}`;
      await callUazapi(clienteId, "criar_instancia", { instancia_id, nome });
      await carregarInstancias();
    } catch { setError("Erro ao criar instância. Tente novamente."); }
    finally { setCriandoInstancia(false); }
  };

  const handleDeletarInstancia = async (instancia_id: string) => {
    setDeletandoId(instancia_id); setError(null);
    try {
      await callUazapi(clienteId, "deletar_instancia", { instancia_id });
      stopPolling(instancia_id);
      setInstancias(prev => prev.filter(i => i.instancia_id !== instancia_id));
      setQrStates(p => { const n = { ...p }; delete n[instancia_id]; return n; });
    } catch { setError("Erro ao deletar instância."); }
    finally { setDeletandoId(null); }
  };

  const conectadas = instancias.filter(i => i.connected).length;
  const atLimite   = instancias.length >= limiteInstancias;

  return (
    <div className="space-y-5 max-w-3xl">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Gerenciar Números</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {conectadas} de {instancias.length} conectado{conectadas !== 1 ? "s" : ""} · {instancias.length}/{limiteInstancias} número{limiteInstancias !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={carregarInstancias} disabled={listLoading}>
            {listLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Atualizar
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            onClick={handleCriarInstancia}
            disabled={criandoInstancia || atLimite}
            title={atLimite ? "Limite do plano atingido" : "Adicionar número"}
          >
            {criandoInstancia ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Adicionar número
          </Button>
        </div>
      </div>

      {/* ── Plan limit warning ── */}
      {atLimite && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-yellow-500/10 border border-yellow-500/30">
          <AlertCircle size={14} className="text-yellow-500 flex-shrink-0" />
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Limite de {limiteInstancias} número{limiteInstancias !== 1 ? "s" : ""} atingido. Faça upgrade para adicionar mais.
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
      )}

      {/* ── Loading skeleton ── */}
      {listLoading && instancias.length === 0 && (
        <div className="flex items-center justify-center py-14">
          <Loader2 size={26} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!listLoading && instancias.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-3 py-14">
            <Smartphone size={40} className="text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">Nenhum número configurado</p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Clique em "Adicionar número" para vincular seu primeiro WhatsApp.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Instance grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {instancias.map((inst) => {
          const qr            = qrStates[inst.instancia_id];
          const isQrLoading   = qrLoading[inst.instancia_id];
          const isStatLoading = statusLoading[inst.instancia_id];
          const isDeleting    = deletandoId === inst.instancia_id;
          const connected     = !!inst.connected;

          return (
            <Card
              key={inst.instancia_id}
              className={`border-border bg-card border-l-4 ${connected ? "border-l-emerald-500" : "border-l-destructive/60"}`}
            >
              {/* Card header */}
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Smartphone size={15} className="text-muted-foreground flex-shrink-0" />
                    <CardTitle className="text-sm font-heading truncate">{inst.nome || inst.instancia_id}</CardTitle>
                  </div>
                  {connected
                    ? <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/15 text-[10px] px-1.5 flex-shrink-0">Conectado ✓</Badge>
                    : <Badge variant="destructive" className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15 text-[10px] px-1.5 flex-shrink-0">Desconectado</Badge>
                  }
                </div>
              </CardHeader>

              {/* Card body — status or QR */}
              <CardContent className="pb-3">
                {connected ? (
                  <div className="flex items-center gap-2 py-1">
                    <CheckCircle2 size={15} className="text-emerald-500" />
                    <p className="text-xs text-muted-foreground">WhatsApp ativo e recebendo mensagens.</p>
                  </div>
                ) : qr ? (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <img
                      src={qr}
                      alt="QR Code WhatsApp"
                      className="w-44 h-44 rounded-xl border border-border shadow-md"
                    />
                    <p className="text-xs text-muted-foreground text-center max-w-xs">
                      Abra o WhatsApp → <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong>
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 size={11} className="animate-spin" /> Aguardando leitura...
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-1">
                    <p className="text-xs text-muted-foreground">Escaneie o QR Code para conectar.</p>
                  </div>
                )}
              </CardContent>

              {/* Card footer — actions */}
              <div className="border-t border-border px-4 py-2.5 flex items-center gap-2 flex-wrap">
                <Button
                  variant="ghost" size="sm" className="h-7 gap-1.5 text-xs px-2"
                  onClick={() => fetchStatus(inst.instancia_id)} disabled={isStatLoading}
                  title="Atualizar status"
                >
                  {isStatLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  Status
                </Button>

                {!connected && (
                  <Button
                    variant="ghost" size="sm" className="h-7 gap-1.5 text-xs px-2"
                    onClick={() => fetchQr(inst.instancia_id)} disabled={isQrLoading}
                  >
                    {isQrLoading ? <Loader2 size={12} className="animate-spin" /> : <QrCode size={12} />}
                    {isQrLoading ? "Gerando..." : qr ? "Novo QR" : "Gerar QR"}
                  </Button>
                )}

                {connected && (
                  <Button
                    variant="ghost" size="sm"
                    className="h-7 gap-1.5 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDisconnect(inst.instancia_id)}
                    title="Desconectar"
                  >
                    <WifiOff size={12} /> Desconectar
                  </Button>
                )}

                <div className="flex-1" />

                <Button
                  variant="ghost" size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeletarInstancia(inst.instancia_id)} disabled={isDeleting}
                  title="Deletar instância"
                >
                  {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
