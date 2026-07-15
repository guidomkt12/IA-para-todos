import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, MessageSquare, Users, Wand2 } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import { getActiveOrganization, loadDashboardData } from "@/lib/beauty/repository";

export default function DashboardPage() {
  const organization = useQuery({ queryKey: ["org"], queryFn: getActiveOrganization });
  const dashboard = useQuery({ queryKey: ["dashboard", organization.data?.id], enabled: Boolean(organization.data?.id), queryFn: () => loadDashboardData(organization.data.id) });
  if (organization.isLoading) return <p>Carregando operação...</p>;
  if (!organization.data) return <EmptyState title="Crie sua empresa para começar" description="O dashboard usa dados persistidos no Supabase. Complete o onboarding para liberar agenda, CRM e inbox." action="Ir para onboarding" />;
  const data = dashboard.data;
  const kpis = [
    { label: "Agendamentos da semana", value: data?.appointments.length ?? 0, icon: CalendarCheck },
    { label: "Conversas abertas", value: data?.conversations.filter((item: any) => item.status !== "resolved").length ?? 0, icon: MessageSquare },
    { label: "Clientes cadastrados", value: data?.customers.length ?? 0, icon: Users },
    { label: "Agendados pela IA", value: data?.appointments.filter((item: any) => item.source === "ai").length ?? 0, icon: Wand2 },
  ];
  return <div className="space-y-6"><div><h2 className="text-3xl font-black">Visão geral</h2><p className="text-stone-500">Indicadores calculados a partir das tabelas da sua organização.</p></div><div className="grid gap-4 md:grid-cols-4">{kpis.map(({ label, value, icon: Icon }) => <div className="rounded-3xl bg-white p-5 shadow-sm" key={label}><Icon className="text-stone-400" /><p className="mt-4 text-sm text-stone-500">{label}</p><strong className="text-3xl">{value}</strong></div>)}</div><div className="grid gap-4 lg:grid-cols-2"><section className="rounded-3xl bg-white p-6"><h3 className="font-bold">Próximos agendamentos</h3>{data?.appointments.length ? data.appointments.map((appointment: any) => <p className="mt-3 rounded-2xl border p-3" key={appointment.id}>{new Date(appointment.start_at).toLocaleString("pt-BR")} · {appointment.services?.name}</p>) : <EmptyState title="Sem agendamentos nos próximos 7 dias" description="Cadastre serviços, profissionais e horários para começar a receber reservas." />}</section><section className="rounded-3xl bg-white p-6"><h3 className="font-bold">Conexão WhatsApp</h3>{data?.connection ? <p className="mt-3 rounded-2xl border p-3">{data.connection.name}: {data.connection.status}</p> : <EmptyState title="WhatsApp ainda não conectado" description="Conecte uma instância real pelas integrações. O mock fica restrito a desenvolvimento e testes." />}</section></div></div>;
}
