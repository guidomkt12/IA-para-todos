import { motion } from "framer-motion";
import { UserX, Clock, Target, TrendingDown, Users, AlertTriangle } from "lucide-react";

const problems = [
  { icon: UserX, title: "Dependência de indicação", text: "Crescimento sem previsibilidade e pouca consistência na entrada de oportunidades." },
  { icon: Clock, title: "Prospecção manual demais", text: "Horas gastas em tarefas repetitivas que drenam o time comercial." },
  { icon: Target, title: "Leads frios ou mal segmentados", text: "Abordagens genéricas para quem não tem perfil, timing ou interesse." },
  { icon: Users, title: "Comercial sobrecarregado", text: "O time perde tempo com contatos que ainda não estão prontos para avançar." },
  { icon: TrendingDown, title: "Falta de constância", text: "Alguns períodos com agenda cheia e outros sem novas oportunidades." },
  { icon: AlertTriangle, title: "Dificuldade de escalar", text: "Para crescer, a operação precisa colocar cada vez mais esforço humano." },
];

export default function ProblemsSection() {
  return (
    <section className="section-padding relative">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">O cenário atual</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
            O problema não é só gerar contatos.{" "}
            <span className="gradient-text">É gerar conversas com potencial real.</span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-muted-foreground max-w-3xl mx-auto text-center mb-14"
        >
          Muitas empresas e agências até conseguem atrair atenção, mas ainda dependem de processos manuais, listas ruins, abordagens frias e um comercial sobrecarregado para transformar isso em reunião. O resultado é uma operação inconsistente, cansativa e difícil de escalar.
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="card-surface p-6 hover:border-primary/30 transition-colors group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <p.icon size={20} className="text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
