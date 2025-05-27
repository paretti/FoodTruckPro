// Common types used across the application
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard specific types
export interface DashboardStats {
  todaySales: number;
  ordersToday: number;
  averageRating: number;
  activeLocations: number;
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  sales: number;
  orders?: number;
}

export interface PopularItem {
  name: string;
  percentage: number;
  count: number;
}

// Form validation types
export interface FormFieldError {
  field: string;
  message: string;
}

// UI state types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Location types
export interface LocationWithDistance extends Location {
  distance?: number;
  estimatedTraffic?: 'low' | 'medium' | 'high';
}

// Inventory alert types
export interface InventoryAlert {
  id: number;
  itemName: string;
  currentStock: number;
  threshold: number;
  unit: string;
  severity: 'low' | 'critical';
}

// Order item types
export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

// Review summary types
export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentReviews: Review[];
}

// User preferences types
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    lowStock: boolean;
    newReviews: boolean;
    newOrders: boolean;
  };
  dashboard: {
    defaultTimeRange: '7days' | '30days' | '90days';
    showWeekends: boolean;
  };
}

// API error types
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

// File upload types
export interface FileUploadState {
  uploading: boolean;
  progress: number;
  error?: string;
  url?: string;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string[];
  category?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Navigation types
export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
  children?: NavigationItem[];
}

// Modal and dialog types
export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// Business metrics types
export interface BusinessMetrics {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
  orders: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    averageOrderValue: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    satisfactionScore: number;
  };
  operations: {
    activeLocations: number;
    hoursOperated: number;
    itemsSold: number;
    inventoryValue: number;
  };
}

// Export commonly used types from shared schema
export type {
  User,
  FoodTruck,
  Location,
  InventoryItem,
  Order,
  Review,
  InsertFoodTruck,
  InsertLocation,
  InsertInventoryItem,
  InsertOrder,
  InsertReview,
} from "@shared/schema";
