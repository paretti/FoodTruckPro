import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Star, MessageSquare, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const reviewSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function Reviews() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: foodTruck } = useQuery({
    queryKey: ["/api/food-truck"],
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["/api/reviews", foodTruck?.id],
    queryFn: () => fetch(`/api/reviews/${foodTruck?.id}`).then(res => res.json()),
    enabled: !!foodTruck?.id,
  });

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      customerName: "",
      rating: 5,
      comment: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await apiRequest("POST", "/api/reviews", {
        ...data,
        truckId: foodTruck?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews", foodTruck?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-stats"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Review added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add review",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    createMutation.mutate(data);
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter((review: any) => review.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter((review: any) => review.rating === rating).length / reviews.length) * 100
      : 0
  }));

  const renderStars = (rating: number, size = "h-4 w-4") => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reviews & Ratings</h1>
            <p className="text-muted-foreground">
              Manage customer feedback and build your reputation.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Review
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Customer Review</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <FormControl>
                          <div className="flex space-x-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={() => field.onChange(rating)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`h-8 w-8 ${
                                    rating <= field.value
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comment (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Amazing tacos! Great service and delicious food..."
                            {...field} 
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
                      disabled={createMutation.isPending}
                    >
                      Add Review
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-400" />
                Average Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-foreground">
                  {averageRating.toFixed(1)}
                </span>
                {renderStars(Math.round(averageRating), "h-5 w-5")}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Based on {reviews.length} reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-secondary" />
                Total Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-foreground">{reviews.length}</span>
              <p className="text-sm text-muted-foreground mt-2">
                Customer feedback received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                Response Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-foreground">95%</span>
              <p className="text-sm text-muted-foreground mt-2">
                Reviews with responses
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rating Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center space-x-3">
                  <span className="text-sm font-medium w-8">{rating}</span>
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start collecting customer feedback to build your reputation.
                    </p>
                    <Button 
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Review
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-foreground">{review.customerName}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              {renderStars(review.rating)}
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(review.createdAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                          <Badge variant={review.rating >= 4 ? "default" : "destructive"}>
                            {review.rating}/5
                          </Badge>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
