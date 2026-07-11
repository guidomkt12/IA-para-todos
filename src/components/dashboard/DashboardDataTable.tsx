import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import ColumnSelector from "./ColumnSelector";

interface DashboardDataTableProps {
  loading: boolean;
  data: any[] | null;
  emptyMessage: string;
  columns: string[];
  visibleColumns: string[];
  onColumnsChange: (columns: string[]) => void;
  rowMapper: (item: any) => string[];
  perPage?: number;
}

const DEFAULT_PER_PAGE = 15;

export default function DashboardDataTable({
  loading,
  data,
  emptyMessage,
  columns,
  visibleColumns,
  onColumnsChange,
  rowMapper,
  perPage = DEFAULT_PER_PAGE,
}: DashboardDataTableProps) {
  const [page, setPage] = useState(1);

  const visibleIndices = columns
    .map((col, i) => (visibleColumns.includes(col) ? i : -1))
    .filter((i) => i !== -1);

  const items = data || [];
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = items.slice((safePage - 1) * perPage, safePage * perPage);

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
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-6">
        <span className="text-sm text-muted-foreground">
          {items.length} resultado{items.length !== 1 ? "s" : ""} · {visibleColumns.length} de {columns.length} campos
        </span>
        <ColumnSelector
          allColumns={columns}
          visibleColumns={visibleColumns}
          onChange={onColumnsChange}
        />
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    {visibleIndices.map((i) => (
                      <TableHead key={columns[i]} className="text-muted-foreground font-semibold">{columns[i]}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((item: any, rowIdx: number) => {
                    const allCells = rowMapper(item);
                    return (
                      <TableRow key={rowIdx} className="border-border hover:bg-secondary/50">
                        {visibleIndices.map((i) => (
                          <TableCell key={i} className="text-card-foreground">{allCells[i]}</TableCell>
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
                  Página {safePage} de {totalPages}
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
