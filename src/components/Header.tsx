import { useState } from "react";
import { Menu, X, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import logoDark from "@/assets/ontrigger-logo.png";
import logoWhite from "@/assets/ontrigger-logo-white.png";

const WHATSAPP_URL = "https://wa.me/553173636108";

const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Diferenciais", href: "#diferenciais" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "FAQ", href: "#faq" },
  { label: "Contato", href: "#contato" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const logo = theme === "dark" ? logoWhite : logoDark;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="#inicio">
          <img src={logo} alt="OnTrigger" className="h-7" />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
          <ThemeToggle className="text-muted-foreground hover:text-foreground" />
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" asChild>
            <Link to="/login">
              <LogIn size={16} className="mr-2" />
              Acessar Painel
            </Link>
          </Button>
          <Button variant="cta" size="sm" asChild>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              Falar no WhatsApp
            </a>
          </Button>
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 pb-6 pt-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-2">
            <ThemeToggle className="text-muted-foreground hover:text-foreground" />
          </div>
          <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" asChild>
            <Link to="/login" onClick={() => setOpen(false)}>
              <LogIn size={16} className="mr-2" />
              Acessar Painel
            </Link>
          </Button>
          <Button variant="cta" asChild>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              Falar no WhatsApp
            </a>
          </Button>
        </nav>
      )}
    </header>
  );
}
