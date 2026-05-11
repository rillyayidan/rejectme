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
        className="group flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-black/25 px-6 py-7 text-center transition hover:border-emerald-300/70 hover:bg-emerald-500/5"
      >
        <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3 text-neutral-300 transition group-hover:border-emerald-300/50 group-hover:text-emerald-100">
          {fileName ? <FileText className="h-7 w-7" /> : <Upload className="h-7 w-7" />}
        </div>

        <div className="space-y-1">
          <p className="font-medium text-neutral-100">
            {isLoading
              ? "Reading PDF..."
              : fileName
                ? fileName
                : "Upload CV PDF"}
          </p>

          <p className="text-sm text-neutral-500">
            PDF is parsed in the browser. You can also paste text below.
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
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}
    </div>
  );
}
