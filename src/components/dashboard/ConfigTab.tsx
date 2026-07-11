import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, CreditCard, User, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { n8nPost } from "@/lib/api";

const PLANOS = [
  { id: "1_sem_ia",  nome: "Starter",        numeros: 1, msgs: 50,  tem_ia: false, preco: 500  },
  { id: "1_com_ia",  nome: "Starter + IA",   numeros: 1, msgs: 50,  tem_ia: true,  preco: 800  },
  { id: "2_sem_ia",  nome: "Pro",             numeros: 2, msgs: 100, tem_ia: false, preco: 800  },
  { id: "2_com_ia",  nome: "Pro + IA",        numeros: 2, msgs: 100, tem_ia: true,  preco: 1000 },
  { id: "4_sem_ia",  nome: "Business",        numeros: 4, msgs: 200, tem_ia: false, preco: 1000 },
  { id: "4_com_ia",  nome: "Business + IA",   numeros: 4, msgs: 200, tem_ia: true,  preco: 1200 },
  { id: "8_com_ia",  nome: "Enterprise + IA", numeros: 8, msgs: 400, tem_ia: true,  preco: null },
];

export default function ConfigTab({ clienteId }: { clienteId: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSuccesso] = useState(false);

  const [planoAtual, setPlanoAtual] = useState<string | null>(null);
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [whatsappSuporte, setWhatsappSuporte] = useState("");

  const carregarConfig = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    try {
      const data = await n8nPost("admin", { acao: "buscar_config", cliente_id: clienteId });
      const c = data?.config || {};
      if (c.plano) setPlanoAtual(c.plano);
      else if (data?.plano_id) setPlanoAtual(data.plano_id);
      if (c.nomeResponsavel) setNomeResponsavel(c.nomeResponsavel);
      if (c.whatsappSuporte) setWhatsappSuporte(c.whatsappSuporte);
    } catch {}
    finally { setLoading(false); }
  }, [clienteId]);

  useEffect(() => { carregarConfig(); }, [carregarConfig]);

  const salvarDados = async () => {
    setSalvando(true);
    try {
      await n8nPost("admin", {
        acao: "salvar_config",
        cliente_id: clienteId,
        config: { nomeResponsavel, whatsappSuporte },
      });
      setSuccesso(true);
      setTimeout(() => setSuccesso(false), 3000);
    } catch {}
    finally { setSalvando(false); }
  };

  const planoInfo = PLANOS.find(p => p.id === planoAtual);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CreditCard size={14} /> Meu Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          {planoInfo ? (
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{planoInfo.nome}</span>
                  <Badge className="bg-primary/10 text-primary text-[11px]">Ativo</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{planoInfo.numeros} número{planoInfo.numeros !== 1 ? "s" : ""} · {planoInfo.msgs} mensagens/dia</p>
                <p className="text-sm text-muted-foreground">{planoInfo.tem_ia ? "✓ Com IA + Agendamento" : "✗ Sem IA"}</p>
              </div>
              {planoInfo.preco !== null ? (
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">R$ {planoInfo.preco}</p>
                  <p className="text-[11px] text-muted-foreground">/mês</p>
                </div>
              ) : (
                <p className="text-sm font-medium text-muted-foreground">A negociar</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Plano não identificado. Entre em contato com o suporte.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CreditCard size={14} /> Planos Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLANOS.map(p => {
              const isAtual = p.id === planoAtual;
              return (
                <div key={p.id} className={`p-4 rounded-lg border transition-all ${isAtual ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-sm text-foreground">{p.nome}</span>
                    {isAtual && <Badge className="bg-primary/10 text-primary text-[10px]">Atual</Badge>}
                  </div>
                  {p.preco !== null ? (
                    <p className="text-2xl font-bold text-foreground mb-2">R$ {p.preco}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                  ) : (
                    <p className="text-lg font-semibold text-muted-foreground mb-2">A negociar</p>
                  )}
                  <ul className="space-y-1 mb-3">
                    <li className="text-xs text-muted-foreground flex items-center gap-1.5"><Check size={11} className="text-emerald-500 flex-shrink-0" />{p.numeros} número{p.numeros !== 1 ? "s" : ""} conectado{p.numeros !== 1 ? "s" : ""}</li>
                    <li className="text-xs text-muted-foreground flex items-center gap-1.5"><Check size={11} className="text-emerald-500 flex-shrink-0" />{p.msgs} mensagens/dia</li>
                    <li className={`text-xs flex items-center gap-1.5 ${p.tem_ia ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                      <Check size={11} className={p.tem_ia ? "text-emerald-500 flex-shrink-0" : "text-muted-foreground/30 flex-shrink-0"} />
                      {p.tem_ia ? "Com IA + Agendamento" : "Sem IA"}
                    </li>
                  </ul>
                  {!isAtual && (
                    <Button variant="outline" size="sm" className="w-full text-xs h-7" asChild>
                      <a href={`https://wa.me/5511999999999?text=Ol%C3%A1%21+Gostaria+de+fazer+upgrade+para+o+plano+${encodeURIComponent(p.nome)}`} target="_blank" rel="noopener noreferrer">Solicitar upgrade</a>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User size={14} /> Dados da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Email</Label>
            <Input value={user?.email || ""} readOnly className="mt-1.5 h-9 text-sm bg-muted/50 cursor-not-allowed" />
          </div>
          <div>
            <Label className="text-xs font-medium">Nome do responsável</Label>
            <Input value={nomeResponsavel} onChange={e => setNomeResponsavel(e.target.value)} placeholder="Seu nome completo" className="mt-1.5 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium">WhatsApp para suporte</Label>
            <Input value={whatsappSuporte} onChange={e => setWhatsappSuporte(e.target.value)} placeholder="55 (11) 99999-9999" className="mt-1.5 h-9 text-sm" />
          </div>
          <Button onClick={salvarDados} disabled={salvando} className="w-full gap-2">
            {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {sucesso ? "✓ Dados salvos!" : "Salvar dados"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
