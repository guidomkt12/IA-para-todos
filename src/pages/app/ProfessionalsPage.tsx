import { FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createProfessional, getActiveOrganization, loadDashboardData } from "@/lib/beauty/repository";

export default function ProfessionalsPage() {
  const queryClient = useQueryClient();
  const organization = useQuery({ queryKey: ["org"], queryFn: getActiveOrganization });
  const data = useQuery({ queryKey: ["professionals", organization.data?.id], enabled: Boolean(organization.data?.id), queryFn: () => loadDashboardData(organization.data.id) });
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); await createProfessional(organization.data.id, { display_name: String(form.get("display_name")), email: String(form.get("email") || ""), phone: String(form.get("phone") || "") }); event.currentTarget.reset(); await queryClient.invalidateQueries(); }
  return <div className="grid gap-6 lg:grid-cols-[1fr_360px]"><section><h2 className="text-3xl font-black">Profissionais</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{data.data?.professionals.map((professional: any) => <div key={professional.id} className="rounded-3xl bg-white p-5"><strong>{professional.display_name}</strong><p>{professional.email || "Sem e-mail"}</p></div>)}</div></section><form onSubmit={submit} className="rounded-3xl bg-white p-5"><h3 className="font-bold">Novo profissional</h3><input name="display_name" required placeholder="Nome" className="mt-3 w-full rounded-xl border p-3" /><input name="email" placeholder="E-mail" className="mt-3 w-full rounded-xl border p-3" /><input name="phone" placeholder="Telefone" className="mt-3 w-full rounded-xl border p-3" /><button className="mt-4 rounded-full bg-stone-950 px-5 py-3 text-white">Salvar</button></form></div>;
}
