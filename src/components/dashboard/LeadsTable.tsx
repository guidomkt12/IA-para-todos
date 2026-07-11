import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, Search, Download } from "lucide-react";
import ColumnSelector from "./ColumnSelector";

interface LeadsTableProps {
  loading: boolean;
  data: any[] | null;
  columns: string[];
  visibleColumns: string[];
  onColumnsChange: (cols: string[]) => void;
}

const PER_PAGE = 15;

function getField(item: any, ...keys: string[]): string {
  for (const k of keys) {
    if (item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== "") return String(item[k]);
  }
  return "";
}

export default function LeadsTable({ loading, data, columns, visibleColumns, onColumnsChange }: LeadsTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [enviadoFilter, setEnviadoFilter] = useState<"all" | "sim" | "nao">("all");

  // Compute full column list including "Enviado"
  const allColumns = useMemo(() => {
    const cols = [...columns];
    if (!cols.includes("Enviado")) cols.push("Enviado");
    return cols;
  }, [columns]);

  const allVisibleColumns = useMemo(() => {
    const cols = [...visibleColumns];
    if (!cols.includes("Enviado")) cols.push("Enviado");
    return cols;
  }, [visibleColumns]);

  const filtered = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    let result = data;

    // Auto-filter: remove contacts without phone
    result = result.filter((c) => {
      const phone = getField(c, "Telefone", "telefone", "Phone", "phone");
      return phone.length > 0;
    });

    // Enviado filter
    if (enviadoFilter !== "all") {
      result = result.filter((c) => {
        const enviado = getField(c, "Enviado", "enviado", "sent", "Sent").toLowerCase();
        const isSim = enviado === "sim" || enviado === "true" || enviado === "yes" || enviado === "1";
        return enviadoFilter === "sim" ? isSim : !isSim;
      });
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const name = getField(c, "Nome", "nome", "Name", "name", "Nome/Agência").toLowerCase();
        const phone = getField(c, "Telefone", "telefone", "Phone", "phone").toLowerCase();
        return name.includes(q) || phone.includes(q);
      });
    }

    return result;
  }, [data, search, enviadoFilter]);

  // Reset page on filter change
  useMemo(() => setPage(1), [search, enviadoFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const visibleIndices = allColumns
    .map((col, i) => (allVisibleColumns.includes(col) ? i : -1))
    .filter((i) => i !== -1);

  const rowMapper = (c: any): string[] =>
    allColumns.map((col) => {
      if (col === "Enviado") {
        const val = getField(c, "Enviado", "enviado", "sent", "Sent");
        if (!val) return "Não";
        const lower = val.toLowerCase();
        return (lower === "sim" || lower === "true" || lower === "yes" || lower === "1") ? "Sim" : "Não";
      }
      return c[col] || c[col.toLowerCase()] || "—";
    });

  // CSV Export
  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = allVisibleColumns;
    const csvRows: string[] = [headers.map((h) => `"${h}"`).join(",")];

    for (const item of filtered) {
      const cells = rowMapper(item);
      const row = visibleIndices.map((i) => {
        const val = (cells[i] || "").replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\r\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contatos_ontrigger_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col gap-3 pb-2 pt-4 px-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative max-w-xs flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary border-border text-sm h-9"
              />
            </div>
            <Select value={enviadoFilter} onValueChange={(v) => setEnviadoFilter(v as any)}>
              <SelectTrigger className="w-[130px] h-9 bg-secondary border-border text-sm">
                <SelectValue placeholder="Enviado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {filtered.length} contato{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-2 text-sm border-border" onClick={exportCSV}>
              <Download size={14} />
              Baixar CSV
            </Button>
            <ColumnSelector allColumns={allColumns} visibleColumns={allVisibleColumns} onChange={onColumnsChange} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : paged.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum contato encontrado</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    {visibleIndices.map((i) => (
                      <TableHead key={allColumns[i]} className="text-muted-foreground font-semibold">
                        {allColumns[i]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((item, rowIdx) => {
                    const allCells = rowMapper(item);
                    return (
                      <TableRow key={rowIdx} className="border-border hover:bg-secondary/50">
                        {visibleIndices.map((i) => (
                          <TableCell key={i} className="text-card-foreground">
                            {allColumns[i] === "Enviado" ? (
                              <span className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                allCells[i] === "Sim"
                                  ? "bg-primary/15 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {allCells[i]}
                              </span>
                            ) : allCells[i]}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Página {safePage} de {totalPages} ({filtered.length} resultados)
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft size={14} />
                  </Button>
                  {pageNumbers.map((num, idx) =>
                    num === "..." ? (
                      <span key={`dots-${idx}`} className="px-1 text-muted-foreground text-xs">…</span>
                    ) : (
                      <Button key={num} variant={num === safePage ? "default" : "ghost"} size="icon" className={`h-8 w-8 text-xs ${num === safePage ? "" : "text-muted-foreground"}`} onClick={() => setPage(num as number)}>
                        {num}
                      </Button>
                    )
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
