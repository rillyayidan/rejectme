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
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-white/10 bg-black/25 p-6 text-center">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-emerald-200" />
        <p className="font-medium text-neutral-100">
          Breaking the critique into action items...
        </p>
        <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
          The long roast is being converted into fixable resume issues.
        </p>
      </div>
    );
  }

  if (!structuredRoast) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-white/10 bg-black/25 p-6 text-center">
        <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-4 text-neutral-500">
          <MessageSquareWarning className="h-8 w-8" />
        </div>

        <p className="font-medium text-neutral-300">No critique items yet.</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
          Specific resume issues appear after the roast finishes.
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
      <div className="rounded-lg border border-white/10 bg-black/25 p-4">
        <p className="text-sm font-semibold text-neutral-100">
          Structured Review
        </p>

        <p className="mt-2 text-sm leading-6 text-neutral-400">
          {structuredRoast.overall_impression ||
            "The structured review was created, but no overall impression was returned."}
        </p>

        <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Verdict
          </p>
          <p className="mt-1 text-sm leading-6 text-neutral-300">
            {structuredRoast.verdict || "No verdict yet."}
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
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-emerald-100/80">
          All fixable critique items are resolved.
        </div>
      )}

      {strengths.length > 0 ? (
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
          <p className="text-sm font-semibold text-cyan-100">Strengths</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-cyan-100/75">
            {strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {quickWins.length > 0 ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
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
