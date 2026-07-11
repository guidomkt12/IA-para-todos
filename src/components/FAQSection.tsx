import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "A OnTrigger substitui meu time comercial?",
    a: "Não. A OnTrigger atua antes da venda, estruturando a aquisição, iniciando conversas e qualificando leads para que o comercial receba oportunidades mais preparadas.",
  },
  {
    q: "Isso é só automação de mensagens?",
    a: "Não. A automação é só uma parte. O diferencial está na combinação entre dados segmentados, abordagem estratégica e IA conduzindo a qualificação.",
  },
  {
    q: "Serve para qualquer tipo de empresa?",
    a: "Faz mais sentido para negócios com venda consultiva, ticket relevante e necessidade de gerar reuniões com mais constância e menos esforço manual.",
  },
  {
    q: "A IA fala sozinha com o lead?",
    a: "A IA conduz a conversa dentro de uma lógica estratégica definida pela operação, ajudando a conscientizar, filtrar e encaminhar melhor o lead.",
  },
  {
    q: "O foco é volume ou qualidade?",
    a: "O foco é construir uma operação que una volume com critério, para gerar mais oportunidades sem sacrificar a qualidade da reunião.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="section-padding">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
            Perguntas <span className="gradient-text">frequentes</span>
          </h2>
        </motion.div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="card-surface px-6 border rounded-xl">
              <AccordionTrigger className="text-left font-semibold hover:no-underline hover:text-primary transition-colors py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
