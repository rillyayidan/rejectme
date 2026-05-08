// components/upload/CVUploadBox.tsx

"use client";

import { Upload, FileText, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CVUploadBoxProps {
  isLoading?: boolean;
  error?: string;
  fileName?: string;
  onFileSelected: (file: File) => void | Promise<void>;
}

export function CVUploadBox({
  isLoading = false,
  error,
  fileName,
  onFileSelected,
}: CVUploadBoxProps) {
  return (
    <div className="space-y-3">
      <label
        htmlFor="cv-upload"
        className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 px-6 py-8 text-center transition hover:border-purple-400/70 hover:bg-purple-500/5"
      >
        <div className="mb-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-zinc-300 transition group-hover:border-purple-400/60 group-hover:text-purple-200">
          {fileName ? <FileText className="h-7 w-7" /> : <Upload className="h-7 w-7" />}
        </div>

        <div className="space-y-1">
          <p className="font-medium text-zinc-100">
            {isLoading
              ? "Membaca PDF..."
              : fileName
                ? fileName
                : "Upload CV PDF"}
          </p>

          <p className="text-sm text-zinc-500">
            PDF akan dibaca di browser. Kamu juga bisa paste manual di editor.
          </p>
        </div>

        <Input
          id="cv-upload"
          type="file"
          accept="application/pdf"
          disabled={isLoading}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void onFileSelected(file);
            }
          }}
        />
      </label>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}
    </div>
  );
}