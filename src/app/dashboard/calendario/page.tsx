import { CalendarDays } from "lucide-react";
import { PlaceholderSection } from "@/components/dashboard/placeholder-section";

export default function CalendarioPage() {
  return (
    <PlaceholderSection
      icon={CalendarDays}
      title="Calendário"
      description="Calendário editorial com datas sugeridas, rede, tipo de conteúdo e status de cada item."
    />
  );
}
