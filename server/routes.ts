import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertFoodTruckSchema, insertLocationSchema, insertInventoryItemSchema, insertOrderSchema, insertReviewSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Mapbox token route
  app.get('/api/mapbox-token', isAuthenticated, async (req, res) => {
    try {
      res.json({ token: process.env.MAPBOX_PUBLIC_KEY });
    } catch (error) {
      console.error("Error fetching Mapbox token:", error);
      res.status(500).json({ message: "Failed to fetch Mapbox token" });
    }
  });

  // Food truck routes
  app.get('/api/food-truck', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const truck = await storage.getFoodTruckByUserId(userId);
      res.json(truck);
    } catch (error) {
      console.error("Error fetching food truck:", error);
      res.status(500).json({ message: "Failed to fetch food truck" });
    }
  });

  app.post('/api/food-truck', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const truckData = insertFoodTruckSchema.parse({ ...req.body, userId });
      const truck = await storage.createFoodTruck(truckData);
      res.json(truck);
    } catch (error) {
      console.error("Error creating food truck:", error);
      res.status(500).json({ message: "Failed to create food truck" });
    }
  });

  // Location routes
  app.get('/api/locations/:truckId', isAuthenticated, async (req, res) => {
    try {
      const truckId = parseInt(req.params.truckId);
      const locations = await storage.getLocationsByTruckId(truckId);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.post('/api/locations', isAuthenticated, async (req, res) => {
    try {
      const locationData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(locationData);
      res.json(location);
    } catch (error) {
      console.error("Error creating location:", error);
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  app.put('/api/locations/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const locationData = insertLocationSchema.partial().parse(req.body);
      const location = await storage.updateLocation(id, locationData);
      res.json(location);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  app.delete('/api/locations/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLocation(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting location:", error);
      res.status(500).json({ message: "Failed to delete location" });
    }
  });

  // Inventory routes
  app.get('/api/inventory/:truckId', isAuthenticated, async (req, res) => {
    try {
      const truckId = parseInt(req.params.truckId);
      const inventory = await storage.getInventoryByTruckId(truckId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post('/api/inventory', isAuthenticated, async (req, res) => {
    try {
      const itemData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.put('/api/inventory/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = insertInventoryItemSchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(id, itemData);
      res.json(item);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete('/api/inventory/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInventoryItem(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Order routes
  app.get('/api/orders/:truckId', isAuthenticated, async (req, res) => {
    try {
      const truckId = parseInt(req.params.truckId);
      const orders = await storage.getOrdersByTruckId(truckId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, orderData);
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Review routes
  app.get('/api/reviews/:truckId', isAuthenticated, async (req, res) => {
    try {
      const truckId = parseInt(req.params.truckId);
      const reviews = await storage.getReviewsByTruckId(truckId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/reviews', async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard-stats/:truckId', isAuthenticated, async (req, res) => {
    try {
      const truckId = parseInt(req.params.truckId);
      const stats = await storage.getDashboardStats(truckId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
