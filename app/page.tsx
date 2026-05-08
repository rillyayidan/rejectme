// app/page.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parsePdfToText } from "@/lib/pdf-parser";
import type { PersonaId } from "@/lib/personas";
import { CVUploadBox } from "@/components/upload/CVUploadBox";
import { PersonaPicker } from "@/components/roast/PersonaPicker";
import { RoastPanel } from "@/components/roast/RoastPanel";

type ScoreResponse = {
  total: number;
  breakdown: {
    ats_readability: number;
    role_match: number;
    recruiter_clarity: number;
    impact_proof: number;
    red_flag_penalty: number;
  };
  verdict: string;
  top_issues: string[];
  quick_wins: string[];
  tier: {
    label: string;
    emoji: string;
    color: string;
    message: string;
  };
};

export default function HomePage() {
  const [cvText, setCvText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [personaId, setPersonaId] = useState<PersonaId>("startup");

  const [roast, setRoast] = useState("");
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [isRoasting, setIsRoasting] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState("");

  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  
  const selectedPersonaName =
  personaId === "bumn"
    ? "Pak Hendra"
    : personaId === "corporate"
      ? "Bu Diana"
      : "Kak Rara";

  async function handlePdfUpload(file: File) {
    setError("");
    setPdfError("");
    setUploadedFileName(file.name);
    setIsParsingPdf(true);

    try {
      const text = await parsePdfToText(file);
      setCvText(text);
    } catch (err) {
      console.error(err);
      setPdfError("Gagal membaca PDF. Coba paste isi CV secara manual.");
    } finally {
      setIsParsingPdf(false);
    }
  }

  async function handleRoast() {
    setError("");
    setRoast("");
    setScore(null);

    if (cvText.trim().length < 50) {
      setError("CV terlalu pendek. Upload PDF atau paste isi CV dulu.");
      return;
    }

    if (targetRole.trim().length < 2) {
      setError("Target role wajib diisi.");
      return;
    }

    setIsRoasting(true);

    try {
      const response = await fetch("/api/roast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cvText,
          personaId,
          targetRole,
          targetCompany,
        }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Gagal menjalankan roast.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setRoast((prev) => prev + chunk);
      }

      await handleScore();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Terjadi error.");
    } finally {
      setIsRoasting(false);
    }
  }

  async function handleScore() {
    setIsScoring(true);

    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cvText,
          personaId,
          targetRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menghitung score.");
      }

      setScore(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal menghitung score.");
    } finally {
      setIsScoring(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8">
        <div className="space-y-3">
          <Badge variant="secondary">GDG JuaraVibeCoding MVP</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            RejectMe
          </h1>
          <p className="max-w-2xl text-zinc-400">
            Upload CV, pilih persona HRD, lalu biarkan AI me-roast CV kamu
            sebelum HRD asli melakukannya.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-zinc-800 bg-zinc-900 text-zinc-50">
            <CardHeader>
              <CardTitle>1. CV Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CVUploadBox
                isLoading={isParsingPdf}
                error={pdfError}
                fileName={uploadedFileName}
                onFileSelected={handlePdfUpload}
              />

              <Textarea
                value={cvText}
                onChange={(event) => setCvText(event.target.value)}
                placeholder="Atau paste isi CV kamu di sini..."
                className="min-h-[280px] border-zinc-700 bg-zinc-950"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={targetRole}
                  onChange={(event) => setTargetRole(event.target.value)}
                  placeholder="Target role, contoh: Frontend Developer"
                  className="border-zinc-700 bg-zinc-950"
                />
                <Input
                  value={targetCompany}
                  onChange={(event) => setTargetCompany(event.target.value)}
                  placeholder="Target company, optional"
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 text-zinc-50">
            <CardHeader>
              <CardTitle>2. Pilih Persona HRD</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PersonaPicker
                value={personaId}
                onChange={setPersonaId}
                disabled={isRoasting}
              />
              <Button
                onClick={handleRoast}
                disabled={isRoasting}
                className="w-full"
                size="lg"
              >
                {isRoasting ? "HRD sedang membaca CV..." : "Roast My CV"}
              </Button>

              {error && (
                <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-zinc-800 bg-zinc-900 text-zinc-50">
            <CardHeader>
              <CardTitle>3. Roast Result</CardTitle>
            </CardHeader>
            <CardContent>
              <RoastPanel
                roast={roast}
                isLoading={isRoasting}
                personaName={selectedPersonaName}
              />
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 text-zinc-50">
            <CardHeader>
              <CardTitle>4. Survival Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isScoring && <p className="text-zinc-400">Menghitung score...</p>}

              {score ? (
                <>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                    <div className="text-5xl font-bold">
                      {score.tier.emoji} {score.total}
                    </div>
                    <div className="mt-2 text-lg font-semibold">
                      {score.tier.label}
                    </div>
                    <p className="mt-2 text-sm text-zinc-400">
                      {score.tier.message}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    {Object.entries(score.breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-zinc-400">{key}</span>
                        <span className="font-semibold">{value}/100</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-semibold">Top Issues</h4>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
                      {score.top_issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold">Quick Wins</h4>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
                      {score.quick_wins.map((win) => (
                        <li key={win}>{win}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-sm text-zinc-400">
                  Score akan muncul setelah roast selesai.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}