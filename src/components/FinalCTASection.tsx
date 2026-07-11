import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WHATSAPP_URL = "https://wa.me/553173636108";

export default function FinalCTASection() {
  return (
    <section id="contato" className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.04] to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />

      <div className="container mx-auto relative z-10 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Sua operação não precisa de mais improviso.{" "}
            <span className="gradient-text">Precisa de uma estrutura que gere conversas com potencial real.</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Se faz sentido construir uma aquisição mais previsível, segmentada e com qualificação por IA, fale com a OnTrigger e entenda como essa operação pode funcionar no seu negócio.
          </p>
          <Button variant="cta" size="lg" asChild className="text-base px-10 py-6 h-auto">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="gap-3">
              <MessageCircle size={22} />
              Chamar no WhatsApp
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
