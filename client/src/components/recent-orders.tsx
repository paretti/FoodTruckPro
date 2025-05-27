import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface RecentOrdersProps {
  truckId: number;
}

export default function RecentOrders({ truckId }: RecentOrdersProps) {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders", truckId],
    enabled: !!truckId,
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default";
      case "preparing":
        return "secondary";
      case "pending":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatOrderItems = (items: any) => {
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch {
        return "Invalid order data";
      }
    }
    
    if (Array.isArray(items)) {
      return items
        .map((item: any) => `${item.quantity}x ${item.name}`)
        .join(", ");
    }
    
    return "No items";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            <ExternalLink className="h-4 w-4 mr-1" />
            View All Orders
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No orders yet</h3>
            <p className="text-muted-foreground">
              Orders will appear here once customers start placing them.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Order ID</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Items</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-4 text-sm font-medium text-foreground">
                      #{order.orderNumber}
                    </td>
                    <td className="py-4 text-sm text-foreground">
                      {order.customerName || "Walk-in Customer"}
                    </td>
                    <td className="py-4 text-sm text-muted-foreground max-w-48 truncate">
                      {formatOrderItems(order.items)}
                    </td>
                    <td className="py-4 text-sm font-medium text-foreground">
                      ${Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-4">
                      <Badge variant={getStatusColor(order.status)} className="capitalize">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "h:mm a")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
