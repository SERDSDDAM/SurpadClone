import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

export function FeatureCard({ title, description, icon, gradient }: FeatureCardProps) {
  return (
    <Card className={cn("bg-gradient-to-br text-white", gradient)}>
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-3">{icon}</div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="opacity-90 text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
