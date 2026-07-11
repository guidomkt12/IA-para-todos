import { parseMixedDate } from "./dateUtils";
import { format } from "date-fns";
import type { DateFilter } from "@/components/dashboard/TimeFilter";

// ── Period boundaries ────────────────────────────────────

export interface PeriodBounds {
  from: Date;
  to: Date;
  days: number;
}

export function getCurrentPeriodBounds(filter: DateFilter): PeriodBounds | null {
  const now = new Date();
  let from: Date;
  let to: Date = now;

  if (filter.period === "all") return null;

  if (filter.period === "today") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    to = now;
  } else if (filter.period === "custom" && filter.range) {
    from = filter.range.from;
    to = filter.range.to;
  } else if (filter.period === "7d") {
    from = new Date(now.getTime() - 7 * 86400000);
  } else if (filter.period === "30d") {
    from = new Date(now.getTime() - 30 * 86400000);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000));
  return { from, to, days };
}

export function getPreviousPeriodBounds(current: PeriodBounds): PeriodBounds {
  const durationMs = current.to.getTime() - current.from.getTime();
  const from = new Date(current.from.getTime() - durationMs);
  const to = new Date(current.from.getTime() - 1); // 1ms before current period
  const days = Math.max(1, Math.ceil(durationMs / 86400000));
  return { from, to, days };
}

// ── Filter items by period bounds ────────────────────────

export function filterByBounds<T extends Record<string, any>>(
  items: T[],
  bounds: PeriodBounds,
  dateKeys: string[]
): T[] {
  return items.filter((item) => {
    let raw: unknown = "";
    for (const k of dateKeys) {
      if (item[k]) { raw = item[k]; break; }
    }
    if (!raw) return false;
    const d = parseMixedDate(raw);
    return !!d && d >= bounds.from && d <= bounds.to;
  });
}

// ── Sum helper ───────────────────────────────────────────

export function sumQuantidade(items: any[] | null): number {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((acc, item) => {
    const val = Number(item.Quantidade || item.quantidade || 0);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);
}

// ── Growth calculation ───────────────────────────────────

export function calcGrowth(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

// ── Derived metrics ──────────────────────────────────────

export interface DerivedMetrics {
  leadsPerMeeting: number;
  messagesPerMeeting: number;
  conversionPerMessage: number;
  avgDailyLeads: number;
  avgDailyMessages: number;
  avgDailyMeetings: number;
}

export function calcDerivedMetrics(
  totalMessages: number,
  totalLeads: number,
  totalMeetings: number,
  days: number
): DerivedMetrics {
  const safeDays = Math.max(1, days);
  return {
    leadsPerMeeting: totalMeetings > 0 ? Number((totalLeads / totalMeetings).toFixed(1)) : 0,
    messagesPerMeeting: totalMeetings > 0 ? Number((totalMessages / totalMeetings).toFixed(1)) : 0,
    conversionPerMessage: totalLeads > 0 ? Number(((totalMeetings / totalLeads) * 100).toFixed(2)) : 0,
    avgDailyLeads: Number((totalLeads / safeDays).toFixed(1)),
    avgDailyMessages: Number((totalMessages / safeDays).toFixed(1)),
    avgDailyMeetings: Number((totalMeetings / safeDays).toFixed(1)),
  };
}

// ── Daily aggregation ────────────────────────────────────

export interface DailyRow {
  date: string;
  dateObj: Date;
  messages: number;
  leads: number;
  meetings: number;
  leadsPerMeeting: number;
  messagesPerMeeting: number;
  conversionPerMessage: number;
  msgsPerNumber: number;
  meetingsPerNumber: number;
}

export function buildDailyRows(
  iaData: any[],
  dispData: any[],
  reunData: any[],
  reunDateKeys: string[],
  activeInstances: number = 1
): DailyRow[] {
  const map = new Map<string, { messages: number; leads: number; meetings: number; dateObj: Date }>();

  const addToMap = (items: any[], key: string, field: "messages" | "leads") => {
    for (const item of items) {
      const d = parseMixedDate(item.Data || item.data || "");
      if (!d) continue;
      const k = format(d, "yyyy-MM-dd");
      const entry = map.get(k) || { messages: 0, leads: 0, meetings: 0, dateObj: d };
      entry[field] += Number(item.Quantidade || item.quantidade || 0) || 0;
      map.set(k, entry);
    }
  };

  addToMap(iaData, "Data", "messages");
  addToMap(dispData, "Data", "leads");

  for (const r of reunData) {
    let raw: unknown = "";
    for (const k of reunDateKeys) {
      if (r[k]) { raw = r[k]; break; }
    }
    const d = parseMixedDate(raw);
    if (!d) continue;
    const k = format(d, "yyyy-MM-dd");
    const entry = map.get(k) || { messages: 0, leads: 0, meetings: 0, dateObj: d };
    entry.meetings += 1;
    map.set(k, entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      date: format(v.dateObj, "dd/MM"),
      dateObj: v.dateObj,
      messages: v.messages,
      leads: v.leads,
      meetings: v.meetings,
      leadsPerMeeting: v.meetings > 0 ? Number((v.leads / v.meetings).toFixed(1)) : 0,
      messagesPerMeeting: v.meetings > 0 ? Number((v.messages / v.meetings).toFixed(1)) : 0,
      conversionPerMessage: v.leads > 0 ? Number(((v.meetings / v.leads) * 100).toFixed(2)) : 0,
      msgsPerNumber: Number((v.messages / activeInstances).toFixed(1)),
      meetingsPerNumber: Number((v.meetings / activeInstances).toFixed(1)),
    }));
}

// ── Rankings ─────────────────────────────────────────────

export function getTopDays(rows: DailyRow[], metric: keyof DailyRow, top: number, order: "asc" | "desc"): DailyRow[] {
  return [...rows]
    .filter((r) => r.meetings > 0) // only days with meetings
    .sort((a, b) => order === "desc" ? (b[metric] as number) - (a[metric] as number) : (a[metric] as number) - (b[metric] as number))
    .slice(0, top);
}

// ── Performance labels ───────────────────────────────────

export type PerformanceLevel = "excellent" | "good" | "average" | "poor";

export function classifyEfficiency(messagesPerMeeting: number): { level: PerformanceLevel; label: string } {
  if (messagesPerMeeting === 0) return { level: "average", label: "Sem dados" };
  if (messagesPerMeeting <= 100) return { level: "excellent", label: "Excelente" };
  if (messagesPerMeeting <= 200) return { level: "average", label: "Médio" };
  return { level: "poor", label: "Baixo" };
}

export function classifyEffort(leadsPerMeeting: number): { level: PerformanceLevel; label: string } {
  if (leadsPerMeeting === 0) return { level: "average", label: "Sem dados" };
  if (leadsPerMeeting <= 50) return { level: "excellent", label: "Bom" };
  if (leadsPerMeeting <= 100) return { level: "average", label: "Médio" };
  return { level: "poor", label: "Baixo" };
}

export function classifyProductivity(avgDailyMeetings: number): { level: PerformanceLevel; label: string } {
  if (avgDailyMeetings > 2) return { level: "excellent", label: "Excelente" };
  if (avgDailyMeetings >= 1) return { level: "average", label: "Médio" };
  return { level: "poor", label: "Ruim" };
}

// ── Alerts ───────────────────────────────────────────────

export interface AnalyticsAlert {
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
}

export function generateAlerts(
  currentMetrics: DerivedMetrics,
  previousMetrics: DerivedMetrics | null,
  instanceContext?: { currentActive: number; prevActive: number; currentMeetingsPerNum: number; prevMeetingsPerNum: number }
): AnalyticsAlert[] {
  const alerts: AnalyticsAlert[] = [];
  if (!previousMetrics) return alerts;

  if (currentMetrics.messagesPerMeeting > previousMetrics.messagesPerMeeting && previousMetrics.messagesPerMeeting > 0) {
    const pct = calcGrowth(currentMetrics.messagesPerMeeting, previousMetrics.messagesPerMeeting);
    alerts.push({
      type: "warning",
      title: "Ineficiência operacional detectada",
      message: `Mensagens/reunião subiu ${pct !== null ? pct + "%" : ""} — mais esforço para cada agendamento.`,
    });
  }

  if (currentMetrics.leadsPerMeeting > previousMetrics.leadsPerMeeting && previousMetrics.leadsPerMeeting > 0) {
    const pct = calcGrowth(currentMetrics.leadsPerMeeting, previousMetrics.leadsPerMeeting);
    alerts.push({
      type: "warning",
      title: "Base de leads pode estar fria",
      message: `Leads/reunião subiu ${pct !== null ? pct + "%" : ""} — mais leads necessários para cada agendamento.`,
    });
  }

  if (currentMetrics.conversionPerMessage < previousMetrics.conversionPerMessage && previousMetrics.conversionPerMessage > 0) {
    alerts.push({
      type: "danger",
      title: "Queda na conversão por mensagem",
      message: `Conversão caiu de ${previousMetrics.conversionPerMessage}% para ${currentMetrics.conversionPerMessage}%.`,
    });
  }

  // Bottleneck: messages up but meetings not keeping pace
  const msgGrowth = calcGrowth(currentMetrics.avgDailyMessages, previousMetrics.avgDailyMessages);
  const meetGrowth = calcGrowth(currentMetrics.avgDailyMeetings, previousMetrics.avgDailyMeetings);
  if (msgGrowth !== null && meetGrowth !== null && msgGrowth > 20 && meetGrowth < msgGrowth * 0.5) {
    alerts.push({
      type: "danger",
      title: "Gargalo de conversão",
      message: `Volume de mensagens subiu ${msgGrowth}%, mas reuniões apenas ${meetGrowth}%.`,
    });
  }

  // Instance idle alert
  if (instanceContext && instanceContext.prevActive > 0 && instanceContext.prevMeetingsPerNum > 0) {
    if (instanceContext.currentActive > instanceContext.prevActive && instanceContext.currentMeetingsPerNum < instanceContext.prevMeetingsPerNum) {
      alerts.push({
        type: "warning",
        title: "Ociosidade da estrutura",
        message: `Instâncias ativas subiram de ${instanceContext.prevActive} para ${instanceContext.currentActive}, mas reuniões/número caíram de ${instanceContext.prevMeetingsPerNum} para ${instanceContext.currentMeetingsPerNum}. A operação diluiu produtividade ao escalar.`,
      });
    }
  }

  return alerts;
}
