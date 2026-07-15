import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/app/EmptyState";
import { getActiveOrganization, loadDashboardData } from "@/lib/beauty/repository";

export default function CustomersPage() {
  const organization = useQuery({ queryKey: ["org"], queryFn: getActiveOrganization });
  const data = useQuery({ queryKey: ["customers", organization.data?.id], enabled: Boolean(organization.data?.id), queryFn: () => loadDashboardData(organization.data.id) });
  const customers = data.data?.customers ?? [];
  return <div className="space-y-6"><h2 className="text-3xl font-black">Clientes</h2>{customers.length ? <div className="overflow-hidden rounded-3xl bg-white"><table className="w-full text-sm"><thead className="bg-stone-100 text-left"><tr><th className="p-4">Nome</th><th>Telefone</th><th>Status</th><th>Faltas</th><th>Total gasto</th></tr></thead><tbody>{customers.map((customer: any) => <tr className="border-t" key={customer.id}><td className="p-4 font-medium">{customer.full_name}</td><td>{customer.phone_e164}</td><td>{customer.status}</td><td>{customer.no_show_count}</td><td>{Number(customer.estimated_lifetime_value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td></tr>)}</tbody></table></div> : <EmptyState title="Nenhum cliente cadastrado" description="Clientes serão criados por mensagens recebidas, cadastro manual ou agendamentos." />}</div>;
}
