import { motion } from "framer-motion";
import { Database, Crosshair, BrainCircuit, ShieldCheck, Layers } from "lucide-react";

const points = [
  { icon: Database, text: "Dados segmentados antes da abordagem" },
  { icon: Crosshair, text: "Mensagens orientadas ao contexto" },
  { icon: BrainCircuit, text: "IA que continua a conversa com lógica comercial" },
  { icon: ShieldCheck, text: "Qualificação antes da reunião" },
  { icon: Layers, text: "Mais organização e menos esforço manual no processo" },
];

export default function DifferentialsSection() {
  return (
    <section id="diferenciais" className="section-padding relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">O que nos diferencia</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
            A OnTrigger não entrega só automação.{" "}
            <span className="gradient-text">Entrega uma operação comercial mais inteligente.</span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-muted-foreground max-w-3xl mx-auto text-center mb-14"
        >
          Existe uma grande diferença entre apenas disparar mensagens e estruturar uma aquisição com contexto, segmentação, lógica de abordagem e qualificação por IA. A OnTrigger atua antes da reunião, preparando o lead para que o comercial entre na conversa com mais chance de avanço.
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {points.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-surface p-6 hover:border-primary/30 transition-all group flex items-start gap-4"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <p.icon size={20} className="text-primary" />
              </div>
              <p className="font-medium text-sm leading-relaxed pt-2">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
