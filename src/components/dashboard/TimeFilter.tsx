import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateRange } from "react-day-picker";

export type TimePeriod = "today" | "7d" | "30d" | "month" | "all" | "custom";

export interface DateFilter {
  period: TimePeriod;
  range?: { from: Date; to: Date };
}

interface TimeFilterProps {
  value: DateFilter;
  onChange: (v: DateFilter) => void;
}

const presets: { value: TimePeriod; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "month", label: "Este mês" },
  { value: "all", label: "Todo o período" },
  { value: "custom", label: "Personalizado" },
];

export default function TimeFilter({ value, onChange }: TimeFilterProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    value.range ? { from: value.range.from, to: value.range.to } : undefined
  );

  const handlePreset = (p: string) => {
    const period = p as TimePeriod;
    if (period !== "custom") {
      onChange({ period });
    } else {
      onChange({ period: "custom", range: dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined });
    }
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onChange({ period: "custom", range: { from: range.from, to: range.to } });
    }
  };

  const displayLabel = () => {
    if (value.period === "custom" && value.range) {
      return `${format(value.range.from, "dd/MM/yy")} – ${format(value.range.to, "dd/MM/yy")}`;
    }
    return presets.find((p) => p.value === value.period)?.label || "Período";
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value.period} onValueChange={handlePreset}>
        <SelectTrigger className="w-[170px] border-border bg-secondary text-sm">
          <CalendarIcon size={14} className="mr-2 text-muted-foreground" />
          <SelectValue>{displayLabel()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {presets.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.period === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal text-sm border-border bg-secondary",
                !dateRange?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon size={14} className="mr-2" />
              {dateRange?.from ? (
                dateRange.to ? (
                  `${format(dateRange.from, "dd/MM/yyyy")} – ${format(dateRange.to, "dd/MM/yyyy")}`
                ) : (
                  format(dateRange.from, "dd/MM/yyyy")
                )
              ) : (
                "Selecione o intervalo"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
