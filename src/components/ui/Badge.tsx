import React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}