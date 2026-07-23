"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface DashboardStats {
  totalAnimals:      number;
  healthyAnimals:    number;
  sickAnimals:       number;
  pregnantAnimals:   number;
  lactatingAnimals:  number;
  milkToday:         number;
  milkAvg:           number;
  overdueVaccines:   number;
  dueSoonVaccines:   number;
  lowFeedItems:      number;
  totalFeedValue:    number;
  milkLast7:         { date: string; total: number }[];
  monthlyProfitability: { month: string; revenue: number; costs: number; profit: number }[];
  topProducers:      { name: string; tag: string; liters: number }[];
  animalsBySpecies:  { species: string; count: number }[];
  animalsByHealth:   { status: string; count: number }[];
  loading:           boolean;
  error:             string | null;
  refresh:           () => Promise<void>;
}

export function useDashboard(farmId: string | null): DashboardStats {
  const [stats, setStats] = useState<Omit<DashboardStats, "loading"|"error"|"refresh">>({
    totalAnimals: 0, healthyAnimals: 0, sickAnimals: 0, pregnantAnimals: 0,
    lactatingAnimals: 0, milkToday: 0, milkAvg: 0, overdueVaccines: 0,
    dueSoonVaccines: 0, lowFeedItems: 0, totalFeedValue: 0,
    milkLast7: [], monthlyProfitability: [], topProducers: [],
    animalsBySpecies: [], animalsByHealth: [],
  });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!farmId) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);

      const todayStr = new Date().toISOString().split("T")[0];

      // Only select columns that actually exist in the animals table
      const [animalsRes, milkRes, feedRes, vaxRes] = await Promise.all([
        supabase
          .from("animals")
          .select("animal_name,ear_tag,health_status,reproductive_status,species")
          .eq("farm_id", farmId),
        supabase
          .from("milk_records")
          .select("record_date,total_liters")
          .eq("farm_id", farmId)
          .order("record_date", { ascending: false })
          .limit(365),
        supabase
          .from("feed_inventory")
          .select("current_stock,reorder_level,cost_per_unit,daily_usage")
          .eq("farm_id", farmId),
        supabase
          .from("vaccinations")
          .select("status")
          .eq("farm_id", farmId),
      ]);

      const animals  = animalsRes.data ?? [];
      const milkRows = milkRes.data    ?? [];
      const feedRows = feedRes.data    ?? [];
      const vaxRows  = vaxRes.data     ?? [];

      // ── Animal KPIs ────────────────────────────────────────────────────────
      const totalAnimals     = animals.length;
      const healthyAnimals   = animals.filter(a => a.health_status === "healthy").length;
      const sickAnimals      = animals.filter(a => a.health_status === "sick" || a.health_status === "critical").length;
      const pregnantAnimals  = animals.filter(a => a.reproductive_status === "pregnant").length;
      const lactatingAnimals = animals.filter(a => a.reproductive_status === "lactating").length;

      // ── Milk KPIs — from milk_records, NOT from animals columns ────────────
      const todayMilkRows = milkRows.filter(r => r.record_date === todayStr);
      const milkToday     = todayMilkRows.reduce((s, r) => s + (r.total_liters ?? 0), 0);
      const milkAvg       = milkRows.length > 0
        ? milkRows.reduce((s, r) => s + (r.total_liters ?? 0), 0) / milkRows.length
        : 0;

      // ── Last 7 days milk chart ─────────────────────────────────────────────
      const last7Map = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        last7Map.set(d.toISOString().split("T")[0], 0);
      }
      milkRows.forEach(r => {
        if (last7Map.has(r.record_date)) last7Map.set(r.record_date, r.total_liters ?? 0);
      });
      const milkLast7 = Array.from(last7Map.entries()).map(([date, total]) => ({ date, total }));

      // ── Monthly profitability ──────────────────────────────────────────────
      const monthMap = new Map<string, { revenue: number; costs: number }>();
      milkRows.forEach(r => {
        const m = r.record_date.slice(0, 7);
        if (!monthMap.has(m)) monthMap.set(m, { revenue: 0, costs: 0 });
        monthMap.get(m)!.revenue += (r.total_liters ?? 0) * 50;
      });
      const monthlyCost = feedRows.reduce((s, f) => s + (f.daily_usage ?? 0) * (f.cost_per_unit ?? 0) * 30, 0);
      const curMonth = new Date().toISOString().slice(0, 7);
      if (!monthMap.has(curMonth)) monthMap.set(curMonth, { revenue: 0, costs: 0 });
      monthMap.get(curMonth)!.costs += monthlyCost;

      const monthlyProfitability = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b)).slice(-6)
        .map(([month, { revenue, costs }]) => ({
          month: new Date(month + "-01").toLocaleString("default", { month: "short" }),
          revenue: Math.round(revenue),
          costs:   Math.round(costs),
          profit:  Math.round(revenue - costs),
        }));

      // ── Top producers — from most recent milk records ───────────────────────
      // Since milk is per-farm (not per-animal) in current schema, show
      // animals marked as lactating with most recent milk total as indicator
      const topProducers = animals
        .filter(a => a.reproductive_status === "lactating")
        .slice(0, 5)
        .map(a => ({ name: a.animal_name, tag: a.ear_tag ?? "", liters: milkToday > 0 ? Math.round(milkToday / Math.max(1, lactatingAnimals) * 10) / 10 : 0 }));

      // ── Species + health breakdowns ────────────────────────────────────────
      const speciesMap = new Map<string, number>();
      animals.forEach(a => speciesMap.set(a.species, (speciesMap.get(a.species) ?? 0) + 1));
      const animalsBySpecies = Array.from(speciesMap.entries()).map(([species, count]) => ({ species, count }));

      const healthMap = new Map<string, number>();
      animals.forEach(a => healthMap.set(a.health_status, (healthMap.get(a.health_status) ?? 0) + 1));
      const animalsByHealth = Array.from(healthMap.entries()).map(([status, count]) => ({ status, count }));

      // ── Vaccines ───────────────────────────────────────────────────────────
      const overdueVaccines = vaxRows.filter(v => v.status === "overdue").length;
      const dueSoonVaccines = vaxRows.filter(v => v.status === "due-soon").length;

      // ── Feed ───────────────────────────────────────────────────────────────
      const lowFeedItems   = feedRows.filter(f => f.current_stock <= f.reorder_level).length;
      const totalFeedValue = feedRows.reduce((s, f) => s + f.current_stock * (f.cost_per_unit ?? 0), 0);

      setStats({
        totalAnimals, healthyAnimals, sickAnimals, pregnantAnimals, lactatingAnimals,
        milkToday: Math.round(milkToday * 10) / 10,
        milkAvg:   Math.round(milkAvg   * 10) / 10,
        overdueVaccines, dueSoonVaccines, lowFeedItems, totalFeedValue,
        milkLast7, monthlyProfitability, topProducers, animalsBySpecies, animalsByHealth,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally { setLoading(false); }
  }, [farmId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...stats, loading, error, refresh: fetch };
}
