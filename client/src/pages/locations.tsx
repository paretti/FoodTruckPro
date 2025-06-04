import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, MapPin, Trash2, Edit, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/config";

const locationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(false),
});

type LocationFormData = z.infer<typeof locationSchema>;

export default function Locations() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const { data: foodTruck } = useQuery({
    queryKey: ["/api/food-truck"],
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations", foodTruck?.id],
    queryFn: () => fetch(getApiUrl(`/api/locations/${foodTruck?.id}`)).then(res => res.json()),
    enabled: !!foodTruck?.id,
  });

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      address: "",
      description: "",
      isActive: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      const response = await apiRequest("POST", "/api/locations", {
        ...data,
        truckId: foodTruck?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", foodTruck?.id] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Location created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create location",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LocationFormData> }) => {
      const response = await apiRequest("PUT", `/api/locations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", foodTruck?.id] });
      setEditingLocation(null);
      toast({
        title: "Success",
        description: "Location updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", foodTruck?.id] });
      toast({
        title: "Success",
        description: "Location deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LocationFormData) => {
    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (location: any) => {
    setEditingLocation(location);
    form.reset({
      name: location.name,
      address: location.address,
      description: location.description || "",
      isActive: location.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this location?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleActive = (location: any) => {
    updateMutation.mutate({
      id: location.id,
      data: { isActive: !location.isActive },
    });
  };

  // Address autocomplete using Mapbox (professional quality!)
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Get Mapbox token from backend
      const tokenResponse = await fetch(getApiUrl('/api/mapbox-token'));
      if (!tokenResponse.ok) {
        throw new Error('Failed to get Mapbox token');
      }
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.token) {
        console.error('No Mapbox token available for address search');
        return;
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${tokenData.token}&limit=5&types=address,poi,place`
      );
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const suggestions = data.features?.map((item: any) => ({
        display_name: item.place_name,
        lat: item.center[1],
        lon: item.center[0],
        address: item.place_name
      })) || [];
      
      setAddressSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Mapbox address search error:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle address input change with debouncing
  const handleAddressChange = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      searchAddresses(value);
    }, 300);
    
    setSearchTimeout(timeout);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any, onChange: (value: string) => void) => {
    onChange(suggestion.address);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  // Ensure locations is always an array before using array methods
  const locationsArray = Array.isArray(locations) ? locations : [];

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Locations</h1>
            <p className="text-muted-foreground">
              Manage your food truck locations and find the best spots for your business.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  setEditingLocation(null);
                  form.reset({
                    name: "",
                    address: "",
                    description: "",
                    isActive: false,
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingLocation ? "Edit Location" : "Add New Location"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Downtown Plaza" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="Start typing an address..."
                              value={field.value}
                              onChange={(e) => handleAddressChange(e.target.value, field.onChange)}
                              onFocus={() => {
                                if (addressSuggestions.length > 0) {
                                  setShowSuggestions(true);
                                }
                              }}
                              onBlur={() => {
                                // Delay hiding suggestions to allow clicking
                                setTimeout(() => setShowSuggestions(false), 200);
                              }}
                            />
                            {showSuggestions && addressSuggestions.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                                {addressSuggestions.map((suggestion, index) => (
                                  <div
                                    key={index}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    onClick={() => handleSuggestionSelect(suggestion, field.onChange)}
                                  >
                                    <div className="flex items-start space-x-3">
                                      <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                          {suggestion.display_name}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Great foot traffic during lunch hours..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Set as Active Location</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                      {editingLocation ? "Update" : "Create"} Location
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-8">
        {locationsArray.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No locations yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first location to start tracking where your food truck operates.
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Location
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locationsArray.map((location: any) => (
              <Card key={location.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-primary mr-2" />
                      <CardTitle className="text-lg">{location.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {location.isActive && (
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      )}
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(location)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(location.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{location.address}</p>
                  {location.description && (
                    <p className="text-sm">{location.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {location.isActive ? "Active" : "Inactive"}
                    </span>
                    <Button
                      variant={location.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleActive(location)}
                      disabled={updateMutation.isPending}
                    >
                      {location.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
