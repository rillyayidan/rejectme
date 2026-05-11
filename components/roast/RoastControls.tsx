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
            className="text-sm font-medium text-neutral-300"
          >
            Target Role
          </label>
          <Input
            id="target-role"
            value={targetRole}
            disabled={isLoading}
            onChange={(event) => onTargetRoleChange(event.target.value)}
            placeholder="Example: Frontend Developer"
            className="rounded-lg border-white/10 bg-black/35 text-neutral-100 placeholder:text-neutral-600"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="target-company"
            className="text-sm font-medium text-neutral-300"
          >
            Target Company
            <span className="ml-1 text-neutral-500">(optional)</span>
          </label>
          <Input
            id="target-company"
            value={targetCompany}
            disabled={isLoading}
            onChange={(event) => onTargetCompanyChange(event.target.value)}
            placeholder="Example: Tokopedia, BUMN, Bank Mandiri"
            className="rounded-lg border-white/10 bg-black/35 text-neutral-100 placeholder:text-neutral-600"
          />
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        disabled={isSubmitDisabled}
        onClick={() => void onSubmit()}
        className="w-full bg-emerald-300 text-neutral-950 hover:bg-emerald-200"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            HR is reading the CV...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Roast My CV
          </>
        )}
      </Button>

      <p className="text-xs leading-5 text-neutral-500">
        The target role anchors the critique to the job, not just generic CV
        polish.
      </p>
    </div>
  );
}
