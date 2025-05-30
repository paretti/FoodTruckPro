import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  real
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("member"), // admin, manager, member
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  ownerId: varchar("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team assignments table
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  userId: varchar("user_id").notNull(), // Can be employee ID or custom identifier
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  truckId: integer("truck_id"), // nullable - admins may not be assigned to specific trucks
  role: varchar("role").notNull().default("member"), // admin, manager, member
  startDate: timestamp("start_date").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const foodTrucks = pgTable("food_trucks", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  cuisine: varchar("cuisine"),
  phone: varchar("phone"),
  website: varchar("website"),
  logo: varchar("logo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id").notNull(),
  name: varchar("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  description: text("description"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Protein inventory tracking (pork, beef, chicken)
export const proteinInventory = pgTable("protein_inventory", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id").notNull(),
  proteinType: varchar("protein_type").notNull(), // 'pork', 'beef', 'chicken'
  allocatedAmount: decimal("allocated_amount", { precision: 10, scale: 2 }).notNull(), // lbs allocated by admin
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).notNull(),
  usedAmount: decimal("used_amount", { precision: 10, scale: 2 }).default("0"), // total used for sales
  unit: varchar("unit").notNull().default("lbs"),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Menu items with protein usage
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // 'taco', 'burrito', 'torta'
  proteinType: varchar("protein_type").notNull(), // 'pork', 'beef', 'chicken'
  proteinAmount: decimal("protein_amount", { precision: 10, scale: 2 }).notNull(), // lbs of protein per item
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id").notNull(),
  orderNumber: varchar("order_number").notNull().unique(),
  customerName: varchar("customer_name"),
  items: jsonb("items").notNull(), // Array of {menuItemId, quantity, proteinUsed}
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, preparing, completed, cancelled
  locationId: integer("location_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id").notNull(),
  customerName: varchar("customer_name").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedOrganizations: many(organizations),
  teamMemberships: many(teamMembers),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.ownerId],
    references: [users.id],
  }),
  foodTrucks: many(foodTrucks),
  teamMembers: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [teamMembers.organizationId],
    references: [organizations.id],
  }),
  foodTruck: one(foodTrucks, {
    fields: [teamMembers.truckId],
    references: [foodTrucks.id],
  }),
}));

export const foodTrucksRelations = relations(foodTrucks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [foodTrucks.organizationId],
    references: [organizations.id],
  }),
  locations: many(locations),
  proteinInventory: many(proteinInventory),
  orders: many(orders),
  reviews: many(reviews),
  teamMembers: many(teamMembers),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  foodTruck: one(foodTrucks, {
    fields: [locations.truckId],
    references: [foodTrucks.id],
  }),
  orders: many(orders),
}));

export const proteinInventoryRelations = relations(proteinInventory, ({ one }) => ({
  foodTruck: one(foodTrucks, {
    fields: [proteinInventory.truckId],
    references: [foodTrucks.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  foodTruck: one(foodTrucks, {
    fields: [orders.truckId],
    references: [foodTrucks.id],
  }),
  location: one(locations, {
    fields: [orders.locationId],
    references: [locations.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  foodTruck: one(foodTrucks, {
    fields: [reviews.truckId],
    references: [foodTrucks.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertFoodTruckSchema = createInsertSchema(foodTrucks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
  startDate: true,
}).extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
});

export const insertProteinInventorySchema = createInsertSchema(proteinInventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export type InsertFoodTruck = z.infer<typeof insertFoodTruckSchema>;
export type FoodTruck = typeof foodTrucks.$inferSelect;

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export type InsertProteinInventory = z.infer<typeof insertProteinInventorySchema>;
export type ProteinInventory = typeof proteinInventory.$inferSelect;

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
