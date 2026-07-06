import Link from "next/link";
import { Leaf } from "lucide-react";
import { ROUTES, APP_NAME } from "@/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col">
      {/* Minimal header */}
      <header className="h-16 flex items-center px-6">
        <Link href={ROUTES.HOME} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-green flex items-center justify-center shadow-sm">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">{APP_NAME}</span>
        </Link>
      </header>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>

      {/* Footer */}
      <footer className="h-12 flex items-center justify-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} {APP_NAME} · 
          <Link href={ROUTES.HOME} className="hover:text-gray-600 ml-1">Back to homepage</Link>
        </p>
      </footer>
    </div>
  );
}
