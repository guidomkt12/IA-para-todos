import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { n8nPost } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface LeadsImportModalProps {
  open: boolean;
  onClose: () => void;
  clienteId: string;
  onSuccess?: () => void;
}

interface ParsedRow {
  nome: string;
  telefone: string;
  cidade: string;
  empresa: string;
}

type ColumnMap = {
  nome: string;
  telefone: string;
  cidade: string;
  empresa: string;
};

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const sep = lines[0].includes(";") ? ";" : ",";

  const parseRow = (line: string): string[] => {
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQuote = !inQuote; continue; }
      if (c === sep && !inQuote) { cols.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    cols.push(cur.trim());
    return cols;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(line => {
    const vals = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  });
  return { headers, rows };
}

function guessMapping(headers: string[]): ColumnMap {
  const lower = headers.map(h => h.toLowerCase());
  const find = (...candidates: string[]) =>
    headers[lower.findIndex(h => candidates.some(c => h.includes(c)))] || "";

  return {
    nome:     find("nome", "name", "contato", "contact"),
    telefone: find("telefone", "phone", "celular", "whatsapp", "fone", "tel"),
    cidade:   find("cidade", "city", "municipio", "município"),
    empresa:  find("empresa", "company", "negocio", "negócio", "estabelecimento"),
  };
}

function normalizeTelefone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 11 || digits.length === 10) return "55" + digits;
  return digits;
}

export default function LeadsImportModal({ open, onClose, clienteId, onSuccess }: LeadsImportModalProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "mapping" | "done">("upload");
  const [headers, setHeaders]   = useState<string[]>([]);
  const [rawRows, setRawRows]   = useState<Record<string, string>[]>([]);
  const [mapping, setMapping]   = useState<ColumnMap>({ nome: "", telefone: "", cidade: "", empresa: "" });
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);

  function reset() {
    setStep("upload");
    setHeaders([]);
    setRawRows([]);
    setMapping({ nome: "", telefone: "", cidade: "", empresa: "" });
    setImporting(false);
    setImportedCount(0);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFile(file: File) {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      if (h.length === 0) {
        toast({ title: "Arquivo inválido", description: "Não foi possível detectar colunas no CSV.", variant: "destructive" });
        return;
      }
      setHeaders(h);
      setRawRows(r);
      setMapping(guessMapping(h));
      setStep("mapping");
    };
    reader.readAsText(file, "UTF-8");
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const previewRows: ParsedRow[] = rawRows.slice(0, 5).map(r => ({
    nome:     mapping.nome     ? r[mapping.nome]     || "" : "",
    telefone: mapping.telefone ? normalizeTelefone(r[mapping.telefone] || "") : "",
    cidade:   mapping.cidade   ? r[mapping.cidade]   || "" : "",
    empresa:  mapping.empresa  ? r[mapping.empresa]  || "" : "",
  }));

  const validCount = rawRows.filter(r =>
    mapping.telefone && normalizeTelefone(r[mapping.telefone] || "").length >= 10
  ).length;

  async function handleImport() {
    if (!mapping.telefone) {
      toast({ title: "Coluna obrigatória", description: "Mapeie pelo menos a coluna Telefone.", variant: "destructive" });
      return;
    }

    const contatos = rawRows
      .map(r => ({
        nome:     mapping.nome     ? r[mapping.nome]     || "" : "",
        telefone: normalizeTelefone(r[mapping.telefone] || ""),
        cidade:   mapping.cidade   ? r[mapping.cidade]   || "" : "",
        empresa:  mapping.empresa  ? r[mapping.empresa]  || "" : "",
      }))
      .filter(c => c.telefone.length >= 10);

    if (contatos.length === 0) {
      toast({ title: "Nenhum contato válido", description: "Verifique se a coluna de telefone está correta.", variant: "destructive" });
      return;
    }

    setImporting(true);
    try {
      await n8nPost("import-contatos", { cliente_id: clienteId, contatos });
      setImportedCount(contatos.length);
      setStep("done");
      onSuccess?.();
    } catch {
      toast({ title: "Erro na importação", description: "Tente novamente em alguns instantes.", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  const NONE = "__none__";

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload size={18} className="text-primary" />
            Importar Contatos
          </DialogTitle>
          <DialogDescription>
            Importe contatos a partir de um arquivo CSV. Os contatos serão adicionados à sua lista de prospecção.
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div
            className={`mt-2 border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/30"
            }`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText size={28} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Arraste um arquivo CSV aqui</p>
              <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar</p>
              <p className="text-[11px] text-muted-foreground mt-3">
                Formatos aceitos: .csv — Separador vírgula (,) ou ponto-e-vírgula (;)
              </p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} />
          </div>
        )}

        {/* ── Step 2: Column mapping ── */}
        {step === "mapping" && (
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate">{fileName}</span>
              <Badge variant="secondary" className="ml-auto text-xs">{rawRows.length} linhas</Badge>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(["nome", "telefone", "cidade", "empresa"] as const).map(field => (
                <div key={field}>
                  <Label className="text-xs font-medium capitalize">
                    {field === "nome" ? "Nome" : field === "telefone" ? "Telefone *" : field === "cidade" ? "Cidade" : "Empresa"}
                  </Label>
                  <Select
                    value={mapping[field] || NONE}
                    onValueChange={v => setMapping(prev => ({ ...prev, [field]: v === NONE ? "" : v }))}
                  >
                    <SelectTrigger className="mt-1.5 h-9 text-sm">
                      <SelectValue placeholder="Não mapear" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE} className="text-sm text-muted-foreground">Não mapear</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h} className="text-sm">{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {previewRows.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Prévia (5 primeiras linhas)</p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        {["Nome", "Telefone", "Cidade", "Empresa"].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((r, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-1.5 truncate max-w-[120px]">{r.nome || "—"}</td>
                          <td className="px-3 py-1.5 font-mono">{r.telefone || "—"}</td>
                          <td className="px-3 py-1.5 truncate max-w-[100px]">{r.cidade || "—"}</td>
                          <td className="px-3 py-1.5 truncate max-w-[100px]">{r.empresa || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {validCount} contato{validCount !== 1 ? "s" : ""} válido{validCount !== 1 ? "s" : ""} encontrado{validCount !== 1 ? "s" : ""} (com telefone)
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">Importação concluída!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {importedCount} contato{importedCount !== 1 ? "s" : ""} importado{importedCount !== 1 ? "s" : ""} com sucesso.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          )}
          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={reset} disabled={importing}>Voltar</Button>
              <Button onClick={handleImport} disabled={importing || validCount === 0} className="gap-2">
                {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {importing ? "Importando..." : `Importar ${validCount} contato${validCount !== 1 ? "s" : ""}`}
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={handleClose}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
