import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useState } from "react";
import type { AnalyticsAlert } from "@/lib/analyticsUtils";

interface AnalyticsAlertsProps {
  alerts: AnalyticsAlert[];
}

const iconMap = {
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
};

const styleMap = {
  warning: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
  danger: "bg-destructive/10 border-destructive/30 text-destructive",
  info: "bg-primary/10 border-primary/30 text-primary",
};

export default function AnalyticsAlerts({ alerts }: AnalyticsAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  if (alerts.length === 0) return null;

  const visible = alerts.filter((_, i) => !dismissed.has(i));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        if (dismissed.has(i)) return null;
        const Icon = iconMap[alert.type];
        return (
          <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${styleMap[alert.type]}`}>
            <Icon size={18} className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{alert.title}</p>
              <p className="text-xs opacity-80">{alert.message}</p>
            </div>
            <button onClick={() => setDismissed((s) => new Set(s).add(i))} className="shrink-0 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
