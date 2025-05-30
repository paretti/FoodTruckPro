import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertFoodTruckSchema, insertLocationSchema, insertOrganizationSchema, insertTeamMemberSchema, insertProteinInventorySchema, insertMenuItemSchema, insertOrderSchema, insertReviewSchema } from "@shared/schema";
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

  // Organization routes
  app.get('/api/organization', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByOwnerId(userId);
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  app.post('/api/organization', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgData = insertOrganizationSchema.parse({ 
        ...req.body, 
        ownerId: userId 
      });
      const organization = await storage.createOrganization(orgData);
      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  // Team member routes
  app.get('/api/team-members/:organizationId', isAuthenticated, async (req, res) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      const members = await storage.getTeamMembersByOrganizationId(organizationId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get('/api/team-members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByOwnerId(userId);
      if (!organization) {
        return res.json([]);
      }
      const members = await storage.getTeamMembersByOrganizationId(organization.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.post('/api/team-members', isAuthenticated, async (req, res) => {
    try {
      const memberData = insertTeamMemberSchema.parse(req.body);
      const member = await storage.addTeamMember(memberData);
      res.json(member);
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(500).json({ message: "Failed to add team member" });
    }
  });

  // Truck management routes
  app.get('/api/trucks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByOwnerId(userId);
      if (!organization) {
        return res.json([]);
      }
      const trucks = await storage.getFoodTrucksByOrganizationId(organization.id);
      res.json(trucks);
    } catch (error) {
      console.error("Error fetching trucks:", error);
      res.status(500).json({ message: "Failed to fetch trucks" });
    }
  });

  app.post('/api/trucks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByOwnerId(userId);
      if (!organization) {
        return res.status(400).json({ message: "No organization found" });
      }
      
      const truckData = insertFoodTruckSchema.parse({
        ...req.body,
        organizationId: organization.id,
      });
      const truck = await storage.createFoodTruck(truckData);
      res.json(truck);
    } catch (error) {
      console.error("Error creating truck:", error);
      res.status(500).json({ message: "Failed to create truck" });
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
      
      // First, get or create user's organization
      let organization = await storage.getOrganizationByOwnerId(userId);
      if (!organization) {
        organization = await storage.createOrganization({
          name: `${req.body.name || 'My'} Organization`,
          ownerId: userId,
        });
      }
      
      const truckData = insertFoodTruckSchema.parse({ 
        ...req.body, 
        organizationId: organization.id 
      });
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
      // Legacy endpoint - return empty for compatibility
      res.json([]);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post('/api/inventory', isAuthenticated, async (req, res) => {
    try {
      // Legacy endpoint for compatibility
      res.status(501).json({ message: "Use protein inventory instead" });
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.put('/api/inventory/:id', isAuthenticated, async (req, res) => {
    try {
      // Legacy endpoint for compatibility
      res.status(501).json({ message: "Use protein inventory instead" });
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete('/api/inventory/:id', isAuthenticated, async (req, res) => {
    try {
      // Legacy endpoint for compatibility
      res.status(501).json({ message: "Use protein inventory instead" });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Protein inventory routes
  app.get('/api/protein-inventory/:truckId', isAuthenticated, async (req, res) => {
    try {
      const truckId = parseInt(req.params.truckId);
      const inventory = await storage.getProteinInventoryByTruckId(truckId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching protein inventory:", error);
      res.status(500).json({ message: "Failed to fetch protein inventory" });
    }
  });

  app.get('/api/protein-inventory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const truck = await storage.getFoodTruckByUserId(userId);
      if (!truck) {
        return res.json([]);
      }
      const inventory = await storage.getProteinInventoryByTruckId(truck.id);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching protein inventory:", error);
      res.status(500).json({ message: "Failed to fetch protein inventory" });
    }
  });

  app.post('/api/protein-inventory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const truck = await storage.getFoodTruckByUserId(userId);
      if (!truck) {
        return res.status(400).json({ message: "No truck found for user" });
      }
      
      const inventoryData = insertProteinInventorySchema.parse({
        ...req.body,
        truckId: truck.id,
      });
      const inventory = await storage.createProteinInventory(inventoryData);
      res.json(inventory);
    } catch (error) {
      console.error("Error creating protein inventory:", error);
      res.status(500).json({ message: "Failed to create protein inventory" });
    }
  });

  app.put('/api/protein-inventory/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const inventoryData = insertProteinInventorySchema.partial().parse(req.body);
      const inventory = await storage.updateProteinInventory(id, inventoryData);
      res.json(inventory);
    } catch (error) {
      console.error("Error updating protein inventory:", error);
      res.status(500).json({ message: "Failed to update protein inventory" });
    }
  });

  app.delete('/api/protein-inventory/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProteinInventory(id);
      res.json({ message: "Protein inventory deleted successfully" });
    } catch (error) {
      console.error("Error deleting protein inventory:", error);
      res.status(500).json({ message: "Failed to delete protein inventory" });
    }
  });

  // Menu item routes
  app.get('/api/menu-items', async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.post('/api/menu-items', isAuthenticated, async (req, res) => {
    try {
      const menuData = insertMenuItemSchema.parse(req.body);
      const menuItem = await storage.createMenuItem(menuData);
      res.json(menuItem);
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({ message: "Failed to create menu item" });
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
