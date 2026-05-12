// components/cv-editor/DiffOverlay.tsx

"use client";

import { Check, Copy, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FixResult {
  minimal: string;
  ideal: string;
  raw: string;
}

interface DiffOverlayProps {
  originalText: string;
  critiqueReason: string;
  result: FixResult | null;
  manualApplyMessage?: string;
  isLoading?: boolean;
  onApply: (replacement: string) => void;
  onClose: () => void;
}

export function DiffOverlay({
  originalText,
  critiqueReason,
  result,
  manualApplyMessage,
  isLoading = false,
  onApply,
  onClose,
}: DiffOverlayProps) {
  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-emerald-100">AI Rewrite Suggestion</p>
          <p className="mt-1 text-sm leading-6 text-emerald-100/70">
            Pick the rewrite version to apply to the CV.
          </p>
        </div>

        <Button type="button" size="sm" variant="secondary" onClick={onClose}>
          <X className="mr-2 h-4 w-4" />
          Close
        </Button>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-red-200/70">
            Original
          </p>
          <p className="text-sm leading-6 text-red-100">{originalText}</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Critique reason
          </p>
          <p className="text-sm leading-6 text-neutral-400">{critiqueReason}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-4 text-sm text-neutral-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Writing rewrite options...
          </div>
        ) : null}

        {manualApplyMessage ? (
          <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm leading-6 text-amber-100">
            {manualApplyMessage}
          </div>
        ) : null}

        {result ? (
          <>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-200/70">
                Minimal Fix
              </p>
              <p className="text-sm leading-6 text-emerald-100">
                {result.minimal}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onApply(result.minimal)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Apply Minimal
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void handleCopy(result.minimal)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cyan-200/70">
                Ideal Version
              </p>
              <p className="text-sm leading-6 text-cyan-100">
                {result.ideal}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onApply(result.ideal)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Apply Ideal
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void handleCopy(result.ideal)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
