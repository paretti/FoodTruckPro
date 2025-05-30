import {
  users,
  organizations,
  teamMembers,
  foodTrucks,
  locations,
  proteinInventory,
  menuItems,
  orders,
  reviews,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type TeamMember,
  type InsertTeamMember,
  type FoodTruck,
  type InsertFoodTruck,
  type Location,
  type InsertLocation,
  type ProteinInventory,
  type InsertProteinInventory,
  type MenuItem,
  type InsertMenuItem,
  type Order,
  type InsertOrder,
  type Review,
  type InsertReview,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Organization operations
  getOrganizationByOwnerId(ownerId: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  
  // Team operations
  getTeamMembersByOrganizationId(organizationId: number): Promise<TeamMember[]>;
  getTeamMemberByUserId(userId: string): Promise<TeamMember | undefined>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  
  // Food truck operations
  getFoodTrucksByOrganizationId(organizationId: number): Promise<FoodTruck[]>;
  getFoodTruckByUserId(userId: string): Promise<FoodTruck | undefined>;
  createFoodTruck(truck: InsertFoodTruck): Promise<FoodTruck>;
  updateFoodTruck(id: number, truck: Partial<InsertFoodTruck>): Promise<FoodTruck>;
  
  // Location operations
  getLocationsByTruckId(truckId: number): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, location: Partial<InsertLocation>): Promise<Location>;
  deleteLocation(id: number): Promise<void>;
  
  // Protein inventory operations
  getProteinInventoryByTruckId(truckId: number): Promise<ProteinInventory[]>;
  createProteinInventory(item: InsertProteinInventory): Promise<ProteinInventory>;
  updateProteinInventory(id: number, item: Partial<InsertProteinInventory>): Promise<ProteinInventory>;
  deleteProteinInventory(id: number): Promise<void>;
  
  // Menu operations
  getMenuItems(): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  
  // Order operations
  getOrdersByTruckId(truckId: number, limit?: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;
  
  // Review operations
  getReviewsByTruckId(truckId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Dashboard stats
  getDashboardStats(truckId: number): Promise<{
    todaySales: number;
    ordersToday: number;
    averageRating: number;
    activeLocations: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Food truck operations
  // Organization operations
  async getOrganizationByOwnerId(ownerId: string): Promise<Organization | undefined> {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.ownerId, ownerId));
    return org;
  }

  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    const [org] = await db
      .insert(organizations)
      .values(orgData)
      .returning();
    return org;
  }

  // Team operations
  async getTeamMembersByOrganizationId(organizationId: number): Promise<TeamMember[]> {
    return await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.organizationId, organizationId));
  }

  async getTeamMemberByUserId(userId: string): Promise<TeamMember | undefined> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));
    return member;
  }

  async addTeamMember(memberData: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db
      .insert(teamMembers)
      .values(memberData)
      .returning();
    return member;
  }

  // Food truck operations
  async getFoodTrucksByOrganizationId(organizationId: number): Promise<FoodTruck[]> {
    return await db
      .select()
      .from(foodTrucks)
      .where(eq(foodTrucks.organizationId, organizationId));
  }

  async getFoodTruckByUserId(userId: string): Promise<FoodTruck | undefined> {
    // First try to find user's organization
    const organization = await this.getOrganizationByOwnerId(userId);
    if (organization) {
      // If user owns an organization, get the first truck
      const trucks = await this.getFoodTrucksByOrganizationId(organization.id);
      return trucks[0];
    }

    // Otherwise, check if user is a team member assigned to a truck
    const teamMember = await this.getTeamMemberByUserId(userId);
    if (teamMember?.truckId) {
      const [truck] = await db
        .select()
        .from(foodTrucks)
        .where(eq(foodTrucks.id, teamMember.truckId));
      return truck;
    }

    return undefined;
  }

  async createFoodTruck(truck: InsertFoodTruck): Promise<FoodTruck> {
    const [newTruck] = await db
      .insert(foodTrucks)
      .values(truck)
      .returning();
    return newTruck;
  }

  async updateFoodTruck(id: number, truck: Partial<InsertFoodTruck>): Promise<FoodTruck> {
    const [updatedTruck] = await db
      .update(foodTrucks)
      .set({ ...truck, updatedAt: new Date() })
      .where(eq(foodTrucks.id, id))
      .returning();
    return updatedTruck;
  }

  // Location operations
  async getLocationsByTruckId(truckId: number): Promise<Location[]> {
    return await db
      .select()
      .from(locations)
      .where(eq(locations.truckId, truckId))
      .orderBy(desc(locations.createdAt));
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db
      .insert(locations)
      .values(location)
      .returning();
    return newLocation;
  }

  async updateLocation(id: number, location: Partial<InsertLocation>): Promise<Location> {
    const [updatedLocation] = await db
      .update(locations)
      .set({ ...location, updatedAt: new Date() })
      .where(eq(locations.id, id))
      .returning();
    return updatedLocation;
  }

  async deleteLocation(id: number): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }

  // Inventory operations
  async getInventoryByTruckId(truckId: number): Promise<InventoryItem[]> {
    return await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.truckId, truckId))
      .orderBy(inventoryItems.name);
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [newItem] = await db
      .insert(inventoryItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
  }

  // Order operations
  async getOrdersByTruckId(truckId: number, limit = 50): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.truckId, truckId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Review operations
  async getReviewsByTruckId(truckId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.truckId, truckId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    return newReview;
  }

  // Dashboard stats
  async getDashboardStats(truckId: number): Promise<{
    todaySales: number;
    ordersToday: number;
    averageRating: number;
    activeLocations: number;
  }> {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's orders
    const todayOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.truckId, truckId),
          eq(orders.status, 'completed')
        )
      );

    // Calculate today's sales and order count
    const todaySales = todayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const ordersToday = todayOrders.length;

    // Get average rating
    const reviewList = await db
      .select()
      .from(reviews)
      .where(eq(reviews.truckId, truckId));

    const averageRating = reviewList.length > 0
      ? reviewList.reduce((sum, review) => sum + review.rating, 0) / reviewList.length
      : 0;

    // Get active locations count
    const activeLocationsList = await db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.truckId, truckId),
          eq(locations.isActive, true)
        )
      );

    return {
      todaySales,
      ordersToday,
      averageRating: Math.round(averageRating * 10) / 10,
      activeLocations: activeLocationsList.length,
    };
  }
}

export const storage = new DatabaseStorage();
