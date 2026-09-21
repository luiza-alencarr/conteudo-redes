import { Lightbulb } from "lucide-react";
import { PlaceholderSection } from "@/components/dashboard/placeholder-section";

export default function InsightsPage() {
  return (
    <PlaceholderSection
      icon={Lightbulb}
      title="Insights"
      description="Análises sobre desempenho de conteúdo, audiência e tendências a partir dos dados coletados."
    />
  );
}
