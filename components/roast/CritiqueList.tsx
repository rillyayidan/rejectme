// components/roast/CritiqueList.tsx

"use client";

import { Loader2, MessageSquareWarning } from "lucide-react";
import type {
  CritiqueItem as CritiqueItemType,
  StructuredRoastResult,
} from "@/lib/critique";
import { CritiqueItem } from "@/components/roast/CritiqueItem";

interface CritiqueListProps {
  structuredRoast: StructuredRoastResult | null;
  isLoading?: boolean;
  onFix?: (critique: CritiqueItemType) => void;
}

export function CritiqueList({
  structuredRoast,
  isLoading = false,
  onFix,
}: CritiqueListProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-black/30 p-6 text-center">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-purple-200" />
        <p className="font-medium text-zinc-100">
          Membedah kritik satu per satu...
        </p>
        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
          AI sedang mengubah roast panjang menjadi daftar critique item yang bisa
          ditindaklanjuti.
        </p>
      </div>
    );
  }

  if (!structuredRoast) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-black/30 p-6 text-center">
        <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-500">
          <MessageSquareWarning className="h-8 w-8" />
        </div>

        <p className="font-medium text-zinc-300">Belum ada critique items.</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
          Setelah roast selesai, daftar kritik spesifik akan muncul di sini.
        </p>
      </div>
    );
  }

  const critiques = Array.isArray(structuredRoast.critiques)
    ? structuredRoast.critiques
    : [];

  const strengths = Array.isArray(structuredRoast.strengths)
    ? structuredRoast.strengths
    : [];

  const quickWins = Array.isArray(structuredRoast.quick_wins)
    ? structuredRoast.quick_wins
    : [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
        <p className="text-sm font-semibold text-zinc-100">
          Structured Review
        </p>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {structuredRoast.overall_impression ||
            "AI sudah membuat structured review, tapi overall impression tidak tersedia."}
        </p>

        <div className="mt-4 rounded-xl border border-zinc-800 bg-black/30 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Verdict
          </p>
          <p className="mt-1 text-sm leading-6 text-zinc-300">
            {structuredRoast.verdict || "Belum ada verdict."}
          </p>
        </div>
      </div>

      {critiques.length > 0 ? (
        critiques.map((critique) => (
          <CritiqueItem
            key={critique.id}
            critique={critique}
            onFix={onFix}
          />
        ))
      ) : (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-emerald-100/80">
          Semua critique item sudah dibereskan atau tidak ada kritik fixable yang tersisa.
        </div>
      )}

      {strengths.length > 0 ? (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-sm font-semibold text-blue-100">Strengths</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-blue-100/75">
            {strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {quickWins.length > 0 ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-sm font-semibold text-emerald-100">Quick Wins</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-emerald-100/75">
            {quickWins.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}