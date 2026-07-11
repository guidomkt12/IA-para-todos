import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CalendarCheck, Send, Smartphone } from "lucide-react";

interface ScaleSimulatorProps {
  meetingsPerNumber: number;
  leadsPerNumber: number;
}

export default function ScaleSimulator({ meetingsPerNumber, leadsPerNumber }: ScaleSimulatorProps) {
  const [extra, setExtra] = useState(1);

  const projectedMeetings = Number((extra * meetingsPerNumber).toFixed(1));
  const projectedLeads = Number((extra * leadsPerNumber).toFixed(1));

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading text-foreground flex items-center gap-2">
          <Smartphone size={16} className="text-primary" />
          Simulador de Escala
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">E se eu adicionar +</span>
          <Input
            type="number"
            min={1}
            max={100}
            value={extra}
            onChange={(e) => setExtra(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 h-8 text-center bg-secondary border-border text-sm"
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">números conectados?</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarCheck size={12} /> Novas Reuniões
            </div>
            <p className="text-lg font-bold text-foreground">+{projectedMeetings}</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Send size={12} /> Novos Leads Atingidos
            </div>
            <p className="text-lg font-bold text-foreground">+{projectedLeads}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
