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
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-2 text-orange-200">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Flame className="h-5 w-5" />
            )}
          </div>

          <div>
            <p className="font-medium text-zinc-100">
              {isLoading
                ? `${personaName} sedang membaca CV...`
                : hasRoast
                  ? `Roast dari ${personaName}`
                  : "Belum ada roast"}
            </p>
            <p className="text-sm text-zinc-500">
              Hasil akan muncul secara streaming saat AI mulai merespons.
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

      <div className="min-h-[360px] whitespace-pre-wrap rounded-2xl border border-zinc-800 bg-black/40 p-5 text-sm leading-7 text-zinc-200">
        {hasRoast ? (
          roast
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-500">
              <Flame className="h-8 w-8" />
            </div>

            <p className="font-medium text-zinc-300">
              Roast CV kamu akan muncul di sini.
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Pilih persona, isi target role, lalu klik tombol roast. Feedback
              akan ditulis berdasarkan standar persona yang dipilih.
            </p>
          </div>
        )}

        {isLoading && hasRoast ? (
          <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-purple-300 align-middle" />
        ) : null}
      </div>
    </div>
  );
}