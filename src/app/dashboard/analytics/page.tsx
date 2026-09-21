import { BarChart3 } from "lucide-react";
import { PlaceholderSection } from "@/components/dashboard/placeholder-section";

export default function AnalyticsPage() {
  return (
    <PlaceholderSection
      icon={BarChart3}
      title="Analytics"
      description="Métricas consolidadas de posts (curtidas, comentários, views, alcance) por rede e período."
    />
  );
}
