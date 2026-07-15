import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { AppShell } from "@/components/app/AppShell";
import MarketingHome from "@/pages/MarketingHome";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import DashboardPage from "@/pages/app/DashboardPage";
import OnboardingPage from "@/pages/app/OnboardingPage";
import InboxPage from "@/pages/app/InboxPage";
import AgendaPage from "@/pages/app/AgendaPage";
import CustomersPage from "@/pages/app/CustomersPage";
import ServicesPage from "@/pages/app/ServicesPage";
import ProfessionalsPage from "@/pages/app/ProfessionalsPage";
import SimplePage from "@/pages/app/SimplePage";
import PlatformPage from "@/pages/platform/PlatformPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route element={<MarketingShell />}>
                <Route path="/" element={<MarketingHome />} />
                <Route path="/recursos" element={<MarketingHome />} />
                <Route path="/precos" element={<MarketingHome />} />
                <Route path="/entrar" element={<Login />} />
                <Route path="/cadastro" element={<Login />} />
                <Route path="/privacidade" element={<SimplePage title="Privacidade" description="Compromisso com LGPD, isolamento por empresa e mínimo acesso." />} />
                <Route path="/termos" element={<SimplePage title="Termos" description="Termos de uso da plataforma BelaFlow." />} />
              </Route>
              <Route path="/app" element={<AppShell />}>
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="onboarding" element={<OnboardingPage />} />
                <Route path="inbox" element={<InboxPage />} />
                <Route path="agenda" element={<AgendaPage />} />
                <Route path="clientes" element={<CustomersPage />} />
                <Route path="clientes/:id" element={<CustomersPage />} />
                <Route path="servicos" element={<ServicesPage />} />
                <Route path="profissionais" element={<ProfessionalsPage />} />
                <Route path="automacoes" element={<SimplePage title="Automações" description="Lembretes transacionais e confirmações serão processados por jobs idempotentes." />} />
                <Route path="assistente" element={<SimplePage title="Assistente de IA" description="Configuração por organização para nome, tom, regras, modelo e transferência humana." />} />
                <Route path="integracoes" element={<SimplePage title="Integrações" description="Conecte WhatsApp via backend seguro. Tokens e segredos nunca vão para o navegador." />} />
                <Route path="equipe" element={<SimplePage title="Equipe" description="Convites e papéis por organização." />} />
                <Route path="configuracoes" element={<OnboardingPage />} />
                <Route path="plano" element={<SimplePage title="Plano" description="Billing preparado para planos manuais nesta fase." />} />
              </Route>
              <Route path="/platform" element={<PlatformPage />} />
              <Route path="/platform/organizations" element={<PlatformPage />} />
              <Route path="/platform/usage" element={<PlatformPage />} />
              <Route path="/platform/errors" element={<PlatformPage />} />
              <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
