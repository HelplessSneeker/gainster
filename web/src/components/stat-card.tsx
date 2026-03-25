import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  description?: string
  trend?: "up" | "down" | "neutral"
}

export function StatCard({ title, value, description, trend }: StatCardProps) {
  return (
    <Card
      size="sm"
      aria-label={
        trend === "up" ? `${title}: ${value}, gain`
        : trend === "down" ? `${title}: ${value}, loss`
        : `${title}: ${value}`
      }
      className={cn(
        trend === "up" && "bg-gain-muted",
        trend === "down" && "bg-loss-muted",
      )}
    >
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-xl font-bold font-mono tabular-nums md:text-2xl",
            trend === "up" && "text-gain",
            trend === "down" && "text-loss",
          )}
        >
          {value}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
