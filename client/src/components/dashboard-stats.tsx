import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Star, MapPin, TrendingUp, TrendingDown } from "lucide-react";

interface DashboardStatsProps {
  stats?: {
    todaySales: number;
    ordersToday: number;
    averageRating: number;
    activeLocations: number;
  };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  if (!stats) {
    return null; // Don't show anything if there are no stats yet
  }

  const statCards = [
    {
      title: "Today's Sales",
      value: `$${stats.todaySales.toFixed(2)}`,
      change: "+12% from yesterday",
      changeType: "positive" as const,
      icon: DollarSign,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Orders Today",
      value: stats.ordersToday.toString(),
      change: "+8% from yesterday",
      changeType: "positive" as const,
      icon: ShoppingCart,
      bgColor: "bg-secondary/10",
      iconColor: "text-secondary",
    },
    {
      title: "Average Rating",
      value: stats.averageRating.toFixed(1),
      change: "Based on recent reviews",
      changeType: "neutral" as const,
      icon: Star,
      bgColor: "bg-accent/10",
      iconColor: "text-accent",
    },
    {
      title: "Active Locations",
      value: stats.activeLocations.toString(),
      change: "Currently operating",
      changeType: "neutral" as const,
      icon: MapPin,
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.changeType === "positive" ? TrendingUp : 
                         stat.changeType === "negative" ? TrendingDown : null;
        
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 flex items-center ${
                    stat.changeType === "positive" ? "text-green-600" :
                    stat.changeType === "negative" ? "text-red-600" :
                    "text-muted-foreground"
                  }`}>
                    {TrendIcon && <TrendIcon className="h-3 w-3 mr-1" />}
                    {stat.change}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
