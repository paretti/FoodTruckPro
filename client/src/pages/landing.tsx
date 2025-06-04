import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, BarChart3, MapPin, Package, Star, Users } from "lucide-react";
import { getApiUrl } from "@/lib/config";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mr-4">
                <Truck className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-foreground">TruckHub</h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              The complete food truck management platform that helps you grow your business, 
              track performance, and connect with customers.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
              onClick={() => window.location.href = getApiUrl('/api/login')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything you need to manage your food truck
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From analytics to inventory management, TruckHub provides all the tools 
              you need to run a successful food truck business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Business Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track sales, monitor performance, and gain insights with comprehensive 
                  analytics and reporting tools.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-xl">Location Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Find the best spots, save your favorite locations, and track 
                  which areas drive the most sales.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">Inventory Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Keep track of your ingredients, get low-stock alerts, and 
                  optimize your inventory management.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle className="text-xl">Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Build your reputation with customer reviews and ratings. 
                  Respond to feedback and improve your service.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle className="text-xl">Customer Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Connect with your customers, build loyalty, and grow your 
                  food truck community.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Truck className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle className="text-xl">Mobile Optimized</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access your dashboard on the go. Our platform works 
                  seamlessly across all devices.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to grow your food truck business?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of food truck owners who trust TruckHub to manage their operations.
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
            onClick={() => window.location.href = getApiUrl('/api/login')}
          >
            Start Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
}
