import { useState, useMemo, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { useN8nData } from "@/hooks/useN8nData";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LogOut, Shield, MessageSquare, Send, CalendarCheck, Loader2, Settings,
  BarChart3, Users, MapPin, Percent, Hash, ArrowLeft, TrendingUp, Target,
  Smartphone, Signal, Bot, Upload,
} from "lucide-react";
import { parseMixedDate, formatDateBR } from "@/lib/dateUtils";
import {
  getCurrentPeriodBounds, getPreviousPeriodBounds, filterByBounds, sumQuantidade,
  calcGrowth, calcDerivedMetrics, buildDailyRows, generateAlerts,
  type DerivedMetrics,
} from "@/lib/analyticsUtils";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Bar, BarChart, Legend, Line, LineChart, ComposedChart } from "recharts";
import logoDark from "@/assets/ontrigger-logo.png";
import logoWhite from "@/assets/ontrigger-logo-white.png";
import DashboardDataTable from "@/components/dashboard/DashboardDataTable";
import KpiCard from "@/components/dashboard/KpiCard";
import TimeFilter, { type DateFilter } from "@/components/dashboard/TimeFilter";
import LeadsTable from "@/components/dashboard/LeadsTable";
import LeadsImportModal from "@/components/dashboard/LeadsImportModal";
import AnalyticsAlerts from "@/components/dashboard/AnalyticsAlerts";
import DailyPerformanceTable from "@/components/dashboard/DailyPerformanceTable";
import RankingsCards from "@/components/dashboard/RankingsCards";
import PerformanceLabels from "@/components/dashboard/PerformanceLabels";
import ScaleSimulator from "@/components/dashboard/ScaleSimulator";
import WhatsAppTab from "@/components/dashboard/WhatsAppTab";
import ChatTab from "@/components/dashboard/ChatTab";
import ConfigTab from "@/components/dashboard/ConfigTab";
import IATab from "@/components/dashboard/IATab";
import DisparosTab from "@/components/dashboard/DisparosTab";
import { n8nPost } from "@/lib/api";

// ── Helpers ────────────────────────────────────────────────────────────

const REUN_DATE_KEYS = ["Quando foi marcada", "Data de criação", "created_at", "createdAt", "data"];
const IA_DATE_KEYS = ["Data", "data"];
const DISP_DATE_KEYS = ["Data", "data"];

function filterByTime<T extends Record<string, any>>(items: T[], filter: DateFilter, dateKeys: string | string[]): T[] {
  if (!items) return [];
  const keys = Array.isArray(dateKeys) ? dateKeys : [dateKeys, "Data", "data"];
  const getValidDate = (item: T): Date | null => {
    for (const k of keys) {
      if (item[k]) {
        const d = parseMixedDate(item[k]);
        if (d) return d;
      }
    }
    return null;
  };
  if (filter.period === "all") return items.filter((item) => getValidDate(item) !== null);
  const now = new Date();
  let from: Date;
  let to: Date = now;
  if (filter.period === "today") {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return items.filter((item) => {
      const d = getValidDate(item);
      if (!d) return false;
      const dNorm = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return dNorm.getTime() === todayStart.getTime();
    });
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
  return items.filter((item) => {
    const d = getValidDate(item);
    return !!d && d >= from && d <= to;
  });
}

// ── Sidebar nav items ──────────────────────────────────────────────────────

type SectionId =
  | "overview" | "chat" | "analytics" | "contacts" | "cities"
  | "ia" | "disparos" | "whatsapp" | "config";

const NAV_ITEMS: { id: SectionId; icon: React.ElementType; label: string }[] = [
  { id: "overview",  icon: BarChart3,     label: "Visão Geral" },
  { id: "chat",      icon: MessageSquare, label: "Chat" },
  { id: "analytics", icon: TrendingUp,    label: "Análise" },
  { id: "contacts",  icon: Users,         label: "Contatos" },
  { id: "cities",    icon: MapPin,        label: "Cidades" },
  { id: "ia",        icon: Bot,           label: "IA" },
  { id: "disparos",  icon: Send,          label: "Disparos" },
  { id: "whatsapp",  icon: Smartphone,    label: "WhatsApp" },
  { id: "config",    icon: Settings,      label: "Configurações" },
];

const SECTION_TITLES: Record<SectionId, string> = {
  overview:  "Visão Geral",
  chat:      "Chat",
  analytics: "Análise",
  contacts:  "Contatos",
  cities:    "Cidades",
  ia:        "IA",
  disparos:  "Disparos",
  whatsapp:  "WhatsApp",
  config:    "Configurações",
};

// ── Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const {
    user, isAdmin, isGestor, allowedClients, permissions, loading: authLoading,
    clienteId,
    isTrialActive, trialDaysLeft,
    signOut, impersonateClienteId, setImpersonateClienteId,
  } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isImpersonating = !!impersonateClienteId;
  const logo = theme === "dark" ? logoWhite : logoDark;

  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [dateFilter, setDateFilter] = useState<DateFilter>({ period: "today" });
  const [showImportModal, setShowImportModal] = useState(false);

  const accessTracked = useRef(false);
  useEffect(() => {
    if (!clienteId || accessTracked.current) return;
    accessTracked.current = true;
    n8nPost("track-access", { cliente_id: clienteId, last_access: new Date().toISOString() }).catch(() => {});
  }, [clienteId]);


  const reunioesAllCols = ["Nome do Cliente", "Email do Cliente", "Data da Reunião"];
  const contatosAllCols = ["Nome", "Telefone", "Cidade"];
  const cidadesAllCols = ["Cidade", "Estado"];
  const [reunioesVisibleCols, setReunioesVisibleCols] = useState(reunioesAllCols);
  const [contatosVisibleCols, setContatosVisibleCols] = useState(["Nome", "Telefone", "Cidade"]);
  const [cidadesVisibleCols, setCidadesVisibleCols] = useState(cidadesAllCols);

  const { data: instancias, loading: loadInstancias } = useN8nData<any[]>(clienteId || undefined, "instancias");
  const { data: relatorioIa, loading: loadIa, error: errIa } = useN8nData<any[]>(clienteId || undefined, "relatorioia");
  const { data: relatorioDisparos, loading: loadDisp, error: errDisp } = useN8nData<any[]>(clienteId || undefined, "relatoriodisparos");
  const { data: reunioes, loading: loadReun, error: errReun } = useN8nData<any[]>(clienteId || undefined, "reunioes");
  const shouldFetchContacts = isImpersonating || permissions?.access_contacts;
  const shouldFetchCities = isImpersonating || permissions?.access_cities;
  const { data: contatos, loading: loadContatos } = useN8nData<any[]>(shouldFetchContacts ? clienteId || undefined : undefined, "contatos");
  const { data: cidades, loading: loadCidades } = useN8nData<any[]>(shouldFetchCities ? clienteId || undefined : undefined, "cidades");

  const activeInstances = useMemo(() => {
    if (!instancias || !Array.isArray(instancias)) return 1;
    const count = instancias.filter((i: any) => (i.Status || i.status || "").toLowerCase() === "ativo").length;
    return count || 1;
  }, [instancias]);

  const currentBounds = useMemo(() => getCurrentPeriodBounds(dateFilter), [dateFilter]);
  const previousBounds = useMemo(() => currentBounds ? getPreviousPeriodBounds(currentBounds) : null, [currentBounds]);

  const filteredIa = useMemo(() => filterByTime(relatorioIa || [], dateFilter, IA_DATE_KEYS), [relatorioIa, dateFilter]);
  const filteredDisp = useMemo(() => filterByTime(relatorioDisparos || [], dateFilter, DISP_DATE_KEYS), [relatorioDisparos, dateFilter]);
  const filteredReun = useMemo(() => {
    if (!reunioes || reunioes.length === 0) return [];
    if (dateFilter.period !== "custom") return filterByTime(reunioes, dateFilter, REUN_DATE_KEYS);
    if (!dateFilter.range?.from) return reunioes;
    const fromDate = new Date(dateFilter.range.from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = dateFilter.range.to ? new Date(dateFilter.range.to) : new Date(fromDate);
    toDate.setHours(23, 59, 59, 999);
    return reunioes.filter((r) => {
      const rawDate = r["Quando foi marcada"] || r["Data de criação"] || r["created_at"] || r.createdAt || r.data;
      if (!rawDate) return false;
      let parsedDate: Date | null = null;
      try { parsedDate = parseMixedDate(rawDate); } catch { parsedDate = new Date(rawDate); }
      if (!parsedDate || Number.isNaN(parsedDate.getTime())) return false;
      return parsedDate.getTime() >= fromDate.getTime() && parsedDate.getTime() <= toDate.getTime();
    });
  }, [reunioes, dateFilter]);

  const prevIa = useMemo(() => previousBounds ? filterByBounds(relatorioIa || [], previousBounds, IA_DATE_KEYS) : [], [relatorioIa, previousBounds]);
  const prevDisp = useMemo(() => previousBounds ? filterByBounds(relatorioDisparos || [], previousBounds, DISP_DATE_KEYS) : [], [relatorioDisparos, previousBounds]);
  const prevReun = useMemo(() => previousBounds ? filterByBounds(reunioes || [], previousBounds, REUN_DATE_KEYS) : [], [reunioes, previousBounds]);

  const totalIa = useMemo(() => sumQuantidade(filteredIa), [filteredIa]);
  const totalDisparos = useMemo(() => sumQuantidade(filteredDisp), [filteredDisp]);
  const totalReunioes = useMemo(() => filteredReun.length, [filteredReun]);

  const prevTotalIa = useMemo(() => sumQuantidade(prevIa), [prevIa]);
  const prevTotalDisparos = useMemo(() => sumQuantidade(prevDisp), [prevDisp]);
  const prevTotalReunioes = useMemo(() => prevReun.length, [prevReun]);

  const growthIa = useMemo(() => calcGrowth(totalIa, prevTotalIa), [totalIa, prevTotalIa]);
  const growthDisparos = useMemo(() => calcGrowth(totalDisparos, prevTotalDisparos), [totalDisparos, prevTotalDisparos]);
  const growthReunioes = useMemo(() => calcGrowth(totalReunioes, prevTotalReunioes), [totalReunioes, prevTotalReunioes]);

  const periodDays = currentBounds?.days || 30;
  const currentMetrics = useMemo<DerivedMetrics>(
    () => calcDerivedMetrics(totalIa, totalDisparos, totalReunioes, periodDays),
    [totalIa, totalDisparos, totalReunioes, periodDays]
  );
  const prevPeriodDays = previousBounds ? Math.max(1, Math.ceil((previousBounds.to.getTime() - previousBounds.from.getTime()) / 86400000)) : periodDays;
  const previousMetrics = useMemo<DerivedMetrics | null>(
    () => previousBounds ? calcDerivedMetrics(prevTotalIa, prevTotalDisparos, prevTotalReunioes, prevPeriodDays) : null,
    [prevTotalIa, prevTotalDisparos, prevTotalReunioes, prevPeriodDays, previousBounds]
  );

  const growthLeadsPerMeeting = useMemo(() => previousMetrics ? calcGrowth(currentMetrics.leadsPerMeeting, previousMetrics.leadsPerMeeting) : null, [currentMetrics, previousMetrics]);
  const growthMsgsPerMeeting = useMemo(() => previousMetrics ? calcGrowth(currentMetrics.messagesPerMeeting, previousMetrics.messagesPerMeeting) : null, [currentMetrics, previousMetrics]);
  const growthConvPerMsg = useMemo(() => previousMetrics ? calcGrowth(currentMetrics.conversionPerMessage, previousMetrics.conversionPerMessage) : null, [currentMetrics, previousMetrics]);
  const growthAvgDailyLeads = useMemo(() => previousMetrics ? calcGrowth(currentMetrics.avgDailyLeads, previousMetrics.avgDailyLeads) : null, [currentMetrics, previousMetrics]);
  const growthAvgDailyMsgs = useMemo(() => previousMetrics ? calcGrowth(currentMetrics.avgDailyMessages, previousMetrics.avgDailyMessages) : null, [currentMetrics, previousMetrics]);
  const growthAvgDailyMeetings = useMemo(() => previousMetrics ? calcGrowth(currentMetrics.avgDailyMeetings, previousMetrics.avgDailyMeetings) : null, [currentMetrics, previousMetrics]);

  const msgsPerNumber = useMemo(() => activeInstances > 0 ? Number((totalIa / activeInstances).toFixed(1)) : 0, [totalIa, activeInstances]);
  const leadsPerNumber = useMemo(() => activeInstances > 0 ? Number((totalDisparos / activeInstances).toFixed(1)) : 0, [totalDisparos, activeInstances]);
  const meetingsPerNumber = useMemo(() => activeInstances > 0 ? Number((totalReunioes / activeInstances).toFixed(1)) : 0, [totalReunioes, activeInstances]);

  const prevMsgsPerNumber = useMemo(() => activeInstances > 0 ? Number((prevTotalIa / activeInstances).toFixed(1)) : 0, [prevTotalIa, activeInstances]);
  const prevLeadsPerNumber = useMemo(() => activeInstances > 0 ? Number((prevTotalDisparos / activeInstances).toFixed(1)) : 0, [prevTotalDisparos, activeInstances]);
  const prevMeetingsPerNumber = useMemo(() => activeInstances > 0 ? Number((prevTotalReunioes / activeInstances).toFixed(1)) : 0, [prevTotalReunioes, activeInstances]);

  const growthMsgsPerNum = useMemo(() => previousBounds ? calcGrowth(msgsPerNumber, prevMsgsPerNumber) : null, [msgsPerNumber, prevMsgsPerNumber, previousBounds]);
  const growthLeadsPerNum = useMemo(() => previousBounds ? calcGrowth(leadsPerNumber, prevLeadsPerNumber) : null, [leadsPerNumber, prevLeadsPerNumber, previousBounds]);
  const growthMeetingsPerNum = useMemo(() => previousBounds ? calcGrowth(meetingsPerNumber, prevMeetingsPerNumber) : null, [meetingsPerNumber, prevMeetingsPerNumber, previousBounds]);

  const dailyRows = useMemo(
    () => buildDailyRows(filteredIa, filteredDisp, filteredReun, REUN_DATE_KEYS, activeInstances),
    [filteredIa, filteredDisp, filteredReun, activeInstances]
  );

  const alerts = useMemo(
    () => generateAlerts(currentMetrics, previousMetrics, previousBounds ? {
      currentActive: activeInstances, prevActive: activeInstances,
      currentMeetingsPerNum: meetingsPerNumber, prevMeetingsPerNum: prevMeetingsPerNumber,
    } : undefined),
    [currentMetrics, previousMetrics, activeInstances, meetingsPerNumber, prevMeetingsPerNumber, previousBounds]
  );

  const chartDataIa = useMemo(() => {
    if (!filteredIa.length) return [];
    return filteredIa
      .map((item) => ({ rawDate: parseMixedDate(item.Data || item.data || ""), quantidade: Number(item.Quantidade || item.quantidade || 0) }))
      .filter((i) => i.rawDate && !isNaN(i.quantidade))
      .sort((a, b) => a.rawDate!.getTime() - b.rawDate!.getTime())
      .map(({ rawDate, quantidade }) => ({ date: format(rawDate!, "dd/MM"), quantidade }));
  }, [filteredIa]);

  const chartDataDisparos = useMemo(() => {
    if (!filteredDisp.length) return [];
    return filteredDisp
      .map((item) => ({ rawDate: parseMixedDate(item.Data || item.data || ""), quantidade: Number(item.Quantidade || item.quantidade || 0) }))
      .filter((i) => i.rawDate && !isNaN(i.quantidade))
      .sort((a, b) => a.rawDate!.getTime() - b.rawDate!.getTime())
      .map(({ rawDate, quantidade }) => ({ date: format(rawDate!, "dd/MM"), quantidade }));
  }, [filteredDisp]);

  const chartDataReunioes = useMemo(() => {
    if (!filteredReun.length) return [];
    const byDate = new Map<string, { quantidade: number; ts: number }>();
    filteredReun.forEach((r) => {
      const raw = r["Quando foi marcada"] || r["Data de criação"] || r["created_at"] || r["createdAt"] || r.data || "";
      const parsedDate = parseMixedDate(raw);
      if (!parsedDate) return;
      const key = format(parsedDate, "dd/MM");
      const current = byDate.get(key);
      if (current) { current.quantidade += 1; } else { byDate.set(key, { quantidade: 1, ts: parsedDate.getTime() }); }
    });
    return Array.from(byDate.entries())
      .map(([date, v]) => ({ date, quantidade: v.quantidade, ts: v.ts }))
      .sort((a, b) => a.ts - b.ts)
      .map(({ date, quantidade }) => ({ date, quantidade }));
  }, [filteredReun]);

  const comparisonData = useMemo(() => {
    if (!previousMetrics) return [];
    return [
      { name: "Leads/Reunião", atual: currentMetrics.leadsPerMeeting, anterior: previousMetrics.leadsPerMeeting },
      { name: "Msgs/Reunião", atual: currentMetrics.messagesPerMeeting, anterior: previousMetrics.messagesPerMeeting },
      { name: "Conv/Msg (%)", atual: currentMetrics.conversionPerMessage, anterior: previousMetrics.conversionPerMessage },
    ];
  }, [currentMetrics, previousMetrics]);

  const chartMsgsPerNumber = useMemo(() => dailyRows.map((r) => ({ date: r.date, value: r.msgsPerNumber })), [dailyRows]);
  const chartMeetingsVsInstances = useMemo(() => dailyRows.map((r) => ({ date: r.date, reunioes: r.meetings, porNumero: r.meetingsPerNumber })), [dailyRows]);

  const operationStatus = useMemo(() => {
    if (!instancias || !Array.isArray(instancias) || instancias.length === 0) return null;
    return instancias[0]?.Status || instancias[0]?.status;
  }, [instancias]);

  const isDataLoading = loadIa || loadDisp || loadReun;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if ((isAdmin || isGestor) && !permissions && !isImpersonating) return <Navigate to="/admin" />;

  if (isGestor && isImpersonating && !allowedClients.includes(impersonateClienteId!)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Shield size={48} className="text-destructive" />
        <p className="text-foreground font-semibold text-lg">Acesso Negado</p>
        <p className="text-sm text-muted-foreground">Você não tem permissão para acessar este cliente.</p>
        <Button variant="outline" onClick={() => { setImpersonateClienteId(null); navigate("/admin"); }}>Voltar</Button>
      </div>
    );
  }

  const effectivePermissions = isImpersonating
    ? { access_contacts: true, access_cities: true }
    : permissions ?? { access_contacts: false, access_cities: false };

  const email = user?.email || "";
  const initials = email.slice(0, 2).toUpperCase();

  const visibleNav = NAV_ITEMS.filter(item => {
    if (item.id === "contacts" && !effectivePermissions.access_contacts) return false;
    if (item.id === "cities" && !effectivePermissions.access_cities) return false;
    return true;
  });

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <TimeFilter value={dateFilter} onChange={setDateFilter} />
              {operationStatus && (
                <Badge
                  variant={operationStatus.toLowerCase() === "ativo" ? "default" : "destructive"}
                  className={operationStatus.toLowerCase() === "ativo" ? "bg-primary/15 text-primary border-primary/30 hover:bg-primary/20 text-xs" : "text-xs"}
                >
                  {operationStatus.toLowerCase() === "ativo" ? "● Ativo" : "● Pausado"}
                </Badge>
              )}
            </div>
            <AnalyticsAlerts alerts={alerts} />
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <KpiCard title="Mensagens enviadas pela IA" value={totalIa} icon={MessageSquare} loading={loadIa} error={errIa} color="bg-primary" growth={growthIa} />
              <KpiCard title="Leads Abordados" value={totalDisparos} icon={Send} loading={loadDisp} error={errDisp} color="bg-primary" growth={growthDisparos} />
              <KpiCard title="Reuniões Agendadas" value={totalReunioes} icon={CalendarCheck} loading={loadReun} error={errReun} color="bg-amber-500" growth={growthReunioes} />
              <KpiCard title="Taxa de Conversão" value={`${currentMetrics.conversionPerMessage}%`} icon={Percent} loading={isDataLoading} error={errReun || errDisp} color="bg-primary" growth={growthConvPerMsg} />
              <KpiCard title="Leads/Reunião" value={currentMetrics.leadsPerMeeting} icon={Target} loading={isDataLoading} error={errReun || errDisp} color="bg-primary" growth={growthLeadsPerMeeting} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard title="Mensagens/Reunião" value={currentMetrics.messagesPerMeeting} icon={Hash} loading={isDataLoading} error={errIa || errReun} color="bg-primary" growth={growthMsgsPerMeeting} />
              <KpiCard title="Média Diária de Leads" value={currentMetrics.avgDailyLeads} icon={Send} loading={isDataLoading} error={errDisp} color="bg-primary" growth={growthAvgDailyLeads} />
              <KpiCard title="Média Diária de Mensagens" value={currentMetrics.avgDailyMessages} icon={MessageSquare} loading={isDataLoading} error={errIa} color="bg-primary" growth={growthAvgDailyMsgs} />
              <KpiCard title="Média Diária de Reuniões" value={currentMetrics.avgDailyMeetings} icon={CalendarCheck} loading={isDataLoading} error={errReun} color="bg-amber-500" growth={growthAvgDailyMeetings} />
            </div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-2">Capacidade da Estrutura</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard title="Instâncias Ativas" value={activeInstances} icon={Smartphone} loading={loadInstancias} error={null} color="bg-primary" growth={null} />
              <KpiCard title="Mensagens/Número" value={msgsPerNumber} icon={MessageSquare} loading={isDataLoading || loadInstancias} error={errIa} color="bg-primary" growth={growthMsgsPerNum} />
              <KpiCard title="Leads/Número" value={leadsPerNumber} icon={Send} loading={isDataLoading || loadInstancias} error={errDisp} color="bg-primary" growth={growthLeadsPerNum} />
              <KpiCard title="Reuniões/Número" value={meetingsPerNumber} icon={Signal} loading={isDataLoading || loadInstancias} error={errReun} color="bg-amber-500" growth={growthMeetingsPerNum} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><PerformanceLabels metrics={currentMetrics} /></div>
              <ScaleSimulator meetingsPerNumber={meetingsPerNumber} leadsPerNumber={leadsPerNumber} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Evolução de Mensagens da IA" loading={loadIa} data={chartDataIa} color="hsl(var(--primary))" label="Mensagens" />
              <ChartCard title="Evolução de Leads Abordados" loading={loadDisp} data={chartDataDisparos} color="hsl(var(--primary))" label="Leads" />
            </div>
            <ChartCard title="Evolução de Reuniões Agendadas" loading={loadReun} data={chartDataReunioes} color="hsl(45, 93%, 47%)" label="Reuniões" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardHeader><CardTitle className="text-base font-heading text-foreground">Mensagens por Número (Diário)</CardTitle></CardHeader>
                <CardContent>
                  {isDataLoading || loadInstancias ? (
                    <div className="flex items-center justify-center h-56"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
                  ) : chartMsgsPerNumber.length === 0 ? (
                    <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">Sem dados disponíveis</div>
                  ) : (
                    <ChartContainer config={{ value: { label: "Msgs/Número", color: "hsl(var(--primary))" } }} className="h-56 w-full">
                      <LineChart data={chartMsgsPerNumber}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardHeader><CardTitle className="text-base font-heading text-foreground">Reuniões x Números Conectados</CardTitle></CardHeader>
                <CardContent>
                  {isDataLoading || loadInstancias ? (
                    <div className="flex items-center justify-center h-56"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
                  ) : chartMeetingsVsInstances.length === 0 ? (
                    <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">Sem dados disponíveis</div>
                  ) : (
                    <ChartContainer config={{ reunioes: { label: "Reuniões", color: "hsl(45, 93%, 47%)" }, porNumero: { label: "Reuniões/Número", color: "hsl(var(--primary))" } }} className="h-56 w-full">
                      <ComposedChart data={chartMeetingsVsInstances}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="reunioes" fill="hsl(45, 93%, 47% / 0.6)" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="porNumero" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>
            <DashboardDataTable
              loading={loadReun} data={filteredReun} emptyMessage="Nenhuma reunião agendada"
              columns={reunioesAllCols} visibleColumns={reunioesVisibleCols} onColumnsChange={setReunioesVisibleCols}
              rowMapper={(r) => [
                r["Nome do Cliente"] || r.nome || "—",
                r["Email do Cliente"] || r.email || "—",
                formatDateBR(r["Data da reunião"] || r["Data da reuniao"] || r.data || ""),
              ]}
            />
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6">
            <TimeFilter value={dateFilter} onChange={setDateFilter} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DerivedChartCard title="Evolução — Leads/Reunião" data={dailyRows} dataKey="leadsPerMeeting" color="hsl(var(--primary))" label="Leads/Reunião" loading={isDataLoading} />
              <DerivedChartCard title="Evolução — Msgs/Reunião" data={dailyRows} dataKey="messagesPerMeeting" color="hsl(var(--primary))" label="Msgs/Reunião" loading={isDataLoading} />
            </div>
            <DerivedChartCard title="Evolução — Conversão por Mensagem (%)" data={dailyRows} dataKey="conversionPerMessage" color="hsl(45, 93%, 47%)" label="Conv/Msg %" loading={isDataLoading} />
            {comparisonData.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader><CardTitle className="text-base font-heading text-foreground">Comparativo — Período Atual vs Anterior</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={{ atual: { label: "Atual", color: "hsl(var(--primary))" }, anterior: { label: "Anterior", color: "hsl(var(--muted-foreground))" } }} className="h-64 w-full">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="atual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="anterior" fill="hsl(var(--muted-foreground) / 0.4)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
            <DailyPerformanceTable rows={dailyRows} loading={isDataLoading} />
            <RankingsCards rows={dailyRows} />
          </div>
        );

      case "contacts":
        return effectivePermissions.access_contacts ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowImportModal(true)}>
                <Upload size={14} />
                Importar CSV
              </Button>
            </div>
            <LeadsTable loading={loadContatos} data={contatos} columns={contatosAllCols} visibleColumns={contatosVisibleCols} onColumnsChange={setContatosVisibleCols} />
          </div>
        ) : null;

      case "cities":
        return effectivePermissions.access_cities ? (
          <div className="space-y-4">
            <DashboardDataTable
              loading={loadCidades} data={cidades} emptyMessage="Nenhuma praça disponível"
              columns={cidadesAllCols} visibleColumns={cidadesVisibleCols} onColumnsChange={setCidadesVisibleCols}
              rowMapper={(c) => [c.Cidade || c.cidade || "—", c.Estado || c.estado || "—"]}
            />
          </div>
        ) : null;

      case "ia":
        return <IATab clienteId={clienteId} />;

      case "disparos":
        return <DisparosTab clienteId={clienteId} />;

      case "whatsapp":
        return <WhatsAppTab clienteId={clienteId} />;

      case "chat":
        return <ChatTab clienteId={clienteId} instancias={[]} />;

      case "config":
        return <ConfigTab clienteId={clienteId} />;

      default:
        return null;
    }
  };

  const isChat = activeSection === "chat";

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {isImpersonating && (
        <div className="flex-shrink-0 bg-amber-500/15 border-b border-amber-500/30 py-2 px-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              👁 Visualizando como cliente: <span className="font-mono font-bold">{impersonateClienteId}</span>
            </span>
            <Button
              variant="ghost" size="sm"
              className="text-amber-700 dark:text-amber-400 hover:text-amber-900 gap-2"
              onClick={() => { setImpersonateClienteId(null); navigate("/admin"); }}
            >
              <ArrowLeft size={14} /> Voltar ao Admin
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
          <div className="px-4 py-4 border-b border-border flex items-center justify-between">
            <img src={logo} alt="OnTrigger" className="h-5" />
            <div className="flex items-center gap-1">
              {loadInstancias && <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />}
              <ThemeToggle className="text-muted-foreground hover:text-foreground h-7 w-7" />
            </div>
          </div>

          <nav className="flex-1 py-3 space-y-0.5">
            {visibleNav.map(item => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg mx-2 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  style={{ width: "calc(100% - 16px)" }}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{email}</p>
                {isAdmin && <p className="text-[10px] text-muted-foreground">Admin</p>}
              </div>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
                onClick={signOut}
                title="Sair"
              >
                <LogOut size={14} />
              </Button>
            </div>
          </div>
        </aside>

        <main className={`flex-1 overflow-y-auto ${isChat ? "" : "p-6"}`}>
          {!isChat && (
            <>
              <h2 className="text-xl font-heading font-semibold text-foreground mb-6">
                {SECTION_TITLES[activeSection]}
              </h2>
              {isTrialActive && (
                <div className="mb-5 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                  <span className="text-sm text-amber-600 dark:text-amber-400">
                    ⏳ <strong>Período de teste:</strong> {trialDaysLeft} dia{trialDaysLeft !== 1 ? "s" : ""} restante{trialDaysLeft !== 1 ? "s" : ""} · 1 número · 10 disparos/dia
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500/50 text-amber-600 h-7 text-xs flex-shrink-0"
                    onClick={() => setActiveSection("config")}
                  >
                    Ver planos
                  </Button>
                </div>
              )}
            </>
          )}
          {renderSection()}
        </main>
      </div>
      <LeadsImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        clienteId={clienteId}
        onSuccess={() => setShowImportModal(false)}
      />
    </div>
  );
}

// ── Chart helpers ────────────────────────────────────────────────────────────

function ChartCard({ title, loading, data, color, label }: {
  title: string; loading: boolean; data: { date: string; quantidade: number }[]; color: string; label: string;
}) {
  return (
    <Card className="border-border bg-card">
      <CardHeader><CardTitle className="text-base font-heading text-foreground">{title}</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-56"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">Sem dados disponíveis</div>
        ) : (
          <ChartContainer config={{ quantidade: { label, color } }} className="h-56 w-full">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="quantidade" stroke={color} fill={`${color.replace(")", " / 0.15)")}`} strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function DerivedChartCard({ title, data, dataKey, color, label, loading }: {
  title: string; data: { date: string; [k: string]: any }[]; dataKey: string; color: string; label: string; loading: boolean;
}) {
  const filtered = data.filter((r) => r[dataKey] > 0);
  return (
    <Card className="border-border bg-card">
      <CardHeader><CardTitle className="text-base font-heading text-foreground">{title}</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-56"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">Sem dados disponíveis</div>
        ) : (
          <ChartContainer config={{ [dataKey]: { label, color } }} className="h-56 w-full">
            <AreaChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey={dataKey} stroke={color} fill={`${color.replace(")", " / 0.15)")}`} strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
