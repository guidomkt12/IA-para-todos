import { useMemo, useState } from "react";
import { Bot, CalendarCheck, CheckCircle2, MessageSquare, Scissors, UserRoundCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MockMessagingProvider } from "@/lib/beauty/messaging";
import { createEmptyBeautyState, processMockInbound, seedVerticalFlow, takeoverConversation } from "@/lib/beauty/verticalFlow";

const provider = new MockMessagingProvider();

export default function Dashboard() {
  const seeded = useMemo(() => seedVerticalFlow(createEmptyBeautyState()), []);
  const [state, setState] = useState(seeded.state);
  const [log, setLog] = useState<string[]>(["Organização, serviço, profissional, disponibilidade e provider mock preparados."]);
  const organization = state.organizations[0];
  const service = state.services[0];
  const professional = state.professionals[0];
  const conversation = state.conversations[0];
  const appointment = state.appointments[0];

  async function simulateMessage() {
    const mutable = { ...state, processedEvents: state.processedEvents };
    await processMockInbound({
      state: mutable,
      provider,
      organizationId: organization.id,
      expectedSecret: "mock-secret",
      secret: "mock-secret",
      requestedStartAt: "2026-07-13T09:00:00.000Z",
      payload: { eventId: "evt_demo_1", messageId: "wamid_demo_1", from: "11999990000", to: "1133334444", text: "Oi, quero fazer corte amanhã" },
    });
    setState({ ...mutable, customers: [...mutable.customers], conversations: [...mutable.conversations], messages: [...mutable.messages], appointments: [...mutable.appointments] });
    setLog((items) => ["Webhook mock recebido: cliente, conversa, mensagem e agendamento foram criados de forma idempotente.", ...items]);
  }

  function takeover() {
    const mutable = { ...state, conversations: [...state.conversations] };
    takeoverConversation(mutable, organization.id, conversation.id);
    setState(mutable);
    setLog((items) => ["Humano assumiu a conversa: IA pausada e status alterado para atendimento humano.", ...items]);
  }

  const kpis = [
    { label: "Clientes no CRM", value: state.customers.length, icon: Users },
    { label: "Conversas", value: state.conversations.length, icon: MessageSquare },
    { label: "Agendamentos", value: state.appointments.length, icon: CalendarCheck },
    { label: "Mensagens", value: state.messages.length, icon: Bot },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-neutral-100 p-4 text-stone-950 md:p-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-3xl border bg-white/90 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">MVP vertical de beleza</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Atendimento inteligente para salões e barbearias</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Fluxo multiempresa com CRM, inbox, agenda e IA consultando serviços, profissionais e disponibilidade reais antes de confirmar horários.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={simulateMessage} className="bg-stone-950 hover:bg-stone-800">Simular WhatsApp</Button>
            <Button variant="outline" onClick={takeover} disabled={!conversation || conversation.status === "human_active"}>Assumir atendimento</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle><kpi.icon className="h-4 w-4" /></CardHeader><CardContent><div className="text-3xl font-bold">{kpi.value}</div></CardContent></Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Scissors className="h-5 w-5" /> Onboarding</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
            <p><strong>Empresa:</strong> {organization.name}</p>
            <p><strong>Serviço:</strong> {service.name} — {service.durationMinutes} min — {service.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            <p><strong>Profissional:</strong> {professional.displayName}</p>
            <p><strong>Disponibilidade:</strong> segunda, 09:00–18:00, pausa 12:00–13:00</p>
            <Badge variant="outline">Provider mock conectado</Badge>
          </CardContent></Card>

          <Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Inbox compartilhado</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
            {conversation ? <>
              <p><strong>Status:</strong> {conversation.status}</p>
              <p><strong>IA ativa:</strong> {conversation.aiEnabled ? "Sim" : "Não"}</p>
              <p><strong>Cliente:</strong> {state.customers[0]?.phoneE164}</p>
              <div className="rounded-xl bg-stone-100 p-3">{state.messages.map((m) => <p key={m.id}><strong>{m.senderType}:</strong> {m.textContent}</p>)}</div>
            </> : <p className="text-muted-foreground">Simule uma mensagem para criar a conversa.</p>}
          </CardContent></Card>

          <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5" /> Agenda</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
            {appointment ? <div className="rounded-xl border p-3"><p className="font-semibold">{service.name} com {professional.displayName}</p><p>{new Date(appointment.startAt).toLocaleString("pt-BR", { timeZone: "UTC" })}</p><p>{appointment.priceSnapshot.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><Badge className="mt-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CheckCircle2 className="mr-1 h-3 w-3" /> Confirmado pela IA</Badge></div> : <p className="text-muted-foreground">Nenhum agendamento criado ainda.</p>}
          </CardContent></Card>
        </div>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRoundCheck className="h-5 w-5" /> Log do corte vertical</CardTitle></CardHeader><CardContent><ul className="space-y-2 text-sm text-muted-foreground">{log.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}</ul></CardContent></Card>
      </section>
    </main>
  );
}
