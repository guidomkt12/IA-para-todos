import { ArrowDown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroMockup from "@/assets/operation-dashboard.png";

const WHATSAPP_URL = "https://wa.me/553173636108";

export default function HeroSection() {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center section-padding pt-28 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60" />

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-foreground animate-pulse-glow" />
              <span className="text-xs font-medium text-foreground">Aquisição comercial via WhatsApp</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 text-foreground">
              Gere reuniões mais qualificadas no WhatsApp{" "}
              <span className="gradient-text">sem depender de prospecção manual.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-4 leading-relaxed">
              A OnTrigger estrutura a sua aquisição comercial com dados segmentados, abordagem estratégica e IA que conduz, conscientiza e qualifica leads antes da etapa de vendas.
            </p>

            <p className="text-sm text-muted-foreground/80 mb-8">
              Menos esforço operacional. Mais constância comercial. Mais reuniões com contexto.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="cta" size="lg" asChild>
                <a href="#como-funciona" className="gap-2">
                  <ArrowDown size={20} />
                  Quero entender como funciona
                </a>
              </Button>
              <Button variant="ctaOutline" size="lg" asChild>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <MessageCircle size={20} />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/60 bg-card/40">
              <img
                src={heroMockup}
                alt="Dashboard da operação OnTrigger — aquisição comercial via WhatsApp"
                className="w-full aspect-[16/10] object-cover md:object-contain rounded-2xl"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
