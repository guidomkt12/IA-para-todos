import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Bot, Calendar, FileText, CheckCircle2, XCircle, Lock } from "lucide-react";
import { getPlano } from "@/lib/api";
import ScriptsTab from "@/components/dashboard/ScriptsTab";
import { n8nPost } from "@/lib/api";

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo (Brasília)" },
  { value: "America/Manaus", label: "America/Manaus" },
  { value: "America/Fortaleza", label: "America/Fortaleza" },
  { value: "America/Belem", label: "America/Belem" },
  { value: "America/Porto_Velho", label: "America/Porto_Velho" },
  { value: "America/Rio_Branco", label: "America/Rio_Branco" },
];

const DURACOES = [30, 45, 60, 90, 120];

export default function IATab({ clienteId }: { clienteId: string }) {
  const [temIA, setTemIA] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSuccesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [delayMin, setDelayMin] = useState(3);
  const [delayMax, setDelayMax] = useState(8);
  const [quemResponder, setQuemResponder] = useState("todos");
  const [temperatura, setTemperatura] = useState(0.7);
  const [iaAtiva, setIaAtiva] = useState(true);

  const [googleCalendarId, setGoogleCalendarId] = useState("");
  const [eventoTitulo, setEventoTitulo] = useState("Consulta - {nome}");
  const [eventoDuracao, setEventoDuracao] = useState("60");
  const [eventoTimezone, setEventoTimezone] = useState("America/Sao_Paulo");
  const [calendarConectado, setCalendarConectado] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState("");
  const [savingCalendar, setSavingCalendar] = useState(false);
  const [sucessoCalendar, setSucessoCalendar] = useState(false);

  const carregarConfig = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    try {
      const data = await n8nPost("admin", { acao: "buscar_config", cliente_id: clienteId });
      const planoId = data?.plano_id || data?.config?.plano;
      if (planoId) setTemIA(getPlano(planoId).tem_ia);
      const c = data?.config || {};
      if (c.delayMin !== undefined) setDelayMin(c.delayMin);
      if (c.delayMax !== undefined) setDelayMax(c.delayMax);
      if (c.quemResponder) setQuemResponder(c.quemResponder);
      if (c.temperatura !== undefined) setTemperatura(c.temperatura);
      if (c.iaAtiva !== undefined) setIaAtiva(c.iaAtiva);
      if (c.googleCalendarId) setGoogleCalendarId(c.googleCalendarId);
      if (c.eventoTitulo) setEventoTitulo(c.eventoTitulo);
      if (c.eventoDuracao) setEventoDuracao(String(c.eventoDuracao));
      if (c.eventoTimezone) setEventoTimezone(c.eventoTimezone);
      if (c.calendarConectado !== undefined) setCalendarConectado(c.calendarConectado);
      if (c.calendarEmail) setCalendarEmail(c.calendarEmail);
    } catch {}
    finally { setLoading(false); }
  }, [clienteId]);

  useEffect(() => { carregarConfig(); }, [carregarConfig]);

  const salvarIA = async () => {
    setSalvando(true);
    setErro(null);
    try {
      await n8nPost("admin", {
        acao: "salvar_config",
        cliente_id: clienteId,
        config: { delayMin, delayMax, quemResponder, temperatura, iaAtiva },
      });
      setSuccesso(true);
      setTimeout(() => setSuccesso(false), 3000);
    } catch { setErro("Erro ao salvar configurações."); }
    finally { setSalvando(false); }
  };

  const salvarCalendar = async () => {
    setSavingCalendar(true);
    try {
      await n8nPost("admin", {
        acao: "salvar_config",
        cliente_id: clienteId,
        config: { googleCalendarId, eventoTitulo, eventoDuracao: Number(eventoDuracao), eventoTimezone },
      });
      setSucessoCalendar(true);
      setTimeout(() => setSucessoCalendar(false), 3000);
    } catch {}
    finally { setSavingCalendar(false); }
  };

  return (
    <Tabs defaultValue="script" className="space-y-4">
      <TabsList className="bg-secondary border border-border">
        <TabsTrigger value="script" className="gap-2 data-[state=active]:bg-card">
          <FileText size={13} />Script
        </TabsTrigger>
        <TabsTrigger value="config-ia" className="gap-2 data-[state=active]:bg-card">
          <Bot size={13} />Configurações IA
        </TabsTrigger>
        <TabsTrigger value="google" className="gap-2 data-[state=active]:bg-card">
          <Calendar size={13} />Google Agenda
        </TabsTrigger>
      </TabsList>

      <TabsContent value="script" className="space-y-4">
        <ScriptsTab clienteId={clienteId} />
      </TabsContent>

      <TabsContent value="config-ia" className="space-y-4">
        <div className="relative">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-5 max-w-3xl">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Bot size={14} /> Comportamento da IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                    <div>
                      <Label className="text-sm font-medium">Ativar IA</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Quando desativada, só os disparos rodam sem resposta automática.
                      </p>
                    </div>
                    <Switch checked={iaAtiva} onCheckedChange={setIaAtiva} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Delay mínimo (segundos)</Label>
                      <Input type="number" min={1} max={60} value={delayMin} onChange={e => setDelayMin(+e.target.value)} className="mt-1.5 h-9 text-sm" />
                      <p className="text-[11px] text-muted-foreground mt-1">Tempo que a IA aguarda antes de responder, simulando digitação.</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Delay máximo (segundos)</Label>
                      <Input type="number" min={1} max={120} value={delayMax} onChange={e => setDelayMax(+e.target.value)} className="mt-1.5 h-9 text-sm" />
                      <p className="text-[11px] text-muted-foreground mt-1">Variação aleatória no tempo de resposta para parecer mais humano.</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-2 block">Quem a IA responde</Label>
                    <RadioGroup value={quemResponder} onValueChange={setQuemResponder} className="space-y-2">
                      <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border hover:bg-accent/30 cursor-pointer">
                        <RadioGroupItem value="todos" id="ia-r-todos" className="mt-0.5" />
                        <div>
                          <Label htmlFor="ia-r-todos" className="text-sm font-medium cursor-pointer">Todos os contatos</Label>
                          <p className="text-xs text-muted-foreground">A IA responde qualquer mensagem recebida.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border hover:bg-accent/30 cursor-pointer">
                        <RadioGroupItem value="prospeccao" id="ia-r-prosp" className="mt-0.5" />
                        <div>
                          <Label htmlFor="ia-r-prosp" className="text-sm font-medium cursor-pointer">Apenas contatos da lista de prospecção</Label>
                          <p className="text-xs text-muted-foreground">A IA responde apenas quem já foi prospectado pelo sistema.</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-medium">Temperatura da IA</Label>
                      <Badge className="bg-primary/10 text-primary text-[11px] font-semibold">{temperatura.toFixed(1)}</Badge>
                    </div>
                    <Slider min={0} max={1} step={0.1} value={[temperatura]} onValueChange={([v]) => setTemperatura(v)} />
                    <p className="text-[11px] text-muted-foreground mt-1">Temperatura: {temperatura.toFixed(1)} — 0 = preciso e direto | 1 = criativo e variado</p>
                  </div>
                </CardContent>
              </Card>
              {erro && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">{erro}</p>}
              <Button onClick={salvarIA} disabled={salvando} className="w-full gap-2">
                {salvando ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save size={15} />}
                {sucesso ? "✓ Configurações salvas!" : "Salvar configurações"}
              </Button>
            </div>
          )}
          {!temIA && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-3 z-10">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Lock size={20} className="text-muted-foreground" />
              </div>
              <div className="text-center px-6">
                <p className="text-sm font-medium text-foreground">IA não incluída no seu plano</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Faça upgrade para um plano com IA para usar a Secretária Virtual.
                </p>
              </div>
              <Button size="sm" variant="outline" className="mt-1">
                Ver planos com IA
              </Button>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="google" className="space-y-4">
        <div className="relative">
          <div className="space-y-5 max-w-3xl">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar size={14} /> Integração Google Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Status:</span>
                  {calendarConectado ? (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[11px] gap-1">
                      <CheckCircle2 size={11} /> Conectado{calendarEmail ? ` · ${calendarEmail}` : ""}
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[11px] gap-1">
                      <XCircle size={11} /> Desconectado
                    </Badge>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium">ID do Calendário</Label>
                  <Input value={googleCalendarId} onChange={e => setGoogleCalendarId(e.target.value)} placeholder="Ex: seuemail@gmail.com ou ID do calendário" className="mt-1.5 h-9 text-sm" />
                  <p className="text-[11px] text-muted-foreground mt-1">Encontre em: Google Calendar → Configurações → [Calendário] → ID do calendário</p>
                </div>
                <div>
                  <Label className="text-xs font-medium">Título padrão dos eventos</Label>
                  <Input value={eventoTitulo} onChange={e => setEventoTitulo(e.target.value)} placeholder="Consulta - {nome}" className="mt-1.5 h-9 text-sm" />
                  <p className="text-[11px] text-muted-foreground mt-1">Variáveis: {"{"}nome{"}"},  {"{"}empresa{"}"},  {"{"}data{"}"},  {"{"}hora{"}"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Duração padrão (minutos)</Label>
                    <Select value={eventoDuracao} onValueChange={setEventoDuracao}>
                      <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DURACOES.map(d => <SelectItem key={d} value={String(d)} className="text-sm">{d} min</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Fuso horário</Label>
                    <Select value={eventoTimezone} onValueChange={setEventoTimezone}>
                      <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map(tz => <SelectItem key={tz.value} value={tz.value} className="text-sm">{tz.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={salvarCalendar} disabled={savingCalendar} className="w-full gap-2">
                  {savingCalendar ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save size={15} />}
                  {sucessoCalendar ? "✓ Salvo!" : "Salvar configurações do calendário"}
                </Button>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Como conectar o Google Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {[
                    { n: "1", text: "Entre no Google Calendar e abra as configurações do calendário que deseja usar." },
                    { n: "2", text: 'Copie o "ID do calendário" (geralmente seu e-mail ou um ID alfanumérico) e cole no campo acima.' },
                    { n: "3", text: 'Na seção "Compartilhar com pessoas específicas", adicione a conta de serviço do OnTrigger e dê permissão para criar eventos.' },
                    { n: "4", text: "Salve as configurações acima. A IA passará a criar eventos automaticamente quando um lead confirmar um horário." },
                  ].map(({ n, text }) => (
                    <li key={n} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{n}</span>
                      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Variáveis disponíveis no título:</span>{" "}
                  <code className="font-mono">{"{nome}"}</code>, <code className="font-mono">{"{empresa}"}</code>,{" "}
                  <code className="font-mono">{"{data}"}</code>, <code className="font-mono">{"{hora}"}</code>
                </div>
              </CardContent>
            </Card>
          </div>
          {!temIA && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-3 z-10">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Lock size={20} className="text-muted-foreground" />
              </div>
              <div className="text-center px-6">
                <p className="text-sm font-medium text-foreground">IA não incluída no seu plano</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Faça upgrade para um plano com IA para usar a Secretária Virtual.
                </p>
              </div>
              <Button size="sm" variant="outline" className="mt-1">
                Ver planos com IA
              </Button>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
