// components/roast/RoastPanel.tsx

"use client";

import { Copy, Flame, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoastPanelProps {
  roast: string;
  isLoading?: boolean;
  personaName?: string;
}

export function RoastPanel({
  roast,
  isLoading = false,
  personaName = "HRD",
}: RoastPanelProps) {
  async function handleCopy() {
    if (!roast.trim()) return;
    await navigator.clipboard.writeText(roast);
  }

  const hasRoast = roast.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/25 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-2 text-orange-200">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Flame className="h-5 w-5" />
            )}
          </div>

          <div>
            <p className="font-medium text-neutral-100">
              {isLoading
                ? `${personaName} is reading the CV...`
                : hasRoast
                  ? `Roast from ${personaName}`
                  : "No roast yet"}
            </p>
            <p className="text-sm text-neutral-500">
              Feedback streams in as the model responds.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!hasRoast}
          onClick={handleCopy}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </Button>
      </div>

      <div className="min-h-[360px] whitespace-pre-wrap rounded-lg border border-white/10 bg-black/35 p-5 text-sm leading-7 text-neutral-200">
        {hasRoast ? (
          roast
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-4 text-neutral-500">
              <Flame className="h-8 w-8" />
            </div>

            <p className="font-medium text-neutral-300">
              The CV roast will appear here.
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
              Choose a persona, add the target role, then run the critique.
            </p>
          </div>
        )}

        {isLoading && hasRoast ? (
          <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-emerald-300 align-middle" />
        ) : null}
      </div>
    </div>
  );
}
