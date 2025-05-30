import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Beef, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const proteinSchema = z.object({
  proteinType: z.enum(["pork", "beef", "chicken"]),
  allocatedAmount: z.string().min(1, "Allocated amount is required"),
  currentStock: z.string().min(1, "Current stock is required"),
  costPerUnit: z.string().optional(),
});

type ProteinFormData = z.infer<typeof proteinSchema>;

export default function ProteinInventory() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: foodTruck } = useQuery({
    queryKey: ["/api/food-truck"],
  });

  const { data: proteinInventory = [] } = useQuery({
    queryKey: ["/api/protein-inventory", foodTruck?.id],
    enabled: !!foodTruck?.id,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ["/api/menu-items"],
  });

  const form = useForm<ProteinFormData>({
    resolver: zodResolver(proteinSchema),
    defaultValues: {
      proteinType: "pork",
      allocatedAmount: "",
      currentStock: "",
      costPerUnit: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProteinFormData) => {
      const response = await apiRequest("POST", "/api/protein-inventory", {
        ...data,
        truckId: foodTruck?.id,
        allocatedAmount: data.allocatedAmount,
        currentStock: data.currentStock,
        costPerUnit: data.costPerUnit || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protein-inventory", foodTruck?.id] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Protein inventory added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add protein inventory",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProteinFormData> }) => {
      const response = await apiRequest("PUT", `/api/protein-inventory/${id}`, {
        ...data,
        allocatedAmount: data.allocatedAmount || undefined,
        currentStock: data.currentStock || undefined,
        costPerUnit: data.costPerUnit || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protein-inventory", foodTruck?.id] });
      toast({
        title: "Success",
        description: "Protein inventory updated successfully",
      });
    },
  });

  const onSubmit = (data: ProteinFormData) => {
    createMutation.mutate(data);
  };

  const getProteinIcon = (proteinType: string) => {
    switch (proteinType) {
      case "beef": return "🥩";
      case "pork": return "🥓";
      case "chicken": return "🐔";
      default: return "🍖";
    }
  };

  const getUsagePercentage = (used: number, allocated: number) => {
    return allocated > 0 ? (used / allocated) * 100 : 0;
  };

  const getMenuItemsForProtein = (proteinType: string) => {
    return menuItems.filter((item: any) => item.proteinType === proteinType);
  };

  if (!foodTruck) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading truck information...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Protein Inventory</h1>
            <p className="text-muted-foreground">
              Track protein allocation and usage for {foodTruck.name}.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Protein
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Protein Inventory</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="proteinType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protein Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select protein type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pork">🥓 Pork</SelectItem>
                            <SelectItem value="beef">🥩 Beef</SelectItem>
                            <SelectItem value="chicken">🐔 Chicken</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allocatedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allocated Amount (lbs)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Stock (lbs)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="45"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="costPerUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost per lb (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="8.50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary/90"
                      disabled={createMutation.isPending}
                    >
                      Add Protein
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-8">
        {/* Menu Items Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Menu Items & Protein Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["tacos", "burritos", "tortas"].map((category) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg capitalize">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {menuItems
                      .filter((item: any) => item.name === category.slice(0, -1))
                      .map((item: any) => (
                        <div key={`${item.name}-${item.proteinType}`} className="flex justify-between items-center">
                          <span className="text-sm">
                            {getProteinIcon(item.proteinType)} {item.proteinType}
                          </span>
                          <div className="text-right">
                            <p className="text-sm font-medium">${Number(item.price).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {Number(item.proteinAmount).toFixed(2)} lbs
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Protein Inventory */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Protein Allocation & Usage</h2>
          {proteinInventory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Beef className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No protein inventory</h3>
                <p className="text-muted-foreground mb-6">
                  Start by adding protein allocations for your truck.
                </p>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Protein
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proteinInventory.map((protein: any) => {
                const usagePercent = getUsagePercentage(Number(protein.usedAmount), Number(protein.allocatedAmount));
                const remaining = Number(protein.currentStock);
                const isLow = remaining < Number(protein.allocatedAmount) * 0.2;

                return (
                  <Card key={protein.id} className={isLow ? "border-red-200" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center">
                          <span className="mr-2">{getProteinIcon(protein.proteinType)}</span>
                          {protein.proteinType.charAt(0).toUpperCase() + protein.proteinType.slice(1)}
                        </CardTitle>
                        {isLow && (
                          <Badge variant="destructive" className="flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Usage</span>
                          <span>{usagePercent.toFixed(1)}%</span>
                        </div>
                        <Progress value={usagePercent} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Allocated:</span>
                          <span className="text-sm font-medium">{Number(protein.allocatedAmount).toFixed(1)} lbs</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Current Stock:</span>
                          <span className="text-sm font-medium">{Number(protein.currentStock).toFixed(1)} lbs</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Used:</span>
                          <span className="text-sm font-medium">{Number(protein.usedAmount).toFixed(1)} lbs</span>
                        </div>
                        {protein.costPerUnit && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Cost/lb:</span>
                            <span className="text-sm font-medium">${Number(protein.costPerUnit).toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t">
                        <h4 className="text-sm font-medium mb-2">Menu Items:</h4>
                        <div className="space-y-1">
                          {getMenuItemsForProtein(protein.proteinType).map((item: any) => (
                            <div key={`${item.name}-${item.proteinType}`} className="flex justify-between text-xs">
                              <span>{item.name}</span>
                              <span>{Number(item.proteinAmount).toFixed(2)} lbs</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}