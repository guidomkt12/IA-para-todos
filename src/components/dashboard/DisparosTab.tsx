import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Send, Sparkles, Eye, Flame } from "lucide-react";
import { n8nPost } from "@/lib/api";

const VARIAVEIS = [
  { label: "{parte_do_dia}", desc: "Bom dia / Boa tarde / Boa noite" },
  { label: "{empresa}", desc: "Nome da empresa do cliente" },
  { label: "{nome}", desc: "Nome do contato" },
  { label: "{cidade}", desc: "Cidade do contato" },
];

const HORAS = Array.from({ length: 18 }, (_, i) => i + 6);

function previewMensagem(template: string, empresa: string): string {
  const agora = new Date();
  const hora = agora.getHours();
  const parte = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  return template
    .replace(/{parte_do_dia}/g, parte)
    .replace(/{empresa}/g, empresa || "Sua Empresa")
    .replace(/{nome}/g, "João")
    .replace(/{cidade}/g, "Belo Horizonte");
}

export default function DisparosTab({ clienteId }: { clienteId: string }) {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSuccesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [horaInicio, setHoraInicio] = useState(8);
  const [horaFim, setHoraFim] = useState(20);
  const [limitePorNumero, setLimitePorNumero] = useState(30);
  const [horarioAcionamento, setHorarioAcionamento] = useState(8);
  const [nicho, setNicho] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [templateMensagem, setTemplateMensagem] = useState(
    "{parte_do_dia}, {empresa}! Tudo bem?\n\nSou especialista em [serviço] e gostaria de apresentar como posso te ajudar.\n\nPosso te enviar mais informações?"
  );
  const [showPreview, setShowPreview] = useState(false);
  const [modoAquecimento, setModoAquecimento] = useState("automatico");

  const carregarConfig = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    try {
      const data = await n8nPost("admin", { acao: "buscar_config", cliente_id: clienteId });
      const c = data?.config || {};
      if (c.horaInicio !== undefined) setHoraInicio(c.horaInicio);
      if (c.horaFim !== undefined) setHoraFim(c.horaFim);
      if (c.limitePorNumero !== undefined) setLimitePorNumero(c.limitePorNumero);
      if (c.horarioAcionamento !== undefined) setHorarioAcionamento(c.horarioAcionamento);
      if (c.nicho) setNicho(c.nicho);
      if (c.empresa) setEmpresa(c.empresa);
      if (c.templateMensagem) setTemplateMensagem(c.templateMensagem);
      if (c.modoAquecimento) setModoAquecimento(c.modoAquecimento);
    } catch {}
    finally { setLoading(false); }
  }, [clienteId]);

  useEffect(() => { carregarConfig(); }, [carregarConfig]);

  const inserirVariavel = (v: string) => setTemplateMensagem(prev => prev + v);

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      await n8nPost("admin", {
        acao: "salvar_config",
        cliente_id: clienteId,
        config: { horaInicio, horaFim, limitePorNumero, horarioAcionamento, nicho, empresa, templateMensagem, modoAquecimento },
      });
      setSuccesso(true);
      setTimeout(() => setSuccesso(false), 3000);
    } catch { setErro("Erro ao salvar configurações."); }
    finally { setSalvando(false); }
  };

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
            <Send size={14} /> Configurações de Disparo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <div>
            <Label className="text-xs font-medium">Nome da empresa / marca</Label>
            <Input
              value={empresa}
              onChange={e => setEmpresa(e.target.value)}
              placeholder="Ex: OnTrigger, Clínica Vida, Coach Paulo..."
              className="mt-1.5 h-9 text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Usado na variável {'{empresa}'} das mensagens.
            </p>
          </div>

          <div>
            <Label className="text-xs font-medium">Nicho de atuação</Label>
            <Input
              value={nicho}
              onChange={e => setNicho(e.target.value)}
              placeholder="Ex: Psicólogos, Nutricionistas, Academias, Clínicas..."
              className="mt-1.5 h-9 text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Digite o nicho de contatos que serão abordados nos disparos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Horário de início</Label>
              <Select value={String(horaInicio)} onValueChange={v => setHoraInicio(+v)}>
                <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HORAS.slice(0, 12).map(h => (
                    <SelectItem key={h} value={String(h)} className="text-sm">
                      {String(h).padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Horário de encerramento</Label>
              <Select value={String(horaFim)} onValueChange={v => setHoraFim(+v)}>
                <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HORAS.slice(6).map(h => (
                    <SelectItem key={h} value={String(h)} className="text-sm">
                      {String(h).padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Horário de acionamento diário</Label>
            <Select value={String(horarioAcionamento)} onValueChange={v => setHorarioAcionamento(+v)}>
              <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[6, 7, 8, 9, 10, 11, 12].map(h => (
                  <SelectItem key={h} value={String(h)} className="text-sm">
                    {String(h).padStart(2, "0")}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">
              Hora em que o sistema inicia os disparos do dia.
            </p>
          </div>

        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Flame size={14} /> Aquecimento de conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <div>
            <Label className="text-xs font-medium">Modo de aquecimento</Label>
            <Select value={modoAquecimento} onValueChange={setModoAquecimento}>
              <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="automatico" className="text-sm">Automático (recomendado)</SelectItem>
                <SelectItem value="manual" className="text-sm">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {modoAquecimento === "manual" ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium">Limite por número por dia</Label>
                <Badge className="bg-primary/10 text-primary text-[11px] font-semibold">{limitePorNumero} msgs</Badge>
              </div>
              <Slider
                min={5} max={50} step={5}
                value={[limitePorNumero]}
                onValueChange={([v]) => setLimitePorNumero(v)}
                className="mt-1"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">5</span>
                <span className="text-[10px] text-muted-foreground">50 (máximo)</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Cada número conectado enviará até este limite por dia.
              </p>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
              O sistema inicia com 5 mensagens/dia e aumenta gradualmente até o limite do seu plano.
              Isso protege o número de bloqueios.
            </div>
          )}

        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles size={14} /> Mensagem de Abordagem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Monte a mensagem que será enviada como primeiro contato. Use as variáveis abaixo para personalizar automaticamente.
          </p>

          <div>
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Variáveis disponíveis
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {VARIAVEIS.map(v => (
                <button
                  key={v.label}
                  onClick={() => inserirVariavel(v.label)}
                  className="group flex flex-col items-start px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-accent hover:border-primary/50 transition-all text-left"
                >
                  <span className="text-[11px] font-mono font-semibold text-primary">{v.label}</span>
                  <span className="text-[10px] text-muted-foreground group-hover:text-foreground">{v.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Template da mensagem</Label>
            <Textarea
              value={templateMensagem}
              onChange={e => setTemplateMensagem(e.target.value)}
              rows={6}
              className="mt-1.5 text-sm font-mono resize-none"
              placeholder="Digite sua mensagem aqui..."
            />
          </div>

          <div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Eye size={12} /> {showPreview ? "Ocultar" : "Ver"} preview
            </button>
            {showPreview && (
              <div className="mt-2 p-3 rounded-xl bg-[#DCF8C6] dark:bg-[#005C4B] text-gray-800 dark:text-white text-sm max-w-xs ml-auto whitespace-pre-wrap font-sans leading-relaxed shadow-sm">
                {previewMensagem(templateMensagem, empresa)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {erro && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">{erro}</p>}
      <Button onClick={salvar} disabled={salvando} className="w-full gap-2">
        {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {sucesso ? "✓ Configurações salvas!" : "Salvar configurações"}
      </Button>
    </div>
  );
}
