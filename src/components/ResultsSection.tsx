import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const bullets = [
  "Mais constância na geração de oportunidades",
  "Menos dependência de prospecção manual",
  "Melhor aproveitamento do time comercial",
  "Leads mais preparados antes da reunião",
  "Mais clareza de processo e menos improviso operacional",
  "Escala com mais inteligência, não só com mais esforço",
];

export default function ResultsSection() {
  return (
    <section id="beneficios" className="section-padding relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="container mx-auto relative z-10 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">Na prática</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
            O que muda quando a aquisição{" "}
            <span className="gradient-text">deixa de ser improvisada</span>
          </h2>
        </motion.div>

        <div className="space-y-4">
          {bullets.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 card-surface p-5 hover:border-primary/30 transition-colors"
            >
              <CheckCircle2 size={20} className="text-primary mt-0.5 flex-shrink-0" />
              <span className="font-medium">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
