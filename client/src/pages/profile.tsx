import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Truck, Phone, Globe, MapPin, Star, Users, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const foodTruckSchema = z.object({
  name: z.string().min(1, "Food truck name is required"),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
});

type FoodTruckFormData = z.infer<typeof foodTruckSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: foodTruck } = useQuery({
    queryKey: ["/api/food-truck"],
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["/api/reviews", foodTruck?.id],
    enabled: !!foodTruck?.id,
  });

  const form = useForm<FoodTruckFormData>({
    resolver: zodResolver(foodTruckSchema),
    defaultValues: {
      name: "",
      description: "",
      cuisine: "",
      phone: "",
      website: "",
    },
  });

  // Reset form when foodTruck data changes
  React.useEffect(() => {
    if (foodTruck) {
      form.reset({
        name: foodTruck.name || "",
        description: foodTruck.description || "",
        cuisine: foodTruck.cuisine || "",
        phone: foodTruck.phone || "",
        website: foodTruck.website || "",
      });
    }
  }, [foodTruck, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FoodTruckFormData) => {
      const response = await apiRequest("POST", "/api/food-truck", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-truck"] });
      toast({
        title: "Success",
        description: "Food truck profile created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create food truck profile",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FoodTruckFormData) => {
      const response = await apiRequest("PUT", `/api/food-truck/${foodTruck?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-truck"] });
      toast({
        title: "Success",
        description: "Food truck profile updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update food truck profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FoodTruckFormData) => {
    if (foodTruck) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
    : 0;

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Business Profile</h1>
            <p className="text-muted-foreground">
              Manage your food truck information and public profile.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/api/logout'}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.profileImageUrl} />
                  <AvatarFallback className="bg-primary text-white text-lg">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-foreground">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              
              {foodTruck && (
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Rating</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Reviews</span>
                    <span className="font-medium">{reviews.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <span className="font-medium">
                      {new Date(user?.createdAt || '').getFullYear()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Food Truck Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  {foodTruck ? "Edit Food Truck Profile" : "Create Food Truck Profile"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Food Truck Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Taco Libre Truck" {...field} />
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Authentic Mexican street food made with fresh ingredients..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cuisine"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cuisine Type</FormLabel>
                            <FormControl>
                              <Input placeholder="Mexican, American, Asian..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://tacolibretruck.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        className="bg-primary hover:bg-primary/90"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {foodTruck ? "Update Profile" : "Create Profile"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Public Profile Preview */}
            {foodTruck && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Public Profile Preview</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    This is how your food truck appears to customers.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                        <Truck className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground">{foodTruck.name}</h3>
                        {foodTruck.cuisine && (
                          <Badge variant="secondary" className="mt-1">
                            {foodTruck.cuisine}
                          </Badge>
                        )}
                        <div className="flex items-center space-x-1 mt-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="font-medium">{averageRating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">
                            ({reviews.length} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    {foodTruck.description && (
                      <p className="text-muted-foreground">{foodTruck.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 pt-2">
                      {foodTruck.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{foodTruck.phone}</span>
                        </div>
                      )}
                      {foodTruck.website && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={foodTruck.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
