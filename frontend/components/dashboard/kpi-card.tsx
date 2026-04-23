import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

export function KPICard({ title, value, subtitle, icon: Icon, trend }: KPICardProps) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend === "up" && "text-emerald-600",
                  trend === "down" && "text-red-500",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
