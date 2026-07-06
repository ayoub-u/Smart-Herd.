import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon = "📭", title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      <div className="text-5xl mb-4 opacity-60">{icon}</div>
      <p className="font-semibold text-gray-600 text-base">{title}</p>
      {message && <p className="text-sm text-gray-400 mt-1.5 max-w-xs leading-relaxed">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}