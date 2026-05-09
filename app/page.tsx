// app/page.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parsePdfToText } from "@/lib/pdf-parser";
import type { PersonaId } from "@/lib/personas";
import { CVUploadBox } from "@/components/upload/CVUploadBox";
import { PersonaPicker } from "@/components/roast/PersonaPicker";
import { RoastPanel } from "@/components/roast/RoastPanel";
import {
  SurvivalScore,
  type SurvivalScoreData,
} from "@/components/score/SurvivalScore";
import { CVInputEditor } from "@/components/cv-editor/CVInputEditor";
import { RoastControls } from "@/components/roast/RoastControls";
import { LoginButton } from "@/components/auth/LoginButton";
import { useCurrentUser } from "@/firebase/use-current-user";
import {
  createRoastSession,
  updateRoastSession,
} from "@/firebase/sessions";

export default function HomePage() {
  const [cvText, setCvText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [personaId, setPersonaId] = useState<PersonaId>("startup");

  const [roast, setRoast] = useState("");
  const [score, setScore] = useState<SurvivalScoreData | null>(null);

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

        if (done) {
          break;
        }

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
        <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary">GDG JuaraVibeCoding · Live Build</Badge>

            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              RejectMe
            </h1>

            <p className="max-w-2xl text-zinc-400">
              Upload CV, pilih persona HRD, lalu biarkan AI me-roast CV kamu
              sebelum HRD asli melakukannya.
            </p>
          </div>

          <div className="flex justify-start md:justify-end">
            <LoginButton />
          </div>
        </header>

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

              <CVInputEditor
                value={cvText}
                onChange={setCvText}
                disabled={isRoasting}
                placeholder="Atau paste isi CV kamu di sini..."
              />

              <RoastControls
                targetRole={targetRole}
                targetCompany={targetCompany}
                isLoading={isRoasting}
                disabled={cvText.trim().length < 50}
                onTargetRoleChange={setTargetRole}
                onTargetCompanyChange={setTargetCompany}
                onSubmit={handleRoast}
              />
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

              {error ? (
                <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </p>
              ) : null}
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
              <SurvivalScore score={score} isLoading={isScoring} />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}