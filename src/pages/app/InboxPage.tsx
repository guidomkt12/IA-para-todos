import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/app/EmptyState";
import { getActiveOrganization, loadDashboardData, takeoverConversation } from "@/lib/beauty/repository";

export default function InboxPage() {
  const queryClient = useQueryClient();
  const organization = useQuery({ queryKey: ["org"], queryFn: getActiveOrganization });
  const data = useQuery({ queryKey: ["inbox", organization.data?.id], enabled: Boolean(organization.data?.id), queryFn: () => loadDashboardData(organization.data.id) });
  const conversations = data.data?.conversations ?? [];
  async function take(id: string) { await takeoverConversation(organization.data.id, id); await queryClient.invalidateQueries(); }
  return <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[360px_1fr_320px]"><aside className="rounded-3xl bg-white p-4"><h2 className="text-2xl font-black">Conversas</h2>{conversations.length ? conversations.map((conversation: any) => <button key={conversation.id} className="mt-3 w-full rounded-2xl border p-3 text-left"><strong>{conversation.customers?.full_name}</strong><p className="text-xs text-stone-500">{conversation.status} · {conversation.unread_count} não lidas</p></button>) : <EmptyState title="Sem conversas" description="Conecte o WhatsApp para receber mensagens no inbox compartilhado." />}</aside><section className="rounded-3xl bg-white p-5"><h3 className="font-bold">Histórico</h3><p className="mt-6 text-stone-500">Selecione uma conversa. Mensagens de texto, mídia e status serão lidos do Supabase.</p>{conversations[0] ? <button onClick={() => take(conversations[0].id)} className="mt-4 rounded-full bg-stone-950 px-5 py-3 text-white">Assumir atendimento</button> : null}</section><aside className="rounded-3xl bg-white p-5"><h3 className="font-bold">Cliente</h3><p className="mt-3 text-sm text-stone-500">Tags, notas, próximo agendamento e timeline.</p></aside></div>;
}
