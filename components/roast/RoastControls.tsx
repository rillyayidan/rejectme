// components/roast/RoastControls.tsx

"use client";

import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RoastControlsProps {
  targetRole: string;
  targetCompany: string;
  isLoading?: boolean;
  disabled?: boolean;
  onTargetRoleChange: (value: string) => void;
  onTargetCompanyChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
}

export function RoastControls({
  targetRole,
  targetCompany,
  isLoading = false,
  disabled = false,
  onTargetRoleChange,
  onTargetCompanyChange,
  onSubmit,
}: RoastControlsProps) {
  const isSubmitDisabled = disabled || isLoading || targetRole.trim().length < 2;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="target-role"
            className="text-sm font-medium text-zinc-300"
          >
            Target Role
          </label>
          <Input
            id="target-role"
            value={targetRole}
            disabled={isLoading}
            onChange={(event) => onTargetRoleChange(event.target.value)}
            placeholder="Contoh: Frontend Developer"
            className="border-zinc-800 bg-black/40 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="target-company"
            className="text-sm font-medium text-zinc-300"
          >
            Target Company
            <span className="ml-1 text-zinc-500">(optional)</span>
          </label>
          <Input
            id="target-company"
            value={targetCompany}
            disabled={isLoading}
            onChange={(event) => onTargetCompanyChange(event.target.value)}
            placeholder="Contoh: Tokopedia, BUMN, Bank Mandiri"
            className="border-zinc-800 bg-black/40 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        disabled={isSubmitDisabled}
        onClick={() => void onSubmit()}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            HRD sedang membaca CV...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Roast My CV
          </>
        )}
      </Button>

      <p className="text-xs leading-5 text-zinc-500">
        Target role penting karena persona akan menilai apakah isi CV kamu cocok
        dengan posisi yang dituju, bukan cuma menilai CV secara umum.
      </p>
    </div>
  );
}