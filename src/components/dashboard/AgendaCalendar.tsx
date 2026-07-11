import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, User, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { parseMixedDate } from "@/lib/dateUtils";

// ── Types ────────────────────────────────────────────────
interface Meeting {
  [key: string]: any;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  email: string;
  phone: string;
  raw: Meeting;
}

interface AgendaCalendarProps {
  meetings: Meeting[] | null;
  loading: boolean;
}

// ── Helpers ──────────────────────────────────────────────
function getEventDate(meeting: Meeting): Date | null {
  const raw =
    meeting["Data da reunião"] ||
    meeting["Data da reuniao"] ||
    meeting["Data do Evento"] ||
    meeting["event_date"] ||
    meeting["Data da Reunião"] ||
    meeting["data"] ||
    "";
  return parseMixedDate(raw);
}

// ── Component ────────────────────────────────────────────
export default function AgendaCalendar({ meetings, loading }: AgendaCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dayEventsDialog, setDayEventsDialog] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);

  const events = useMemo<CalendarEvent[]>(() => {
    if (!meetings || !Array.isArray(meetings)) return [];
    return meetings
      .map((m, i) => {
        const date = getEventDate(m);
        if (!date) return null;
        return {
          id: `meeting-${i}`,
          title: m["Nome do Cliente"] || m.nome || m.Nome || "Reunião",
          date,
          email: m["Email do Cliente"] || m.email || m.Email || "",
          phone: m["Telefone"] || m.telefone || m.Telefone || "",
          raw: m,
        };
      })
      .filter(Boolean) as CalendarEvent[];
  }, [meetings]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const start = startOfWeek(monthStart, { locale: ptBR });
    const end = endOfWeek(monthEnd, { locale: ptBR });

    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((ev) => {
      const key = format(ev.date, "yyyy-MM-dd");
      const arr = map.get(key) || [];
      arr.push(ev);
      map.set(key, arr);
    });
    return map;
  }, [events]);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const today = new Date();

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold text-foreground capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setCurrentMonth(new Date())}>
            Hoje
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <Card className="border-border bg-card overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDay.get(key) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[80px] md:min-h-[100px] border-b border-r border-border p-1 transition-colors",
                    !isCurrentMonth && "bg-muted/30",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isToday && "bg-primary text-primary-foreground",
                        !isCurrentMonth && "text-muted-foreground/50",
                        isCurrentMonth && !isToday && "text-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-primary/10 text-primary border-0">
                        {dayEvents.length}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={cn(
                          "w-full text-left text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate transition-colors",
                          "bg-primary/15 text-primary hover:bg-primary/25 font-medium"
                        )}
                      >
                        <span className="hidden md:inline">
                          {format(ev.date, "HH:mm")} –{" "}
                        </span>
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <button
                        onClick={() => setDayEventsDialog({ date: day, events: dayEvents })}
                        className="text-[10px] text-primary hover:underline px-1 cursor-pointer"
                      >
                        +{dayEvents.length - 2} mais
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Day events list dialog */}
      <Dialog open={!!dayEventsDialog} onOpenChange={() => setDayEventsDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground font-heading">
              {dayEventsDialog && format(dayEventsDialog.date, "dd 'de' MMMM", { locale: ptBR })} — {dayEventsDialog?.events.length} reuniões
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {dayEventsDialog?.events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => { setDayEventsDialog(null); setSelectedEvent(ev); }}
                className="w-full text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground">{format(ev.date, "HH:mm")}</span>
                  <span className="text-sm text-foreground">— {ev.title}</span>
                </div>
                {ev.phone && <p className="text-xs text-muted-foreground mt-1 ml-5">{ev.phone}</p>}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground font-heading">Detalhes da Reunião</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <User size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedEvent.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedEvent.date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="space-y-2 bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-muted-foreground" />
                  <span className="text-foreground">{format(selectedEvent.date, "HH:mm")}</span>
                </div>
                {selectedEvent.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-muted-foreground" />
                    <span className="text-foreground">{selectedEvent.email}</span>
                  </div>
                )}
                {selectedEvent.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-muted-foreground" />
                    <span className="text-foreground">{selectedEvent.phone}</span>
                  </div>
                )}
              </div>

              {Object.entries(selectedEvent.raw)
                .filter(([k]) => !["Nome do Cliente", "nome", "Nome", "Email do Cliente", "email", "Email", "Telefone", "telefone"].includes(k))
                .slice(0, 5)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="text-foreground font-medium truncate ml-4 max-w-[200px]">{String(v || "—")}</span>
                  </div>
                ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
