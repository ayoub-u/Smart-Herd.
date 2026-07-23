"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { DbFeedItem, DbFeedItemInsert } from "@/types/supabase";
import type { FeedInventory } from "@/types";

function dbToFeedItem(row: DbFeedItem): FeedInventory {
  const daysRemaining = row.daily_usage > 0 ? Math.floor(row.current_stock / row.daily_usage) : 999;
  return {
    id: row.id, farmId: row.farm_id, name: row.feed_name,
    category: row.category, currentStock: row.current_stock, unit: row.unit,
    dailyUsage: row.daily_usage, daysRemaining,
    costPerUnit: row.cost_per_unit,
    totalValue: row.current_stock * row.cost_per_unit,
    reorderLevel: row.reorder_level,
    supplier: row.supplier ?? "",
    lastDelivery: row.last_delivery_date ?? "",
  };
}

export interface FeedInsertPayload {
  feed_name: string;
  category: DbFeedItem["category"];
  current_stock: number;
  unit: string;
  daily_usage: number;
  cost_per_unit: number;
  reorder_level: number;
  supplier?: string;
  last_delivery_date?: string;
  notes?: string;
}

interface UseFeedInventoryResult {
  feedItems:  FeedInventory[];
  loading:    boolean;
  error:      string | null;
  refresh:    () => Promise<void>;
  addFeedItem: (p: FeedInsertPayload) => Promise<{ error: string | null }>;
  updateFeedItem: (id: string, p: Partial<FeedInsertPayload>) => Promise<{ error: string | null }>;
  deleteFeedItem: (id: string) => Promise<{ error: string | null }>;
  totalCostPerDay: number;
}

export function useFeedInventory(farmId: string | null): UseFeedInventoryResult {
  const [feedItems, setFeedItems] = useState<FeedInventory[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!farmId) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const { data, error: e } = await supabase
        .from("feed_inventory").select("*").eq("farm_id", farmId)
        .order("feed_name", { ascending: true });
      if (e) throw new Error(e.message);
      setFeedItems((data ?? []).map(dbToFeedItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed inventory");
    } finally { setLoading(false); }
  }, [farmId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addFeedItem = useCallback(async (payload: FeedInsertPayload) => {
    if (!farmId) return { error: "Farm not loaded." };
    const insert: DbFeedItemInsert = {
      farm_id: farmId, feed_name: payload.feed_name, category: payload.category,
      current_stock: payload.current_stock, unit: payload.unit,
      daily_usage: payload.daily_usage, cost_per_unit: payload.cost_per_unit,
      reorder_level: payload.reorder_level, supplier: payload.supplier ?? null,
      last_delivery_date: payload.last_delivery_date ?? null, notes: payload.notes ?? null,
    };
    const { error: e } = await supabase.from("feed_inventory").insert(insert);
    if (e) return { error: e.message };
    await fetch();
    return { error: null };
  }, [farmId, fetch]);

  const updateFeedItem = useCallback(async (id: string, payload: Partial<FeedInsertPayload>) => {
    const u: Record<string, unknown> = {};
    if (payload.feed_name          !== undefined) u.feed_name          = payload.feed_name;
    if (payload.current_stock      !== undefined) u.current_stock      = payload.current_stock;
    if (payload.daily_usage        !== undefined) u.daily_usage        = payload.daily_usage;
    if (payload.cost_per_unit      !== undefined) u.cost_per_unit      = payload.cost_per_unit;
    if (payload.reorder_level      !== undefined) u.reorder_level      = payload.reorder_level;
    if (payload.supplier           !== undefined) u.supplier           = payload.supplier;
    if (payload.last_delivery_date !== undefined) u.last_delivery_date = payload.last_delivery_date;
    if (!Object.keys(u).length) return { error: null };
    const { error: e } = await supabase.from("feed_inventory").update(u).eq("id", id);
    if (e) return { error: e.message };
    await fetch();
    return { error: null };
  }, [fetch]);

  const deleteFeedItem = useCallback(async (id: string) => {
    setFeedItems(prev => prev.filter(f => f.id !== id));
    const { error: e } = await supabase.from("feed_inventory").delete().eq("id", id);
    if (e) { await fetch(); return { error: e.message }; }
    return { error: null };
  }, [fetch]);

  const totalCostPerDay = feedItems.reduce((s, f) => s + f.dailyUsage * f.costPerUnit, 0);

  return { feedItems, loading, error, refresh: fetch, addFeedItem, updateFeedItem, deleteFeedItem, totalCostPerDay };
}
