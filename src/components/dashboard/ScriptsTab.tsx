import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Save, FileText, BookOpen, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useN8nData } from "@/hooks/useN8nData";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ScriptsTabProps {
  clienteId: string;
}

interface ScriptTemplate {
  id: string;
  titulo: string;
  descricao: string | null;
  conteudo: string;
}

const WEBHOOK_URL = "https://n8n.guinevesapi.xyz/webhook/update-script";

export default function ScriptsTab({ clienteId }: ScriptsTabProps) {
  const [script, setScript] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const [templates, setTemplates] = useState<ScriptTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const { toast } = useToast();

  const { data: scriptData, loading: loadingScript } = useN8nData<any>(clienteId, "scripts");

  // Load script from n8n
  useEffect(() => {
    if (scriptData) {
      const content = Array.isArray(scriptData)
        ? scriptData[0]?.script || scriptData[0]?.novo_script || scriptData[0]?.content || ""
        : scriptData?.script || scriptData?.novo_script || scriptData?.content || "";
      if (content && !script) {
        setScript(content);
      }
    }
  }, [scriptData]);

  // Load templates from DB
  useEffect(() => {
    async function fetchTemplates() {
      setLoadingTemplates(true);
      const { data, error } = await supabase
        .from("modelos_scripts")
        .select("id, titulo, descricao, conteudo")
        .order("created_at", { ascending: true });
      if (!error && data) {
        setTemplates(data as ScriptTemplate[]);
      }
      setLoadingTemplates(false);
    }
    fetchTemplates();
  }, []);

  const handleSave = async () => {
    if (!script.trim()) {
      toast({ title: "Script vazio", description: "Digite um script antes de salvar.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, novo_script: script }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      toast({ title: "Script salvo!", description: "A IA será atualizada com o novo script." });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUseTemplate = (content: string) => {
    setScript(content);
    setActiveTab("editor");
    toast({ title: "Modelo aplicado", description: "O template foi carregado no editor. Revise e salve." });
  };

  const charCount = script.length;
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full grid grid-cols-2 mb-6">
        <TabsTrigger value="editor" className="gap-2">
          <FileText size={14} />
          Editor
        </TabsTrigger>
        <TabsTrigger value="templates" className="gap-2">
          <BookOpen size={14} />
          Biblioteca de Modelos
        </TabsTrigger>
      </TabsList>

      {/* ===== EDITOR TAB ===== */}
      <TabsContent value="editor">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-heading text-foreground flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                Script de Abordagem da IA
              </CardTitle>
              {loadingScript && (
                <Badge variant="outline" className="text-xs gap-1 text-muted-foreground border-border">
                  <Loader2 size={10} className="animate-spin" /> Carregando...
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Edite o prompt completo. Use <code className="bg-secondary px-1 rounded text-[10px]">{"{{nome}}"}</code> para personalização automática.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingScript && !script ? (
              <div className="space-y-3">
                <Skeleton className="w-full h-[600px] rounded-lg" />
                <Skeleton className="w-full h-11 rounded-md" />
              </div>
            ) : (
              <>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Digite ou cole o script/prompt completo da IA aqui..."
                  className="w-full min-h-[60vh] rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background resize-y leading-relaxed"
                  spellCheck={false}
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                  <div className="flex gap-4">
                    <span>{charCount} caracteres</span>
                    <span>{wordCount} palavras</span>
                  </div>
                  <span className="text-primary/70 font-medium">
                    {script.includes("{{nome}}") ? "✓ Personalização detectada" : ""}
                  </span>
                </div>
                <Button onClick={handleSave} disabled={saving || !script.trim()} className="w-full gap-2" size="lg">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar e Atualizar IA
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ===== TEMPLATES TAB ===== */}
      <TabsContent value="templates">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Biblioteca de Modelos</h3>
              <p className="text-sm text-muted-foreground">Leia o modelo completo e aplique no editor com um clique.</p>
            </div>
            <Badge variant="secondary">
              {loadingTemplates ? <Loader2 size={10} className="animate-spin" /> : `${templates.length} modelos`}
            </Badge>
          </div>

          {loadingTemplates ? (
            <div className="space-y-3">
              <Skeleton className="w-full h-20 rounded-lg" />
              <Skeleton className="w-full h-20 rounded-lg" />
              <Skeleton className="w-full h-20 rounded-lg" />
            </div>
          ) : templates.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum modelo disponível. Solicite ao administrador para criar modelos de script.
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-3">
              {templates.map((t) => (
                <AccordionItem key={t.id} value={t.id} className="border border-border rounded-lg bg-card px-4">
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex flex-col items-start gap-1 text-left">
                      <span className="font-semibold text-foreground">{t.titulo}</span>
                      {t.descricao && (
                        <span className="text-xs text-muted-foreground font-normal">{t.descricao}</span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <pre className="whitespace-pre-wrap text-sm text-foreground/90 bg-secondary rounded-lg p-5 leading-relaxed font-mono mb-4">
                      {t.conteudo}
                    </pre>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="cta" className="w-full gap-2">
                          <AlertTriangle size={14} />
                          Substituir meu script por este modelo
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Substituir script atual?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O conteúdo atual do editor será substituído pelo modelo "{t.titulo}". Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleUseTemplate(t.conteudo)}>
                            Confirmar e Substituir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
