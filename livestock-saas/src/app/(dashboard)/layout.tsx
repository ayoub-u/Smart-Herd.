"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav }  from "@/components/layout/TopNav";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES }  from "@/constants";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, authError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !authError) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isLoading, isAuthenticated, authError, router]);

  // ── Loading spinner ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f6f8]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full animate-spin"
            style={{
              border: "3px solid #d1fae5",
              borderTopColor: "#059669",
            }}
          />
          <p className="text-sm text-gray-400 font-medium">Loading SmartHerd…</p>
        </div>
      </div>
    );
  }

  // ── Error screen — loading ended but something went wrong ─────────────────
  // This replaces the infinite spinner when farm creation or session
  // bootstrap throws an error.
  if (authError) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f6f8] p-6">
        <div className="bg-white rounded-2xl border border-red-100 shadow-card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            We couldn't load your farm data. This is usually a temporary issue.
          </p>
          <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-3 mb-6 font-mono text-left break-all">
            {authError}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              Try Again
            </button>
            <Link
              href={ROUTES.LOGIN}
              className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm text-center"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Not authenticated — redirect in progress ───────────────────────────────
  if (!isAuthenticated) {
    return null;
  }

  // ── Authenticated — render dashboard shell ─────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6f8]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
