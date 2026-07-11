import { motion } from "framer-motion";
import { Database, Send, BrainCircuit, Filter, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: Database,
    step: "01",
    title: "Captação de leads segmentados",
    text: "Encontramos contatos com base em nicho, perfil, localização e critérios estratégicos da sua operação.",
  },
  {
    icon: Send,
    step: "02",
    title: "Abordagem estratégica",
    text: "A primeira mensagem não é aleatória. Ela é construída para gerar atenção e iniciar conversa com contexto.",
  },
  {
    icon: BrainCircuit,
    step: "03",
    title: "Conscientização por IA",
    text: "A IA conduz a conversa, ajuda o lead a entender o cenário, desperta interesse e reduz atrito.",
  },
  {
    icon: Filter,
    step: "04",
    title: "Qualificação por IA",
    text: "Antes de chegar ao comercial, o lead passa por filtros de interesse, aderência e momento.",
  },
  {
    icon: CalendarCheck,
    step: "05",
    title: "Encaminhamento para reunião",
    text: "Seu time recebe conversas mais preparadas, com mais contexto e maior chance de evolução.",
  },
];

export default function ProcessSection() {
  return (
    <section id="como-funciona" className="section-padding relative">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">Como funciona</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
            Como a operação <span className="gradient-text">funciona na prática</span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-muted-foreground max-w-2xl mx-auto text-center mb-14"
        >
          A OnTrigger organiza a aquisição em uma esteira clara, para transformar dados em conversas e conversas em reuniões mais preparadas.
        </motion.p>

        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />

          <div className="space-y-8">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative pl-16 md:pl-20"
              >
                <div className="absolute left-0 top-0 h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-card border border-primary/30 flex items-center justify-center">
                  <s.icon size={24} className="text-primary" />
                </div>

                <div className="card-surface p-6 md:p-8 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">ETAPA {s.step}</span>
                    <h3 className="text-lg font-bold">{s.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{s.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
