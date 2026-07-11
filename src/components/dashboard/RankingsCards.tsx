import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, AlertTriangle, Flame } from "lucide-react";
import type { DailyRow } from "@/lib/analyticsUtils";
import { getTopDays } from "@/lib/analyticsUtils";

interface RankingsCardsProps {
  rows: DailyRow[];
}

export default function RankingsCards({ rows }: RankingsCardsProps) {
  const bestConversion = getTopDays(rows, "conversionPerMessage", 3, "desc");
  const worstConversion = getTopDays(rows, "conversionPerMessage", 3, "asc");
  const highestEffort = getTopDays(rows, "messagesPerMeeting", 3, "desc");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <RankCard
        title="Top 3 — Melhor Conversão"
        icon={Trophy}
        items={bestConversion}
        metric={(r) => `${r.conversionPerMessage}%`}
        colorClass="text-primary"
      />
      <RankCard
        title="Top 3 — Pior Conversão"
        icon={AlertTriangle}
        items={worstConversion}
        metric={(r) => `${r.conversionPerMessage}%`}
        colorClass="text-destructive"
      />
      <RankCard
        title="Top 3 — Maior Esforço"
        icon={Flame}
        items={highestEffort}
        metric={(r) => `${r.messagesPerMeeting} msgs/reunião`}
        colorClass="text-amber-500"
      />
    </div>
  );
}

function RankCard({
  title,
  icon: Icon,
  items,
  metric,
  colorClass,
}: {
  title: string;
  icon: React.ElementType;
  items: DailyRow[];
  metric: (r: DailyRow) => string;
  colorClass: string;
}) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-heading text-foreground flex items-center gap-2">
          <Icon size={16} className={colorClass} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem dados</p>
        ) : (
          <ul className="space-y-2">
            {items.map((r, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground mr-1">{i + 1}.</span>
                  {r.date}
                </span>
                <span className={`font-mono font-semibold ${colorClass}`}>{metric(r)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
