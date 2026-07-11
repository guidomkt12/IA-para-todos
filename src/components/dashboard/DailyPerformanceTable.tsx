import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import type { DailyRow } from "@/lib/analyticsUtils";

interface DailyPerformanceTableProps {
  rows: DailyRow[];
  loading: boolean;
}

const PER_PAGE = 15;

export default function DailyPerformanceTable({ rows, loading }: DailyPerformanceTableProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = rows.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

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
      <CardHeader>
        <CardTitle className="text-base font-heading text-foreground">Performance Diária</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sem dados disponíveis</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs text-right">Mensagens</TableHead>
                    <TableHead className="text-xs text-right">Leads</TableHead>
                    <TableHead className="text-xs text-right">Reuniões</TableHead>
                    <TableHead className="text-xs text-right">Leads/Reunião</TableHead>
                    <TableHead className="text-xs text-right">Msgs/Reunião</TableHead>
                    <TableHead className="text-xs text-right">Conv/Lead</TableHead>
                    <TableHead className="text-xs text-right">Msgs/Núm</TableHead>
                    <TableHead className="text-xs text-right">Reun/Núm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">{row.date}</TableCell>
                      <TableCell className="text-sm text-right">{row.messages}</TableCell>
                      <TableCell className="text-sm text-right">{row.leads}</TableCell>
                      <TableCell className="text-sm text-right">{row.meetings}</TableCell>
                      <TableCell className="text-sm text-right">
                        {row.meetings > 0 ? row.leadsPerMeeting : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {row.meetings > 0 ? row.messagesPerMeeting : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {row.leads > 0 ? `${row.conversionPerMessage}%` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-right">{row.msgsPerNumber}</TableCell>
                      <TableCell className="text-sm text-right">{row.meetingsPerNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Página {safePage} de {totalPages} ({rows.length} dias)
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
