export interface DbProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "owner" | "manager" | "worker";
  created_at: string;
  updated_at: string;
}

export interface DbFarm {
  id: string;
  owner_id: string;
  farm_name: string;
  country: string | null;
  region: string | null;
  address: string | null;
  description: string | null;
  farm_size: number | null;
  currency: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAnimal {
  id: string;
  farm_id: string;
  animal_name: string;
  ear_tag: string | null;
  rfid: string | null;
  species: "cow" | "sheep" | "bull";
  breed: string | null;
  birth_date: string | null;
  weight: number | null;
  health_status: "healthy" | "sick" | "recovering" | "critical";
  reproductive_status: "pregnant" | "open" | "dry" | "lactating";
  sire: string | null;
  dam: string | null;
  location: string | null;
  notes: string | null;
  acquisition_date: string | null;
  acquisition_cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbHealthRecord {
  id: string;
  farm_id: string;
  animal_id: string;
  record_date: string;
  record_type: "vaccination" | "treatment" | "checkup" | "surgery";
  description: string;
  veterinarian: string | null;
  medication: string | null;
  dosage: string | null;
  cost: number | null;
  next_follow_up: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbVaccination {
  id: string;
  farm_id: string;
  animal_id: string;
  vaccine_name: string;
  due_date: string;
  administered_date: string | null;
  status: "overdue" | "due-soon" | "scheduled" | "completed";
  priority: "high" | "medium" | "low";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbReproductionEvent {
  id: string;
  farm_id: string;
  animal_id: string;
  event_type: "heat" | "insemination" | "pregnancy-check" | "birth";
  event_date: string;
  result: string | null;
  notes: string | null;
  technician: string | null;
  bull_name: string | null;
  straw_id: string | null;
  expected_due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMilkRecord {
  id: string;
  farm_id: string;
  record_date: string;
  morning_liters: number | null;
  afternoon_liters: number | null;
  evening_liters: number | null;
  total_liters: number | null;
  quality_grade: "A" | "B" | "C" | null;
  fat_percentage: number | null;
  protein_percentage: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFeedItem {
  id: string;
  farm_id: string;
  feed_name: string;
  category: "forage" | "concentrate" | "supplement" | "mineral";
  current_stock: number;
  unit: string;
  daily_usage: number;
  cost_per_unit: number;
  reorder_level: number;
  supplier: string | null;
  last_delivery_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type DbAnimalInsert       = Omit<DbAnimal,           "id"|"created_at"|"updated_at">;
export type DbFarmInsert         = Omit<DbFarm,             "id"|"created_at"|"updated_at">;
export type DbHealthRecordInsert = Omit<DbHealthRecord,     "id"|"created_at"|"updated_at">;
export type DbVaccinationInsert  = Omit<DbVaccination,      "id"|"created_at"|"updated_at">;
export type DbReproductionInsert = Omit<DbReproductionEvent,"id"|"created_at"|"updated_at">;
export type DbMilkRecordInsert   = Omit<DbMilkRecord,       "id"|"created_at"|"updated_at">;
export type DbFeedItemInsert     = Omit<DbFeedItem,         "id"|"created_at"|"updated_at">;

export interface Database {
  public: {
    Tables: {
      profiles:            { Row: DbProfile;           Insert: Omit<DbProfile,"created_at"|"updated_at">;            Update: Partial<Omit<DbProfile,"id"|"created_at">>; };
      farms:               { Row: DbFarm;              Insert: DbFarmInsert;                                          Update: Partial<Omit<DbFarm,"id"|"created_at">>; };
      animals:             { Row: DbAnimal;            Insert: DbAnimalInsert;                                        Update: Partial<Omit<DbAnimal,"id"|"farm_id"|"created_at">>; };
      health_records:      { Row: DbHealthRecord;      Insert: DbHealthRecordInsert;                                  Update: Partial<Omit<DbHealthRecord,"id"|"farm_id"|"created_at">>; };
      vaccinations:        { Row: DbVaccination;       Insert: DbVaccinationInsert;                                   Update: Partial<Omit<DbVaccination,"id"|"farm_id"|"created_at">>; };
      reproduction_events: { Row: DbReproductionEvent; Insert: DbReproductionInsert;                                  Update: Partial<Omit<DbReproductionEvent,"id"|"farm_id"|"created_at">>; };
      milk_records:        { Row: DbMilkRecord;        Insert: DbMilkRecordInsert;                                    Update: Partial<Omit<DbMilkRecord,"id"|"farm_id"|"created_at">>; };
      feed_inventory:      { Row: DbFeedItem;          Insert: DbFeedItemInsert;                                      Update: Partial<Omit<DbFeedItem,"id"|"farm_id"|"created_at">>; };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
