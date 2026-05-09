// components/score/SurvivalScore.tsx

"use client";

import {
  Loader2,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ScoreTier {
  label: string;
  emoji: string;
  color: string;
  message: string;
}

export interface SurvivalScoreData {
  total: number;
  breakdown: {
    ats_readability: number;
    role_match: number;
    recruiter_clarity: number;
    impact_proof: number;
    red_flag_penalty: number;
  };
  verdict: string;
  top_issues?: string[];
  quick_wins?: string[];
  tier: ScoreTier;
}

interface SurvivalScoreProps {
  score: SurvivalScoreData | null;
  isLoading?: boolean;
}

const BREAKDOWN_LABELS: Record<keyof SurvivalScoreData["breakdown"], string> = {
  ats_readability: "ATS Readability",
  role_match: "Role Match",
  recruiter_clarity: "Recruiter Clarity",
  impact_proof: "Impact Proof",
  red_flag_penalty: "No Red Flags",
};

const DEFAULT_BREAKDOWN: SurvivalScoreData["breakdown"] = {
  ats_readability: 0,
  role_match: 0,
  recruiter_clarity: 0,
  impact_proof: 0,
  red_flag_penalty: 0,
};

const DEFAULT_TIER: ScoreTier = {
  label: "Unknown",
  emoji: "🧪",
  color: "zinc",
  message: "Score berhasil dibuat, tapi beberapa detail belum tersedia.",
};

function getScoreIcon(score: number) {
  if (score >= 85) return <Trophy className="h-6 w-6" />;
  if (score >= 70) return <CheckCircle2 className="h-6 w-6" />;
  if (score >= 50) return <AlertTriangle className="h-6 w-6" />;
  return <XCircle className="h-6 w-6" />;
}

function getScoreTone(score: number) {
  if (score >= 85) return "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
  if (score >= 70) return "border-green-400/40 bg-green-500/10 text-green-100";
  if (score >= 50) return "border-yellow-400/40 bg-yellow-500/10 text-yellow-100";
  if (score >= 30) return "border-orange-400/40 bg-orange-500/10 text-orange-100";
  return "border-red-400/40 bg-red-500/10 text-red-100";
}

function clampScore(value: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeScore(score: SurvivalScoreData) {
  const breakdown = {
    ...DEFAULT_BREAKDOWN,
    ...(score.breakdown ?? {}),
  };

  return {
    total: clampScore(score.total),
    breakdown,
    verdict: score.verdict || "Belum ada verdict.",
    topIssues: Array.isArray(score.top_issues) ? score.top_issues : [],
    quickWins: Array.isArray(score.quick_wins) ? score.quick_wins : [],
    tier: score.tier ?? DEFAULT_TIER,
  };
}

export function SurvivalScore({ score, isLoading = false }: SurvivalScoreProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-black/40 p-6 text-center">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-purple-200" />
        <p className="font-medium text-zinc-100">Menghitung Survival Score...</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
          AI sedang mengecek ATS, role match, clarity, impact proof, dan red flags.
        </p>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-black/40 p-6 text-center">
        <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-500">
          <Trophy className="h-8 w-8" />
        </div>
        <p className="font-medium text-zinc-300">Belum ada score.</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
          Survival Score akan muncul setelah CV selesai di-roast.
        </p>
      </div>
    );
  }

  const normalized = normalizeScore(score);
  const tone = getScoreTone(normalized.total);

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-5 ${tone}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium opacity-80">Survival Score</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-6xl font-bold tracking-tight">
                {normalized.total}
              </span>
              <span className="pb-2 text-lg font-semibold opacity-70">/100</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
            {getScoreIcon(normalized.total)}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-lg font-semibold">
            {normalized.tier.emoji} {normalized.tier.label}
          </p>
          <p className="mt-1 text-sm leading-6 opacity-80">
            {normalized.tier.message}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
        <p className="mb-3 text-sm font-semibold text-zinc-100">Breakdown</p>

        <div className="space-y-3">
          {Object.entries(normalized.breakdown).map(([key, rawValue]) => {
            const value = clampScore(rawValue);
            const label =
              BREAKDOWN_LABELS[key as keyof SurvivalScoreData["breakdown"]] ??
              key;

            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">{label}</span>
                  <span className="font-medium text-zinc-100">{value}/100</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-zinc-200 transition-all"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
        <p className="text-sm font-semibold text-zinc-100">Verdict</p>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {normalized.verdict}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-semibold text-red-100">Top Issues</p>

          {normalized.topIssues.length > 0 ? (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-red-100/75">
              {normalized.topIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-red-100/60">
              Tidak ada top issues yang dikirim oleh AI.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-sm font-semibold text-emerald-100">Quick Wins</p>

          {normalized.quickWins.length > 0 ? (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-emerald-100/75">
              {normalized.quickWins.map((win) => (
                <li key={win}>{win}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-emerald-100/60">
              Tidak ada quick wins yang dikirim oleh AI.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}