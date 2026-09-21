import {
  BarChart3,
  Lightbulb,
  Sparkles,
  CalendarDays,
  PenSquare,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/insights", label: "Insights", icon: Lightbulb },
  { href: "/dashboard/inspiracoes", label: "Inspirações", icon: Sparkles },
  { href: "/dashboard/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/dashboard/criacao", label: "Criação de Conteúdo", icon: PenSquare },
] as const;
