"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Notification } from "@/types";

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount:   number;
  loading:       boolean;
  error:         string | null;
  markRead:      (id: string) => void;
  markAllRead:   () => void;
  dismiss:       (id: string) => void;
  clearAll:      () => void;
  refresh:       () => Promise<void>;
}

export function useNotifications(farmId: string | null): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!farmId) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);

      const [animalsRes, vaxRes, feedRes] = await Promise.all([
        supabase.from("animals").select("id,animal_name,health_status,reproductive_status,expected_birth_date").eq("farm_id", farmId),
        supabase.from("vaccinations").select("id,animal_id,vaccine_name,due_date,status").eq("farm_id", farmId).neq("status", "completed"),
        supabase.from("feed_inventory").select("id,feed_name,current_stock,reorder_level").eq("farm_id", farmId),
      ]);

      const animals = (animalsRes.data ?? []) as Array<{ id: string; animal_name: string; health_status: string | null; reproductive_status: string | null; expected_birth_date: string | null }>;
      const vaxRows = (vaxRes.data ?? []) as Array<{ id: string; animal_id: string; vaccine_name: string; due_date: string; status: string | null }>;
      const feedRows = (feedRes.data ?? []) as Array<{ id: string; feed_name: string; current_stock: number | null; reorder_level: number | null }>;

      const nameMap = new Map(animals.map((a: { id: string; animal_name: string }) => [a.id, a.animal_name]));
      const generated: Notification[] = [];
      const now = new Date().toISOString();

      // Sick/critical animals
      animals.filter(a => a.health_status === "sick" || a.health_status === "critical").forEach(a => {
        generated.push({
          id: `health-${a.id}`, farmId,
          type: a.health_status === "critical" ? "alert" : "warning",
          title: `${a.animal_name} needs attention`,
          message: `${a.animal_name} is marked as ${a.health_status}. Please check immediately.`,
          date: now, read: false, animalId: a.id, category: "health",
        });
      });

      // Overdue vaccinations
      vaxRows.filter(v => v.status === "overdue").forEach(v => {
        generated.push({
          id: `vax-overdue-${v.id}`, farmId,
          type: "alert", title: `Overdue vaccination`,
          message: `${nameMap.get(v.animal_id) ?? "Animal"}: ${v.vaccine_name} was due on ${v.due_date}.`,
          date: now, read: false, animalId: v.animal_id, category: "health",
        });
      });

      // Due-soon vaccinations
      vaxRows.filter(v => v.status === "due-soon").forEach(v => {
        generated.push({
          id: `vax-soon-${v.id}`, farmId,
          type: "warning", title: `Vaccination due soon`,
          message: `${nameMap.get(v.animal_id) ?? "Animal"}: ${v.vaccine_name} is due on ${v.due_date}.`,
          date: now, read: false, animalId: v.animal_id, category: "health",
        });
      });

      // Low feed stock
      feedRows.filter(f => (f.current_stock ?? 0) <= (f.reorder_level ?? 0)).forEach(f => {
        generated.push({
          id: `feed-${f.id}`, farmId,
          type: "warning", title: `Low feed stock: ${f.feed_name}`,
          message: `${f.feed_name} stock (${f.current_stock ?? 0}) is at or below reorder level (${f.reorder_level ?? 0}).`,
          date: now, read: false, category: "feed",
        });
      });

      // Expected calving within 7 days
      animals.filter(a => a.expected_birth_date).forEach(a => {
        const days = daysUntil(a.expected_birth_date!);
        if (days >= 0 && days <= 7) {
          generated.push({
            id: `calving-${a.id}`, farmId,
            type: "info", title: `Calving expected: ${a.animal_name}`,
            message: `${a.animal_name} is expected to calve in ${days} day${days === 1 ? "" : "s"}.`,
            date: now, read: false, animalId: a.id, category: "reproduction",
          });
        }
      });

      setNotifications(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally { setLoading(false); }
  }, [farmId]);

  useEffect(() => { fetch(); }, [fetch]);

  const markRead    = useCallback((id: string) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n)), []);
  const markAllRead = useCallback(() => setNotifications(p => p.map(n => ({ ...n, read: true }))), []);
  const dismiss     = useCallback((id: string) => setNotifications(p => p.filter(n => n.id !== id)), []);
  const clearAll    = useCallback(() => setNotifications([]), []);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    loading, error, refresh: fetch, markRead, markAllRead, dismiss, clearAll,
  };
}
