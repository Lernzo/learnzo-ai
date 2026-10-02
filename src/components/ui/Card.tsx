import React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-3xl bg-white shadow-soft border border-slate-100 p-6",
        className
      )}
    />
  );
}