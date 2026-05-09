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
  isLoading?: boolean;
  onApply: (replacement: string) => void;
  onClose: () => void;
}

export function DiffOverlay({
  originalText,
  critiqueReason,
  result,
  isLoading = false,
  onApply,
  onClose,
}: DiffOverlayProps) {
  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-purple-100">AI Rewrite Suggestion</p>
          <p className="mt-1 text-sm leading-6 text-purple-100/70">
            Pilih versi rewrite yang mau kamu apply ke CV.
          </p>
        </div>

        <Button type="button" size="sm" variant="secondary" onClick={onClose}>
          <X className="mr-2 h-4 w-4" />
          Close
        </Button>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-red-200/70">
            Original
          </p>
          <p className="text-sm leading-6 text-red-100">{originalText}</p>
        </div>

        <div className="rounded-xl border border-zinc-700 bg-zinc-950/70 p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Critique reason
          </p>
          <p className="text-sm leading-6 text-zinc-400">{critiqueReason}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI sedang menulis ulang bullet...
          </div>
        ) : null}

        {result ? (
          <>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
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

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-blue-200/70">
                Ideal Version
              </p>
              <p className="text-sm leading-6 text-blue-100">
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