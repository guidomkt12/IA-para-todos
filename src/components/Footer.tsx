import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import logoDark from "@/assets/ontrigger-logo.png";
import logoWhite from "@/assets/ontrigger-logo-white.png";

const WHATSAPP_URL = "https://wa.me/553173636108";

const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Diferenciais", href: "#diferenciais" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Na prática", href: "#beneficios" },
  { label: "FAQ", href: "#faq" },
  { label: "Contato", href: "#contato" },
];

export default function Footer() {
  const { theme } = useTheme();
  const logo = theme === "dark" ? logoWhite : logoDark;

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div>
            <img src={logo} alt="OnTrigger" className="h-7 mb-4" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Operação de aquisição comercial com dados, abordagem e IA.
            </p>
          </div>

          <nav className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">Navegação</span>
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Fale conosco</span>
            <Button variant="outline" size="sm" asChild className="border-border text-foreground hover:bg-accent w-fit">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="gap-2">
                <MessageCircle size={16} />
                WhatsApp
              </a>
            </Button>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} OnTrigger. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
