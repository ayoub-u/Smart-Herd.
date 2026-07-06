/**
 * API Service Layer
 * -----------------
 * All backend calls will go through this file.
 * Currently returns mock data. Replace the mock implementations
 * with real fetch() / axios / supabase calls when the backend is ready.
 *
 * Pattern:  service function → ApiResponse<T>
 * The shape never changes, so pages never need refactoring.
 */

import type {
  ApiResponse,
  LoginCredentials,
  LoginResponse,
  Animal,
  MilkRecord,
  HealthRecord,
  VaccinationSchedule,
  ReproductionRecord,
  FeedInventory,
  Notification,
  ProfitabilityRecord,
  MonthlyMilk,
} from "@/types";

import { animals, mockMilkRecords, mockHealthRecords, mockVaccinationSchedule,
         mockReproductionRecords, mockFeedInventory, mockNotifications,
         mockProfitabilityData, mockMonthlyMilk } from "@/data/mockData";

// ── Base URL (swap to real URL in .env.local) ─────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// ── Helper ────────────────────────────────────────────────────────────────────
function ok<T>(data: T): ApiResponse<T> {
  return { data, error: null, status: 200 };
}
function fail<T>(error: string, status = 500): ApiResponse<T> {
  return { data: null, error, status };
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
  /*
   * REAL IMPLEMENTATION (uncomment when backend is ready):
   *
   * const res = await fetch(`${API_BASE}/auth/login`, {
   *   method: "POST",
   *   headers: { "Content-Type": "application/json" },
   *   body: JSON.stringify(credentials),
   * });
   * const json = await res.json();
   * if (!res.ok) return fail(json.message, res.status);
   * return ok(json);
   */

  // Mock implementation
  await delay(600);
  if (credentials.email && credentials.password) {
    return ok({
      user: {
        id: "usr_001",
        email: credentials.email,
        fullName: "Ahmed Benali",
        avatarInitials: "AB",
        role: "owner" as const,
        createdAt: "2024-01-01",
      },
      token: "mock-jwt-token",
      farm: {
        id: "farm_001",
        ownerId: "usr_001",
        name: "Benali Family Farm",
        location: "Tlemcen",
        country: "Algeria",
        hectares: 120,
        timezone: "Africa/Algiers",
        currency: "DZD",
        createdAt: "2024-01-01",
      },
    });
  }
  return fail("Invalid credentials", 401);
}

export async function logout(): Promise<ApiResponse<null>> {
  await delay(200);
  return ok(null);
}

// ── Animals ───────────────────────────────────────────────────────────────────
export async function getAnimals(farmId: string): Promise<ApiResponse<Animal[]>> {
  await delay(300);
  return ok(animals.filter((a) => a.farmId === farmId));
}

export async function getAnimal(id: string): Promise<ApiResponse<Animal>> {
  await delay(200);
  const animal = animals.find((a) => a.id === id);
  if (!animal) return fail("Animal not found", 404);
  return ok(animal);
}

// ── Milk ──────────────────────────────────────────────────────────────────────
export async function getMilkRecords(farmId: string): Promise<ApiResponse<MilkRecord[]>> {
  await delay(300);
  return ok(mockMilkRecords.filter((r) => r.farmId === farmId));
}

export async function getMonthlyMilk(): Promise<ApiResponse<MonthlyMilk[]>> {
  await delay(200);
  return ok(mockMonthlyMilk);
}

// ── Health ────────────────────────────────────────────────────────────────────
export async function getHealthRecords(farmId: string): Promise<ApiResponse<HealthRecord[]>> {
  await delay(300);
  return ok(mockHealthRecords.filter((r) => r.farmId === farmId));
}

export async function getVaccinationSchedule(farmId: string): Promise<ApiResponse<VaccinationSchedule[]>> {
  await delay(200);
  return ok(mockVaccinationSchedule.filter((v) => v.farmId === farmId));
}

// ── Reproduction ──────────────────────────────────────────────────────────────
export async function getReproductionRecords(farmId: string): Promise<ApiResponse<ReproductionRecord[]>> {
  await delay(300);
  return ok(mockReproductionRecords.filter((r) => r.farmId === farmId));
}

// ── Feed ──────────────────────────────────────────────────────────────────────
export async function getFeedInventory(farmId: string): Promise<ApiResponse<FeedInventory[]>> {
  await delay(300);
  return ok(mockFeedInventory.filter((f) => f.farmId === farmId));
}

// ── Notifications ─────────────────────────────────────────────────────────────
export async function getNotifications(farmId: string): Promise<ApiResponse<Notification[]>> {
  await delay(200);
  return ok(mockNotifications.filter((n) => n.farmId === farmId));
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export async function getProfitability(): Promise<ApiResponse<ProfitabilityRecord[]>> {
  await delay(200);
  return ok(mockProfitabilityData);
}

// ── Utility ───────────────────────────────────────────────────────────────────
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
