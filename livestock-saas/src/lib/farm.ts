import { supabase } from "@/lib/supabase";
import type { DbFarm } from "@/types/supabase";
import type { Farm } from "@/types";

const DEFAULT_COUNTRY  = "Algeria";
const DEFAULT_CURRENCY = "DZD";
const DEFAULT_TIMEZONE = "Africa/Algiers";

export interface GetOrCreateFarmResult {
  farm: DbFarm;
  created: boolean;
}

async function getProfileFullName(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();
  return data?.full_name?.trim() ?? "";
}

function buildFarmName(fullName: string): string {
  if (!fullName) return "My Farm";
  const base = fullName.length <= 30 ? fullName : fullName.split(" ")[0];
  return `${base}'s Farm`;
}

export async function getOrCreateFarm(userId: string): Promise<GetOrCreateFarmResult> {
  const { data: existingFarm, error: selectError } = await supabase
    .from("farms")
    .select("*")
    .eq("owner_id", userId)
    .single();

  if (existingFarm) return { farm: existingFarm, created: false };
  if (selectError && selectError.code !== "PGRST116") {
    throw new Error(`Failed to query farms: ${selectError.message}`);
  }

  const fullName = await getProfileFullName(userId);
  const farmName = buildFarmName(fullName);

  const { data: upsertedFarm, error: upsertError } = await supabase
    .from("farms")
    .upsert(
      { owner_id: userId, farm_name: farmName, country: DEFAULT_COUNTRY,
        region: "", address: "", description: "", farm_size: null,
        currency: DEFAULT_CURRENCY, timezone: DEFAULT_TIMEZONE },
      { onConflict: "owner_id", ignoreDuplicates: false }
    )
    .select("*")
    .single();

  if (upsertedFarm) return { farm: upsertedFarm, created: true };

  const { data: fallbackFarm, error: fallbackError } = await supabase
    .from("farms").select("*").eq("owner_id", userId).single();

  if (fallbackFarm) return { farm: fallbackFarm, created: false };

  throw new Error(
    `Unable to create or find farm. Upsert: ${upsertError?.message}. Fallback: ${fallbackError?.message}`
  );
}

export function dbFarmToDomain(row: DbFarm): Farm {
  return {
    id:          row.id,
    ownerId:     row.owner_id,
    name:        row.farm_name,
    location:    row.region    ?? "",
    country:     row.country   ?? "",
    hectares:    row.farm_size ?? 0,
    timezone:    row.timezone  ?? DEFAULT_TIMEZONE,
    currency:    row.currency  ?? DEFAULT_CURRENCY,
    createdAt:   row.created_at,
  };
}

