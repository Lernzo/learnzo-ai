"use client";
import Link from "next/link";
import { ReactNode } from "react";

export function GameShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/games" className="text-sm font-semibold text-brand-700 hover:underline">
        &larr; All games
      </Link>
      <h1 className="mt-2 text-2xl lg:text-3xl font-bold">{title}</h1>
      {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}