import { FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createService, getActiveOrganization, loadDashboardData } from "@/lib/beauty/repository";

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const organization = useQuery({ queryKey: ["org"], queryFn: getActiveOrganization });
  const data = useQuery({ queryKey: ["services", organization.data?.id], enabled: Boolean(organization.data?.id), queryFn: () => loadDashboardData(organization.data.id) });
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); await createService(organization.data.id, { name: String(form.get("name")), duration_minutes: Number(form.get("duration")), price: Number(form.get("price")), category: String(form.get("category") || "") }); event.currentTarget.reset(); await queryClient.invalidateQueries(); }
  return <div className="grid gap-6 lg:grid-cols-[1fr_360px]"><section><h2 className="text-3xl font-black">Serviços</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{data.data?.services.map((service: any) => <div key={service.id} className="rounded-3xl bg-white p-5"><strong>{service.name}</strong><p>{service.duration_minutes} min · {Number(service.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>)}</div></section><form onSubmit={submit} className="rounded-3xl bg-white p-5"><h3 className="font-bold">Novo serviço</h3><input name="name" required placeholder="Nome" className="mt-3 w-full rounded-xl border p-3" /><input name="duration" required type="number" placeholder="Duração" className="mt-3 w-full rounded-xl border p-3" /><input name="price" required type="number" placeholder="Preço" className="mt-3 w-full rounded-xl border p-3" /><input name="category" placeholder="Categoria" className="mt-3 w-full rounded-xl border p-3" /><button className="mt-4 rounded-full bg-stone-950 px-5 py-3 text-white">Salvar</button></form></div>;
}
