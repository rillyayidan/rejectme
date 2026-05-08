// lib/critique.ts
// Shared types untuk hasil analisis CV yang structured.
// Dipakai oleh API, frontend CritiqueItem, dan fitur Fix This.

import type { PersonaId } from "@/lib/personas";

export type CritiqueSeverity = "low" | "medium" | "high" | "fatal";

export type CritiqueCategory =
  | "ats_readability"
  | "role_match"
  | "recruiter_clarity"
  | "impact_proof"
  | "red_flag"
  | "formatting"
  | "language"
  | "missing_info";

export interface CritiqueItem {
  id: string;
  category: CritiqueCategory;
  severity: CritiqueSeverity;

  /**
   * Bagian spesifik dari CV yang dikritik.
   * Contoh: "Bertanggung jawab mengelola media sosial"
   */
  quoted_text: string;

  /**
   * Kritik utama yang ditampilkan ke user.
   */
  issue: string;

  /**
   * Kenapa ini masalah menurut persona tertentu.
   */
  reason: string;

  /**
   * Saran praktis untuk memperbaiki bagian ini.
   */
  suggestion: string;

  /**
   * Apakah item ini cocok untuk tombol Fix This.
   * Contoh: typo/bullet lemah = true.
   * Missing foto/IPK = false karena tidak bisa di-fix AI langsung.
   */
  fixable: boolean;
}

export interface StructuredRoastResult {
  personaId: PersonaId;
  targetRole: string;
  targetCompany?: string;

  overall_impression: string;
  verdict: string;

  critiques: CritiqueItem[];

  strengths: string[];
  quick_wins: string[];

  survival_score_hint: {
    estimated_total: number;
    weakest_dimension: CritiqueCategory;
    strongest_dimension: CritiqueCategory;
  };
}