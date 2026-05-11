"use client";

import { FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CVInputEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function CVInputEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Paste your CV text here...",
}: CVInputEditorProps) {
  const characterCount = value.length;
  const wordCount = value.trim()
    ? value.trim().split(/\s+/).filter(Boolean).length
    : 0;

  function handleClear() {
    onChange("");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/25 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-neutral-300">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <p className="font-medium text-neutral-100">CV Text Editor</p>
            <p className="text-sm text-neutral-500">
              {wordCount} words / {characterCount} characters
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || value.trim().length === 0}
          onClick={handleClear}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>

      <Textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[340px] resize-y rounded-lg border-white/10 bg-black/35 text-sm leading-7 text-neutral-100 placeholder:text-neutral-600"
      />

      <p className="text-xs leading-5 text-neutral-500">
        Clean up work experience and achievement bullets before roasting. The
        review is sharper when the extracted CV text is tidy.
      </p>
    </div>
  );
}
