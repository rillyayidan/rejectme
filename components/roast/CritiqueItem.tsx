// components/roast/CritiqueItem.tsx

"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  Hammer,
  ShieldAlert,
} from "lucide-react";
import type {
  CritiqueCategory,
  CritiqueItem as CritiqueItemType,
  CritiqueSeverity,
} from "@/lib/critique";
import { Button } from "@/components/ui/button";

interface CritiqueItemProps {
  critique: CritiqueItemType;
  onFix?: (critique: CritiqueItemType) => void;
  disabled?: boolean;
}

const CATEGORY_LABELS: Record<CritiqueCategory, string> = {
  ats_readability: "ATS Readability",
  role_match: "Role Match",
  recruiter_clarity: "Recruiter Clarity",
  impact_proof: "Impact Proof",
  red_flag: "Red Flag",
  formatting: "Formatting",
  language: "Language",
  missing_info: "Missing Info",
};

function getSeverityClass(severity: CritiqueSeverity) {
  if (severity === "fatal") {
    return "border-red-500/40 bg-red-500/10 text-red-100";
  }

  if (severity === "high") {
    return "border-orange-500/40 bg-orange-500/10 text-orange-100";
  }

  if (severity === "medium") {
    return "border-yellow-500/40 bg-yellow-500/10 text-yellow-100";
  }

  return "border-zinc-700 bg-zinc-900 text-zinc-300";
}

function getSeverityIcon(severity: CritiqueSeverity) {
  if (severity === "fatal") {
    return <ShieldAlert className="h-4 w-4" />;
  }

  if (severity === "high") {
    return <Flame className="h-4 w-4" />;
  }

  if (severity === "medium") {
    return <AlertTriangle className="h-4 w-4" />;
  }

  return <CheckCircle2 className="h-4 w-4" />;
}

export function CritiqueItem({
  critique,
  onFix,
  disabled = false,
}: CritiqueItemProps) {
  const categoryLabel = CATEGORY_LABELS[critique.category] ?? critique.category;

  return (
    <article className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${getSeverityClass(
                critique.severity
              )}`}
            >
              {getSeverityIcon(critique.severity)}
              {critique.severity.toUpperCase()}
            </span>

            <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-200">
              {categoryLabel}
            </span>

            {critique.fixable ? (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
                Fixable
              </span>
            ) : (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-400">
                Manual Fix
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-zinc-100">
            {critique.issue}
          </h3>
        </div>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || !critique.fixable}
          onClick={() => onFix?.(critique)}
        >
          <Hammer className="mr-2 h-4 w-4" />
          Fix This
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Quoted from CV
          </p>
          <p className="text-sm leading-6 text-zinc-300">
            “{critique.quoted_text}”
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Why it matters
          </p>
          <p className="text-sm leading-6 text-zinc-400">{critique.reason}</p>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Suggested direction
          </p>
          <p className="text-sm leading-6 text-zinc-300">
            {critique.suggestion}
          </p>
        </div>
      </div>
    </article>
  );
}