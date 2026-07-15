import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, MessageSquare, Scissors, Users } from "lucide-react";

const featureCards = [
  { title: "Inbox compartilhado", icon: MessageSquare },
  { title: "Agendamento pelo WhatsApp", icon: CalendarCheck },
  { title: "CRM de clientes", icon: Users },
];

export default function MarketingHome() {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm">Atendimento inteligente para beleza</p>
          <h1 className="text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">Seu salão atendendo e agendando até quando ninguém está online.</h1>
          <p className="mt-6 max-w-2xl text-lg text-stone-600">Organize WhatsApp, clientes, profissionais e agenda em uma plataforma premium feita para salões, barbearias e estúdios.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/cadastro" className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-6 py-3 font-semibold text-white">Criar conta <ArrowRight size={18} /></Link><Link to="/recursos" className="rounded-full border border-stone-300 px-6 py-3 font-semibold">Ver recursos</Link></div>
        </div>
        <div className="rounded-[2rem] border bg-white p-4 shadow-2xl"><div className="rounded-[1.5rem] bg-stone-950 p-5 text-white"><div className="mb-4 flex items-center justify-between"><span>Inbox da recepção</span><span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs text-emerald-200">IA ativa</span></div>{["Qual valor do corte?", "O corte feminino custa R$ 120 e dura 60 min.", "Tem horário amanhã com Ana?", "Tenho 09:00 e 15:30. Qual prefere?"].map((message, index) => <div key={message} className={`mb-3 max-w-[85%] rounded-2xl px-4 py-3 text-sm ${index % 2 ? "ml-auto bg-white text-stone-950" : "bg-white/10"}`}>{message}</div>)}</div></div>
      </section>
      <section className="bg-white py-16"><div className="mx-auto grid max-w-7xl gap-4 px-5 md:grid-cols-3">{featureCards.map(({ title, icon: Icon }) => <div key={title} className="rounded-3xl border p-6"><Icon /><h3 className="mt-4 text-xl font-bold">{title}</h3><p className="mt-2 text-stone-600">Dados persistidos no Supabase, com isolamento por empresa e experiência responsiva.</p></div>)}</div></section>
      <section className="mx-auto max-w-7xl px-5 py-16"><h2 className="text-4xl font-black">Uma operação em três etapas</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{["Conecte sua empresa", "Configure serviços e horários", "Atenda e agende pelo WhatsApp"].map((step, index) => <div className="rounded-3xl bg-white p-6" key={step}><span className="text-3xl font-black text-stone-300">0{index + 1}</span><h3 className="mt-4 font-bold">{step}</h3></div>)}</div></section>
      <section className="bg-stone-950 py-16 text-white"><div className="mx-auto max-w-7xl px-5"><h2 className="text-4xl font-black">Planos simples para começar</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{["Essencial", "Profissional", "Premium"].map((plan) => <div className="rounded-3xl border border-white/10 p-6" key={plan}><Scissors /><h3 className="mt-4 text-2xl font-bold">{plan}</h3><p className="mt-2 text-white/60">CRM, agenda, inbox e assistente configurável.</p></div>)}</div></div></section>
      <section className="mx-auto max-w-4xl px-5 py-16"><h2 className="text-4xl font-black">Perguntas frequentes</h2>{["Funciona para barbearia?", "A IA inventa preço?", "Posso assumir a conversa?"].map((question) => <details className="mt-4 rounded-2xl bg-white p-5" key={question}><summary className="font-semibold">{question}</summary><p className="mt-2 text-stone-600">Sim. A plataforma usa dados cadastrados e permite transferência para humano.</p></details>)}</section>
      <footer className="border-t bg-white px-5 py-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row"><strong>BelaFlow</strong><span className="text-sm text-stone-500">Privacidade • Termos • Segurança LGPD</span></div></footer>
    </main>
  );
}
