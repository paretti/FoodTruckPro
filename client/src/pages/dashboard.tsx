import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardStats from "@/components/dashboard-stats";
import SalesChart from "@/components/sales-chart";
import RecentOrders from "@/components/recent-orders";
import Map from "@/components/map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Package, AlertTriangle, Plus, Bell } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: foodTruck } = useQuery({
    queryKey: ["/api/food-truck"],
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard-stats", foodTruck?.id],
    enabled: !!foodTruck?.id,
  });

  const { data: locations } = useQuery({
    queryKey: ["/api/locations", foodTruck?.id],
    enabled: !!foodTruck?.id,
  });

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory", foodTruck?.id],
    enabled: !!foodTruck?.id,
  });

  // Ensure locations and inventory are always arrays before using array methods
  const locationsArray = Array.isArray(locations) ? locations : [];
  const inventoryArray = Array.isArray(inventory) ? inventory : [];

  const activeLocation = locationsArray.find((loc: any) => loc.isActive);
  const lowStockItems = inventoryArray.filter((item: any) => 
    item.lowStockThreshold && Number(item.currentStock) <= Number(item.lowStockThreshold)
  );

  if (!foodTruck) {
    return (
      <div className="p-8">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-4">Welcome to TruckHub!</h1>
          <p className="text-muted-foreground mb-6">
            It looks like you haven't set up your food truck yet. Let's get started!
          </p>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => window.location.href = '/profile'}
          >
            <Plus className="h-4 w-4 mr-2" />
            Set Up Your Food Truck
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.firstName}! Here's what's happening with {foodTruck.name} today.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="bg-secondary hover:bg-secondary/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {lowStockItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Stats Cards */}
        <DashboardStats stats={stats} />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SalesChart truckId={foodTruck.id} />
          
          {/* Popular Items - Only show when there's real data */}
          {inventory && inventory.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Inventory Items</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventory.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Inventory Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Add inventory items to see them here
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity & Location */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <RecentOrders truckId={foodTruck.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Current Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeLocation ? (
                  <>
                    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden border">
                      <Map address={activeLocation.address} className="rounded-lg" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{activeLocation.name}</p>
                      <p className="text-sm text-muted-foreground">{activeLocation.address}</p>
                      <div className="flex items-center mt-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-sm text-green-600">Active</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No active location</p>
                  </div>
                )}
                <Button 
                  className="w-full bg-secondary hover:bg-secondary/90 text-white"
                  onClick={() => setLocation("/locations")}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Change Location
                </Button>
              </CardContent>
            </Card>

            {/* Inventory Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Inventory Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lowStockItems.length > 0 ? (
                  lowStockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.currentStock} {item.unit} remaining
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        Low Stock
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">All items in stock</p>
                  </div>
                )}
                <Button variant="ghost" size="sm" className="w-full text-primary">
                  View All Inventory
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
