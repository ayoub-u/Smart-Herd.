// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarInitials: string;
  role: "owner" | "manager" | "worker";
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ── Farm (Multi-tenant root) ───────────────────────────────────────────────────
// WHY CHANGED: field names updated to match real DB columns via the mapper
// in src/lib/farm.ts (farm_name → name, farm_size → farmSize, etc.)
export interface Farm {
  id: string;
  ownerId: string;
  name: string;       // maps from DB column farm_name
  country: string;
  region: string;     // replaces the non-existent "location" field
  address: string;
  description: string;
  farmSize: number | null;  // maps from DB column farm_size (was "hectares")
  timezone: string;
  currency: string;
  createdAt: string;
}

// ── Animals ───────────────────────────────────────────────────────────────────
export type AnimalType = "cow" | "sheep" | "bull";
export type HealthStatus = "healthy" | "sick" | "recovering" | "critical";
export type PregnancyStatus = "pregnant" | "open" | "dry" | "lactating";

export interface Animal {
  id: string;
  farmId: string;
  name: string;
  tag: string;
  rfid: string;
  type: AnimalType;
  breed: string;
  dateOfBirth: string;
  weight: number;
  healthStatus: HealthStatus;
  pregnancyStatus: PregnancyStatus;
  milkYieldToday: number;
  milkYieldAvg: number;
  lactationNumber: number;
  daysInMilk: number;
  lastVaccination: string;
  nextVaccination: string;
  sire: string;
  dam: string;
  location: string;
  notes: string;
  inseminationDate?: string;
  expectedBirthDate?: string;
  acquisitionDate: string;
  acquisitionCost: number;
}

// ── Milk ──────────────────────────────────────────────────────────────────────
export interface MilkRecord {
  id: string;
  farmId: string;
  date: string;
  morning: number;
  afternoon: number;
  evening: number;
  total: number;
  quality: "A" | "B" | "C";
  fatContent: number;
  proteinContent: number;
}

export interface MilkSession {
  id: string;
  farmId: string;
  animalId: string;
  date: string;
  session: "morning" | "afternoon" | "evening";
  liters: number;
  notes?: string;
}

// ── Health ────────────────────────────────────────────────────────────────────
export type HealthRecordType = "vaccination" | "treatment" | "checkup" | "surgery";

export interface HealthRecord {
  id: string;
  farmId: string;
  animalId: string;
  date: string;
  type: HealthRecordType;
  description: string;
  veterinarian: string;
  medication?: string;
  dosage?: string;
  cost: number;
  nextFollowUp?: string;
  notes: string;
}

export type VaccinationStatus = "overdue" | "due-soon" | "scheduled" | "completed";

export interface VaccinationSchedule {
  id: string;
  farmId: string;
  animalId: string;
  animalName: string;
  vaccine: string;
  dueDate: string;
  status: VaccinationStatus;
  priority: "high" | "medium" | "low";
}

// ── Reproduction ──────────────────────────────────────────────────────────────
export type ReproductionEventType = "heat" | "insemination" | "pregnancy-check" | "birth";

export interface ReproductionRecord {
  id: string;
  farmId: string;
  animalId: string;
  animalName: string;
  type: ReproductionEventType;
  date: string;
  result?: string;
  notes: string;
  technician?: string;
  bull?: string;
  straws?: string;
  expectedDueDate?: string;
}

// ── Feed ──────────────────────────────────────────────────────────────────────
export type FeedCategory = "forage" | "concentrate" | "supplement" | "mineral";

export interface FeedInventory {
  id: string;
  farmId: string;
  name: string;
  category: FeedCategory;
  currentStock: number;
  unit: string;
  dailyUsage: number;
  daysRemaining: number;
  costPerUnit: number;
  totalValue: number;
  reorderLevel: number;
  supplier: string;
  lastDelivery: string;
}

// ── Notifications ─────────────────────────────────────────────────────────────
export type NotificationType = "warning" | "alert" | "info" | "success";
export type NotificationCategory = "health" | "reproduction" | "feed" | "production" | "system";

export interface Notification {
  id: string;
  farmId: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  animalId?: string;
  category: NotificationCategory;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface ProfitabilityRecord {
  month: string;
  revenue: number;
  costs: number;
  profit: number;
}

export interface MonthlyMilk {
  month: string;
  liters: number;
  revenue: number;
}

// ── API layer (prepared for backend) ─────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  farm: Farm;
}
