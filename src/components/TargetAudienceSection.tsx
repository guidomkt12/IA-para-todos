import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const items = [
  "Agências de marketing que querem gerar mais reuniões",
  "Empresas de serviço com venda consultiva",
  "Operações B2B que precisam de mais constância comercial",
  "Times que querem reduzir esforço manual sem perder qualidade",
  "Negócios que precisam levar leads mais preparados para o fechamento",
];

export default function TargetAudienceSection() {
  return (
    <section className="section-padding">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary text-sm font-semibold uppercase tracking-widest">Para quem faz sentido</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
              A OnTrigger faz sentido para quem precisa{" "}
              <span className="gradient-text">transformar aquisição em processo</span>
            </h2>
            <p className="text-muted-foreground">
              A estrutura da OnTrigger é ideal para operações que já entenderam que depender apenas de indicação, esforço manual ou abordagem genérica limita o crescimento.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 card-surface p-4 hover:border-primary/30 transition-colors">
                <CheckCircle2 size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium text-sm">{item}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
