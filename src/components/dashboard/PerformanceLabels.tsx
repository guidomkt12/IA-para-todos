import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Zap } from "lucide-react";
import type { DerivedMetrics, PerformanceLevel } from "@/lib/analyticsUtils";
import { classifyEfficiency, classifyEffort, classifyProductivity } from "@/lib/analyticsUtils";

interface PerformanceLabelsProps {
  metrics: DerivedMetrics;
}

const levelColors: Record<PerformanceLevel, string> = {
  excellent: "bg-primary/15 text-primary border-primary/30",
  good: "bg-primary/10 text-primary border-primary/20",
  average: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  poor: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function PerformanceLabels({ metrics }: PerformanceLabelsProps) {
  const efficiency = classifyEfficiency(metrics.messagesPerMeeting);
  const effort = classifyEffort(metrics.leadsPerMeeting);
  const productivity = classifyProductivity(metrics.avgDailyMeetings);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="border-border bg-card">
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary">
            <Zap size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Eficiência Operacional</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-semibold text-foreground">{metrics.messagesPerMeeting} msgs/reunião</span>
              <Badge variant="secondary" className={`text-xs ${levelColors[efficiency.level]}`}>
                {efficiency.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary">
            <Users size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Esforço Comercial</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-semibold text-foreground">{metrics.leadsPerMeeting} leads/reunião</span>
              <Badge variant="secondary" className={`text-xs ${levelColors[effort.level]}`}>
                {effort.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary">
            <Activity size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Produtividade</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-semibold text-foreground">{metrics.avgDailyMeetings} reuniões/dia</span>
              <Badge variant="secondary" className={`text-xs ${levelColors[productivity.level]}`}>
                {productivity.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
