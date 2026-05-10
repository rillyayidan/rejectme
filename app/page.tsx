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
  type RoastSession,
} from "@/firebase/sessions";
import { SessionHistory } from "@/components/history/SessionHistory";
import { CritiqueList } from "@/components/roast/CritiqueList";
import type {
  CritiqueItem,
  StructuredRoastResult,
} from "@/lib/critique";
import {
  DiffOverlay,
  type FixResult,
} from "@/components/cv-editor/DiffOverlay";

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

  const { user, isAuthLoading } = useCurrentUser();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const [structuredRoast, setStructuredRoast] =
    useState<StructuredRoastResult | null>(null);
  const [isStructuringRoast, setIsStructuringRoast] = useState(false);

  const [selectedCritique, setSelectedCritique] =
    useState<CritiqueItem | null>(null);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const [isFixing, setIsFixing] = useState(false);

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

  async function handleStructuredRoast() {
    setIsStructuringRoast(true);

    try {
      const response = await fetch("/api/structured-roast", {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal membuat structured roast.");
      }

      const structuredData = data as StructuredRoastResult;
      setStructuredRoast(structuredData);

      return structuredData;
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal membuat structured roast."
      );
      return null;
    } finally {
      setIsStructuringRoast(false);
    }
  }

  async function handleFixCritique(critique: CritiqueItem) {
    setError("");
    setSelectedCritique(critique);
    setFixResult(null);
    setIsFixing(true);

    try {
      const response = await fetch("/api/fix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalBullet: critique.quoted_text,
          critiqueReason: critique.reason,
          personaId,
          targetRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal membuat rewrite.");
      }

      setFixResult(data as FixResult);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal membuat rewrite.");
    } finally {
      setIsFixing(false);
    }
  }

  async function handleApplyFix(replacement: string) {
    if (!selectedCritique) {
      return;
    }

    const original = selectedCritique.quoted_text;

    if (!original.trim()) {
      setError("Tidak ada text original untuk diganti.");
      return;
    }

    if (!cvText.includes(original)) {
      setError(
        "Text original tidak ditemukan persis di CV. Coba copy rewrite dan paste manual."
      );
      return;
    }

    const updatedCV = cvText.replace(original, replacement);

    let updatedStructuredRoast: StructuredRoastResult | null = null;

    setStructuredRoast((prev) => {
      if (!prev || !selectedCritique) {
        return prev;
      }

      updatedStructuredRoast = {
        ...prev,
        critiques: prev.critiques.filter(
          (critique) => critique.id !== selectedCritique.id
        ),
        quick_wins: [
          ...(prev.quick_wins ?? []),
          `Fixed: ${selectedCritique.issue}`,
        ],
      };

      return updatedStructuredRoast;
    });

    setCvText(updatedCV);
    setSelectedCritique(null);
    setFixResult(null);
    setError("");

    const nextScore = await handleScoreWithText(updatedCV);

    if (user && currentSessionId) {
      await updateRoastSession({
        user,
        sessionId: currentSessionId,
        cvText: updatedCV,
        score: nextScore,
        structuredRoast: updatedStructuredRoast,
        status: "completed",
      }).catch((error) => {
        console.error("[handleApplyFix] Failed to update session:", error);
      });
    }
  }

  async function handleScoreWithText(nextCvText: string) {
    setIsScoring(true);

    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cvText: nextCvText,
          personaId,
          targetRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menghitung score.");
      }

      const scoreData = data as SurvivalScoreData;
      setScore(scoreData);

      return scoreData;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal menghitung score.");
      return null;
    } finally {
      setIsScoring(false);
    }
  }

  async function handleRoast() {
    setError("");
    setRoast("");
    setScore(null);
    setCurrentSessionId(null);
    setStructuredRoast(null);

    if (cvText.trim().length < 50) {
      setError("CV terlalu pendek. Upload PDF atau paste isi CV dulu.");
      return;
    }

    if (targetRole.trim().length < 2) {
      setError("Target role wajib diisi.");
      return;
    }

    if (isAuthLoading) {
      setError("Auth masih loading. Tunggu sebentar lalu coba lagi.");
      return;
    }

    if (!user) {
      setError("Login dengan Google dulu sebelum roast CV.");
      return;
    }

    setIsRoasting(true);

    let sessionId: string | null = null;
    let fullRoast = "";

    try {
      sessionId = await createRoastSession({
        user,
        cvText,
        personaId,
        targetRole: targetRole.trim(),
        targetCompany: targetCompany.trim(),
      });

      setCurrentSessionId(sessionId);

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
        fullRoast += chunk;
        setRoast((prev) => prev + chunk);
      }

      const finalScore = await handleScore();

      // Kasih jeda kecil supaya Vertex AI tidak kena burst request.
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const finalStructuredRoast = await handleStructuredRoast();

      await updateRoastSession({
        user,
        sessionId,
        roast: fullRoast,
        score: finalScore,
        structuredRoast: finalStructuredRoast,
        status: "completed",
      });
    } catch (err) {
      console.error(err);

      const message = err instanceof Error ? err.message : "Terjadi error.";
      setError(message);

      if (user && sessionId) {
        await updateRoastSession({
          user,
          sessionId,
          status: "failed",
          errorMessage: message,
        }).catch((updateError) => {
          console.error("[handleRoast] Failed to mark session as failed:", updateError);
        });
      }
    } finally {
      setIsRoasting(false);
    }
  }

  async function handleScore() {
    return handleScoreWithText(cvText);
  }

  function handleSelectSession(session: RoastSession) {
    setCurrentSessionId(session.id);
    setCvText(session.cvText);
    setPersonaId(session.personaId);
    setTargetRole(session.targetRole);
    setTargetCompany(session.targetCompany ?? "");
    setRoast(session.roast ?? "");
    setScore(session.score ?? null);
    setStructuredRoast(session.structuredRoast ?? null);
    setError("");
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

              {currentSessionId ? (
                <p className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-xs text-zinc-400">
                  Session saved: {currentSessionId}
                </p>
              ) : null}

              <div className="border-t border-zinc-800 pt-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-zinc-100">Roast History</h3>
                  <p className="text-sm text-zinc-500">
                    Klik session lama untuk load hasil sebelumnya.
                  </p>
                </div>

                <SessionHistory user={user} onSelectSession={handleSelectSession} />
              </div>
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

        <Card className="border-zinc-800 bg-zinc-900 text-zinc-50">
          <CardHeader>
            <CardTitle>5. Critique Items</CardTitle>
          </CardHeader>

          <CardContent>
            <CritiqueList
              structuredRoast={structuredRoast}
              isLoading={isStructuringRoast}
              onFix={handleFixCritique}
            />

            {selectedCritique ? (
              <div className="mt-4">
                <DiffOverlay
                  originalText={selectedCritique.quoted_text}
                  critiqueReason={selectedCritique.reason}
                  result={fixResult}
                  isLoading={isFixing}
                  onApply={handleApplyFix}
                  onClose={() => {
                    setSelectedCritique(null);
                    setFixResult(null);
                    setIsFixing(false);
                  }}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}