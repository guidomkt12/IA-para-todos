import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, BookOpen, X, Save } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface ScriptTemplate {
  id: string;
  titulo: string;
  descricao: string | null;
  conteudo: string;
  created_at: string;
  updated_at: string;
}

export default function ScriptTemplatesManager() {
  const [templates, setTemplates] = useState<ScriptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScriptTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [conteudo, setConteudo] = useState("");

  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("modelos_scripts")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setTemplates(data as ScriptTemplate[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openCreate = () => {
    setEditing(null);
    setTitulo("");
    setDescricao("");
    setConteudo("");
    setDialogOpen(true);
  };

  const openEdit = (t: ScriptTemplate) => {
    setEditing(t);
    setTitulo(t.titulo);
    setDescricao(t.descricao || "");
    setConteudo(t.conteudo);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!titulo.trim() || !conteudo.trim()) {
      toast({ title: "Campos obrigatórios", description: "Título e conteúdo são obrigatórios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("modelos_scripts")
          .update({ titulo: titulo.trim(), descricao: descricao.trim() || null, conteudo: conteudo.trim() })
          .eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Modelo atualizado" });
      } else {
        const { error } = await supabase
          .from("modelos_scripts")
          .insert({ titulo: titulo.trim(), descricao: descricao.trim() || null, conteudo: conteudo.trim() });
        if (error) throw error;
        toast({ title: "Modelo criado" });
      }
      setDialogOpen(false);
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("modelos_scripts").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Modelo excluído" });
      fetchTemplates();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><BookOpen size={18} /> Gestão de Modelos (Templates)</CardTitle>
              <CardDescription>Crie e gerencie os templates de script disponíveis para todos os clientes</CardDescription>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus size={14} /> Novo Modelo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
          ) : templates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum modelo criado ainda</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Tamanho</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.titulo}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">{t.descricao || "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">{t.conteudo.split(/\s+/).length} palavras</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                          <Pencil size={14} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O modelo "{t.titulo}" será excluído permanentemente e não estará mais disponível para os clientes.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Modelo" : "Criar Novo Modelo"}</DialogTitle>
            <DialogDescription>
              {editing ? "Atualize os dados do template." : "Preencha os campos para criar um novo template de script."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título do Modelo *</Label>
              <Input placeholder="Ex: Prospecção de Agências" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição / Objetivo</Label>
              <Input placeholder="Ex: Script para prospectar agências B2B via Google Maps" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Texto do Script *</Label>
              <Textarea
                placeholder="Cole o prompt/script completo aqui..."
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                className="min-h-[400px] font-mono text-sm leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground">
                {conteudo.trim() ? `${conteudo.trim().split(/\s+/).length} palavras` : "0 palavras"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editing ? "Salvar Alterações" : "Criar Modelo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
