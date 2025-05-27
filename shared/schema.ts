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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const foodTrucks = pgTable("food_trucks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
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

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id").notNull(),
  name: varchar("name").notNull(),
  category: varchar("category"),
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit").notNull(),
  lowStockThreshold: decimal("low_stock_threshold", { precision: 10, scale: 2 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id").notNull(),
  orderNumber: varchar("order_number").notNull().unique(),
  customerName: varchar("customer_name"),
  items: jsonb("items").notNull(), // Array of {name, quantity, price}
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
  foodTrucks: many(foodTrucks),
}));

export const foodTrucksRelations = relations(foodTrucks, ({ one, many }) => ({
  user: one(users, {
    fields: [foodTrucks.userId],
    references: [users.id],
  }),
  locations: many(locations),
  inventoryItems: many(inventoryItems),
  orders: many(orders),
  reviews: many(reviews),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  foodTruck: one(foodTrucks, {
    fields: [locations.truckId],
    references: [foodTrucks.id],
  }),
  orders: many(orders),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one }) => ({
  foodTruck: one(foodTrucks, {
    fields: [inventoryItems.truckId],
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

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export type InsertFoodTruck = z.infer<typeof insertFoodTruckSchema>;
export type FoodTruck = typeof foodTrucks.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
