"use client";

import { useState } from "react";
import {
  BriefcaseBusiness,
  FileText,
  History,
  MessageSquareWarning,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRoundCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CVInputEditor } from "@/components/cv-editor/CVInputEditor";
import {
  DiffOverlay,
  type FixResult,
} from "@/components/cv-editor/DiffOverlay";
import { LoginButton } from "@/components/auth/LoginButton";
import { SessionHistory } from "@/components/history/SessionHistory";
import { CritiqueList } from "@/components/roast/CritiqueList";
import { PersonaPicker } from "@/components/roast/PersonaPicker";
import { RoastControls } from "@/components/roast/RoastControls";
import { RoastPanel } from "@/components/roast/RoastPanel";
import {
  SurvivalScore,
  type SurvivalScoreData,
} from "@/components/score/SurvivalScore";
import { CVUploadBox } from "@/components/upload/CVUploadBox";
import {
  createRoastSession,
  updateRoastSession,
  type RoastSession,
} from "@/firebase/sessions";
import { getAuthenticatedJsonHeaders } from "@/firebase/auth-headers";
import { useCurrentUser } from "@/firebase/use-current-user";
import type {
  CritiqueItem,
  StructuredRoastResult,
} from "@/lib/critique";
import { parsePdfToText } from "@/lib/pdf-parser";
import type { PersonaId } from "@/lib/personas";

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

  const hasInput = cvText.trim().length >= 50;
  const canStart = hasInput && targetRole.trim().length >= 2 && !!user;

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
      setPdfError("Could not read the PDF. Paste the CV text manually instead.");
    } finally {
      setIsParsingPdf(false);
    }
  }

  async function handleStructuredRoast() {
    setIsStructuringRoast(true);

    try {
      const response = await fetch("/api/structured-roast", {
        method: "POST",
        headers: await getAuthenticatedJsonHeaders(user),
        body: JSON.stringify({
          cvText,
          personaId,
          targetRole,
          targetCompany,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create structured roast.");
      }

      const structuredData = data as StructuredRoastResult;
      setStructuredRoast(structuredData);

      return structuredData;
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create structured roast."
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
        headers: await getAuthenticatedJsonHeaders(user),
        body: JSON.stringify({
          originalBullet: critique.quoted_text,
          critiqueReason: critique.reason,
          personaId,
          targetRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create rewrite.");
      }

      setFixResult(data as FixResult);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create rewrite.");
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
      setError("No original text was available to replace.");
      return;
    }

    if (!cvText.includes(original)) {
      setError(
        "The original text was not found exactly in the CV. Copy the rewrite and paste it manually."
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
        headers: await getAuthenticatedJsonHeaders(user),
        body: JSON.stringify({
          cvText: nextCvText,
          personaId,
          targetRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to calculate score.");
      }

      const scoreData = data as SurvivalScoreData;
      setScore(scoreData);

      return scoreData;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to calculate score.");
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
      setError("CV is too short. Upload a PDF or paste the CV text first.");
      return;
    }

    if (targetRole.trim().length < 2) {
      setError("Target role is required.");
      return;
    }

    if (isAuthLoading) {
      setError("Auth is still loading. Wait a moment and try again.");
      return;
    }

    if (!user) {
      setError("Login with Google before roasting a CV.");
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
        headers: await getAuthenticatedJsonHeaders(user),
        body: JSON.stringify({
          cvText,
          personaId,
          targetRole,
          targetCompany,
        }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to run roast.");
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

      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);

      if (user && sessionId) {
        await updateRoastSession({
          user,
          sessionId,
          status: "failed",
          errorMessage: message,
        }).catch((updateError) => {
          console.error(
            "[handleRoast] Failed to mark session as failed:",
            updateError
          );
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
    <main className="min-h-screen bg-neutral-950 text-neutral-50">
      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#111111_0%,#171717_42%,#10251f_100%)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <Badge
                variant="secondary"
                className="border-white/10 bg-white/10 text-neutral-100"
              >
                GDG JuaraVibeCoding / Live Build
              </Badge>

              <div className="space-y-3">
                <h1 className="text-4xl font-semibold leading-tight tracking-normal text-white md:text-6xl">
                  RejectMe
                </h1>

                <p className="max-w-2xl text-base leading-7 text-neutral-300">
                  Upload CV, pick an HR persona, and turn vague resume feedback
                  into specific fixes you can apply.
                </p>
              </div>
            </div>

            <div className="flex justify-start lg:justify-end">
              <LoginButton />
            </div>
          </header>

          <div className="grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-white/10 bg-white/10 p-2 text-emerald-200">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Input</p>
                <p className="text-xs text-neutral-400">
                  {hasInput ? "CV text ready" : "Upload or paste CV"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-white/10 bg-white/10 p-2 text-cyan-200">
                <BriefcaseBusiness className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Target</p>
                <p className="text-xs text-neutral-400">
                  {targetRole.trim() || "Role required"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-white/10 bg-white/10 p-2 text-amber-200">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Status</p>
                <p className="text-xs text-neutral-400">
                  {canStart ? "Ready to roast" : "Needs CV, role, and login"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <Card className="rounded-lg border-white/10 bg-neutral-900/80 text-neutral-50 shadow-2xl shadow-black/30">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-emerald-200">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>CV Workspace</CardTitle>
                  <p className="mt-1 text-sm text-neutral-400">
                    Upload, clean up, and target the exact role.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-1">
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
                placeholder="Paste your CV text here..."
              />

              <RoastControls
                targetRole={targetRole}
                targetCompany={targetCompany}
                isLoading={isRoasting}
                disabled={!hasInput}
                onTargetRoleChange={setTargetRole}
                onTargetCompanyChange={setTargetCompany}
                onSubmit={handleRoast}
              />
            </CardContent>
          </Card>

          <aside className="space-y-6">
            <Card className="rounded-lg border-white/10 bg-neutral-900/80 text-neutral-50 shadow-2xl shadow-black/30">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-cyan-200">
                    <UserRoundCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>HR Persona</CardTitle>
                    <p className="mt-1 text-sm text-neutral-400">
                      Choose the lens for the critique.
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-1">
                <PersonaPicker
                  value={personaId}
                  onChange={setPersonaId}
                  disabled={isRoasting}
                />

                {error ? (
                  <p className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
                    {error}
                  </p>
                ) : null}

                {currentSessionId ? (
                  <p className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-neutral-400">
                    Session saved: {currentSessionId}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-white/10 bg-neutral-900/80 text-neutral-50 shadow-2xl shadow-black/30">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-amber-200">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Roast History</CardTitle>
                    <p className="mt-1 text-sm text-neutral-400">
                      Reload previous CV reviews.
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-1">
                <SessionHistory
                  user={user}
                  onSelectSession={handleSelectSession}
                />
              </CardContent>
            </Card>
          </aside>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <Card className="rounded-lg border-white/10 bg-neutral-900/80 text-neutral-50 shadow-2xl shadow-black/30">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-orange-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Roast Result</CardTitle>
                  <p className="mt-1 text-sm text-neutral-400">
                    Streaming feedback from {selectedPersonaName}.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-1">
              <RoastPanel
                roast={roast}
                isLoading={isRoasting}
                personaName={selectedPersonaName}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-white/10 bg-neutral-900/80 text-neutral-50 shadow-2xl shadow-black/30">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-lime-200">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Survival Score</CardTitle>
                  <p className="mt-1 text-sm text-neutral-400">
                    ATS, clarity, impact, and role fit.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              <SurvivalScore score={score} isLoading={isScoring} />
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg border-white/10 bg-neutral-900/80 text-neutral-50 shadow-2xl shadow-black/30">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-red-200">
                <MessageSquareWarning className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Critique Items</CardTitle>
                <p className="mt-1 text-sm text-neutral-400">
                  Specific problems and rewrite actions.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-1">
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
