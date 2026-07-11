import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading: boolean;
  error: string | null;
  color: string;
  growth?: number | null;
}

export default function KpiCard({ title, value, icon: Icon, loading, error, color, growth }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden border-border bg-card">
      <div className={`absolute top-0 left-0 right-0 h-1 ${color}`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-secondary">
          <Icon size={18} className="text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        ) : error ? (
          <div className="flex items-center gap-1 text-destructive text-sm">
            <AlertCircle size={14} /> Erro
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold font-heading text-foreground">{value}</p>
            {growth !== undefined && growth !== null && (
              <Badge
                variant="secondary"
                className={`text-xs gap-1 ${
                  growth >= 0
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-destructive/15 text-destructive border-destructive/30"
                }`}
              >
                {growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {growth >= 0 ? "+" : ""}
                {growth}%
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
