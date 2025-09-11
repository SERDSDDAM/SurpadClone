import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  textColor?: string;
}

export function StatsCard({ title, value, icon, gradient, textColor = "text-white" }: StatsCardProps) {
  return (
    <Card className={cn("bg-gradient-to-br", gradient, textColor)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80 mb-1">{title}</p>
            <p className="text-3xl font-bold" data-testid={`stats-value-${title.replace(/\s+/g, '-').toLowerCase()}`}>
              {value}
            </p>
          </div>
          <div className="text-4xl opacity-60">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
