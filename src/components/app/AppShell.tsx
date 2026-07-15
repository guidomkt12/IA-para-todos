import { NavLink, Outlet } from "react-router-dom";
import { Bell, Bot, CalendarDays, ContactRound, CreditCard, Home, MessageSquare, PlugZap, Scissors, Settings, Sparkles, Users, Workflow } from "lucide-react";

const navItems = [
  { to: "/app/dashboard", label: "Visão geral", icon: Home },
  { to: "/app/inbox", label: "Conversas", icon: MessageSquare },
  { to: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/app/clientes", label: "Clientes", icon: ContactRound },
  { to: "/app/servicos", label: "Serviços", icon: Scissors },
  { to: "/app/profissionais", label: "Profissionais", icon: Users },
  { to: "/app/automacoes", label: "Automações", icon: Workflow },
  { to: "/app/assistente", label: "Assistente de IA", icon: Bot },
  { to: "/app/integracoes", label: "Integrações", icon: PlugZap },
  { to: "/app/equipe", label: "Equipe", icon: Users },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
  { to: "/app/plano", label: "Plano", icon: CreditCard },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r bg-white/95 p-5 lg:block">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-stone-950 text-white"><Sparkles size={20} /></div>
          <div><p className="text-lg font-bold">BelaFlow</p><p className="text-xs text-stone-500">Organização ativa</p></div>
        </div>
        <div className="mt-6 rounded-2xl border bg-emerald-50 p-3 text-sm text-emerald-900"><strong>WhatsApp:</strong> aguardando conexão real</div>
        <nav className="mt-6 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? "bg-stone-950 text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"}`}>
              <Icon size={17} />{label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <header className="sticky top-0 z-10 border-b bg-white/90 px-4 py-3 backdrop-blur lg:ml-72">
        <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.25em] text-stone-400">Operação</p><h1 className="font-semibold">Atendimento, agenda e clientes</h1></div><div className="flex items-center gap-3"><Bell size={18} /><div className="h-9 w-9 rounded-full bg-stone-200" /></div></div>
      </header>
      <main className="p-4 pb-24 lg:ml-72 lg:p-8"><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-white p-2 lg:hidden">
        {navItems.slice(0, 5).map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className="grid place-items-center gap-1 rounded-xl p-2 text-[10px] text-stone-600"><Icon size={18} />{label.split(" ")[0]}</NavLink>)}
      </nav>
    </div>
  );
}
