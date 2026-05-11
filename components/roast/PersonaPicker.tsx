// components/roast/PersonaPicker.tsx

"use client";

import { CheckCircle2 } from "lucide-react";
import type { PersonaId } from "@/lib/personas";

interface PersonaOption {
  id: PersonaId;
  name: string;
  label: string;
  description: string;
  accent: string;
}

const PERSONA_OPTIONS: PersonaOption[] = [
  {
    id: "bumn",
    name: "Pak Hendra",
    label: "BUMN Mode",
    description:
      "Formal, administratif, sangat peduli kelengkapan, IPK, struktur CV, dan stabilitas karier.",
    accent: "border-cyan-300/45 bg-cyan-500/10",
  },
  {
    id: "startup",
    name: "Kak Rara",
    label: "Startup Mode",
    description:
      "Direct, cepat, fokus pada impact, metric, ownership, portfolio, dan bukti pernah ship sesuatu.",
    accent: "border-amber-300/45 bg-amber-500/10",
  },
  {
    id: "corporate",
    name: "Bu Diana",
    label: "Corporate Mode",
    description:
      "Profesional, sistematis, fokus ATS, konsistensi format, role match, dan bahasa yang rapi.",
    accent: "border-emerald-300/45 bg-emerald-500/10",
  },
];

interface PersonaPickerProps {
  value: PersonaId;
  onChange: (personaId: PersonaId) => void;
  disabled?: boolean;
}

export function PersonaPicker({
  value,
  onChange,
  disabled = false,
}: PersonaPickerProps) {
  return (
    <div className="grid gap-3">
      {PERSONA_OPTIONS.map((persona) => {
        const isSelected = value === persona.id;

        return (
          <button
            key={persona.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(persona.id)}
            className={[
              "group relative overflow-hidden rounded-lg border p-4 text-left transition",
              "disabled:cursor-not-allowed disabled:opacity-60",
              isSelected
                ? persona.accent
                : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/5",
            ].join(" ")}
          >
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-neutral-50">
                    {persona.name}
                  </h3>

                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-neutral-300">
                    {persona.label}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  {persona.description}
                </p>
              </div>

              {isSelected ? (
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-200" />
              ) : (
                <div className="mt-1 h-5 w-5 shrink-0 rounded-full border border-white/20" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
