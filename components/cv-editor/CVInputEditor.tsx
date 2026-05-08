// components/cv-editor/CVInputEditor.tsx

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
  placeholder = "Paste isi CV kamu di sini...",
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
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-2 text-zinc-300">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <p className="font-medium text-zinc-100">CV Text Editor</p>
            <p className="text-sm text-zinc-500">
              {wordCount} words · {characterCount} characters
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
        className="min-h-[320px] resize-y border-zinc-800 bg-black/40 text-sm leading-7 text-zinc-100 placeholder:text-zinc-600"
      />

      <p className="text-xs leading-5 text-zinc-500">
        Tip: kalau hasil PDF berantakan, rapikan bagian pengalaman kerja dan bullet
        achievement dulu. Roast akan lebih akurat kalau CV text-nya bersih.
      </p>
    </div>
  );
}