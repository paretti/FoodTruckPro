import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Package, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const inventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  currentStock: z.string().min(1, "Current stock is required").refine((val) => !isNaN(parseFloat(val)), "Must be a valid number"),
  unit: z.string().min(1, "Unit is required"),
  lowStockThreshold: z.string().optional().refine((val) => !val || !isNaN(parseFloat(val)), "Must be a valid number"),
  cost: z.string().optional().refine((val) => !val || !isNaN(parseFloat(val)), "Must be a valid number"),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

const categories = [
  "Proteins",
  "Vegetables",
  "Grains",
  "Seasonings",
  "Beverages",
  "Supplies",
  "Other"
];

const units = [
  "lbs",
  "kg",
  "pieces",
  "cups",
  "liters",
  "gallons",
  "boxes",
  "bags"
];

export default function Inventory() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: foodTruck } = useQuery({
    queryKey: ["/api/food-truck"],
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["/api/inventory", foodTruck?.id],
    queryFn: () => fetch(`/api/inventory/${foodTruck?.id}`).then(res => res.json()),
    enabled: !!foodTruck?.id,
  });

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: "",
      category: "",
      currentStock: "",
      unit: "",
      lowStockThreshold: "",
      cost: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      const response = await apiRequest("POST", "/api/inventory", {
        ...data,
        truckId: foodTruck?.id,
        currentStock: parseFloat(data.currentStock),
        lowStockThreshold: data.lowStockThreshold ? parseFloat(data.lowStockThreshold) : null,
        cost: data.cost ? parseFloat(data.cost) : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", foodTruck?.id] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Inventory item created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create inventory item",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InventoryFormData> }) => {
      const response = await apiRequest("PUT", `/api/inventory/${id}`, {
        ...data,
        currentStock: data.currentStock ? parseFloat(data.currentStock) : undefined,
        lowStockThreshold: data.lowStockThreshold ? parseFloat(data.lowStockThreshold) : null,
        cost: data.cost ? parseFloat(data.cost) : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", foodTruck?.id] });
      setEditingItem(null);
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", foodTruck?.id] });
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InventoryFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      category: item.category || "",
      currentStock: item.currentStock.toString(),
      unit: item.unit,
      lowStockThreshold: item.lowStockThreshold?.toString() || "",
      cost: item.cost?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this inventory item?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStockStatus = (item: any) => {
    if (item.lowStockThreshold && Number(item.currentStock) <= Number(item.lowStockThreshold)) {
      return { status: "low", color: "destructive" };
    }
    return { status: "normal", color: "default" };
  };

  const lowStockItems = inventory.filter(item => 
    item.lowStockThreshold && Number(item.currentStock) <= Number(item.lowStockThreshold)
  );

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground">
              Track your ingredients and supplies to keep your food truck running smoothly.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  setEditingItem(null);
                  form.reset({
                    name: "",
                    category: "",
                    currentStock: "",
                    unit: "",
                    lowStockThreshold: "",
                    cost: "",
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Inventory Item" : "Add New Item"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Carnitas" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currentStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stock</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lowStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Alert</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost per Unit</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="15.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
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
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingItem ? "Update" : "Create"} Item
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-8">
        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Low Stock Alerts ({lowStockItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowStockItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.currentStock} {item.unit} remaining
                      </p>
                    </div>
                    <Badge variant="destructive">Low Stock</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory Grid */}
        {inventory.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No inventory items yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first inventory item to start tracking your supplies.
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Item
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {inventory.map((item: any) => {
              const stockStatus = getStockStatus(item);
              return (
                <Card key={item.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        {item.category && (
                          <Badge variant="secondary" className="mt-1">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Stock</span>
                      <span className="font-medium">
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                    {item.lowStockThreshold && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Low Stock Alert</span>
                        <span className="text-sm">
                          {item.lowStockThreshold} {item.unit}
                        </span>
                      </div>
                    )}
                    {item.cost && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Cost per Unit</span>
                        <span className="text-sm">${item.cost}</span>
                      </div>
                    )}
                    {stockStatus.status === "low" && (
                      <Badge variant="destructive" className="w-full justify-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Low Stock
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
