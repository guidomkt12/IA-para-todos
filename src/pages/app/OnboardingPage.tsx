import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createAvailability, createOrganization, createProfessional, createService, getActiveOrganization } from "@/lib/beauty/repository";

export default function OnboardingPage() {
  const queryClient = useQueryClient();
  const organization = useQuery({ queryKey: ["org"], queryFn: getActiveOrganization });
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let activeOrganization = organization.data;
    if (!activeOrganization) activeOrganization = await createOrganization({ name: String(form.get("name")), slug: String(form.get("slug")), business_type: String(form.get("business_type") || "salon"), phone: String(form.get("phone") || "") });
    const service = await createService(activeOrganization.id, { name: String(form.get("service")), duration_minutes: Number(form.get("duration")), price: Number(form.get("price")), category: String(form.get("category") || "") });
    const professional = await createProfessional(activeOrganization.id, { display_name: String(form.get("professional")), service_ids: [service.id] });
    await createAvailability(activeOrganization.id, { professional_id: professional.id, day_of_week: 1, start_time: "09:00", end_time: "18:00", break_start_time: "12:00", break_end_time: "13:00" });
    await queryClient.invalidateQueries();
    setMessage("Onboarding salvo no Supabase. Você pode sair e continuar depois.");
  }
  return <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6 rounded-3xl bg-white p-6"><h2 className="text-3xl font-black">Onboarding da operação</h2><div className="grid gap-4 md:grid-cols-2"><input name="name" required placeholder="Nome da empresa" className="rounded-xl border p-3" /><input name="slug" required placeholder="slug-da-empresa" className="rounded-xl border p-3" /><select name="business_type" className="rounded-xl border p-3"><option value="salon">Salão</option><option value="barbershop">Barbearia</option><option value="beauty_studio">Estúdio</option></select><input name="phone" placeholder="Telefone" className="rounded-xl border p-3" /><input name="service" required placeholder="Serviço principal" className="rounded-xl border p-3" /><input name="duration" required type="number" placeholder="Duração em minutos" className="rounded-xl border p-3" /><input name="price" required type="number" placeholder="Preço" className="rounded-xl border p-3" /><input name="category" placeholder="Categoria" className="rounded-xl border p-3" /><input name="professional" required placeholder="Profissional" className="rounded-xl border p-3" /></div><button className="rounded-full bg-stone-950 px-6 py-3 font-semibold text-white">Salvar no banco</button>{message ? <p className="rounded-xl bg-emerald-50 p-3 text-emerald-800">{message}</p> : null}</form>;
}
