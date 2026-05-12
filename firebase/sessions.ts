// firebase/sessions.ts

import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import type { PersonaId } from "@/lib/personas";
import type { SurvivalScoreData } from "@/components/score/SurvivalScore";
import { db } from "@/firebase/config";
import type { StructuredRoastResult } from "@/lib/critique";

interface CreateRoastSessionInput {
  user: User;
  cvText: string;
  personaId: PersonaId;
  targetRole: string;
  targetCompany?: string;
  jobDescription?: string;
}

interface UpdateRoastSessionInput {
  user: User;
  sessionId: string;
  cvText?: string;
  roast?: string;
  score?: SurvivalScoreData | null;
  structuredRoast?: StructuredRoastResult | null;
  jobDescription?: string;
  fixedCritiqueIds?: string[];
  status?: "draft" | "roasting" | "completed" | "failed";
  errorMessage?: string;
}

export async function createRoastSession({
  user,
  cvText,
  personaId,
  targetRole,
  targetCompany,
  jobDescription,
}: CreateRoastSessionInput) {
  const sessionsRef = collection(db, "users", user.uid, "sessions");

  const docRef = await addDoc(sessionsRef, {
    cvText,
    personaId,
    targetRole,
    targetCompany: targetCompany ?? "",
    jobDescription: jobDescription ?? "",
    roast: "",
    score: null,
    structuredRoast: null,
    fixedCritiqueIds: [],
    status: "roasting",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateRoastSession({
  user,
  sessionId,
  cvText,
  roast,
  score,
  structuredRoast,
  jobDescription,
  fixedCritiqueIds,
  status,
  errorMessage,
}: UpdateRoastSessionInput) {
  const sessionRef = doc(db, "users", user.uid, "sessions", sessionId);

  await updateDoc(sessionRef, {
    ...(cvText !== undefined ? { cvText } : {}),
    ...(roast !== undefined ? { roast } : {}),
    ...(score !== undefined ? { score } : {}),
    ...(structuredRoast !== undefined ? { structuredRoast } : {}),
    ...(jobDescription !== undefined ? { jobDescription } : {}),
    ...(fixedCritiqueIds !== undefined ? { fixedCritiqueIds } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(errorMessage !== undefined ? { errorMessage } : {}),
    updatedAt: serverTimestamp(),
  });
}

export interface RoastSession {
  id: string;
  cvText: string;
  personaId: PersonaId;
  targetRole: string;
  targetCompany: string;
  jobDescription: string;
  roast: string;
  score: SurvivalScoreData | null;
  structuredRoast: StructuredRoastResult | null;
  fixedCritiqueIds: string[];
  status: "draft" | "roasting" | "completed" | "failed";
  errorMessage?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export function subscribeToRoastSessions(
  user: User,
  callback: (sessions: RoastSession[]) => void
) {
  const sessionsRef = collection(db, "users", user.uid, "sessions");

  const sessionsQuery = query(
    sessionsRef,
    orderBy("createdAt", "desc"),
    limit(10)
  );

  return onSnapshot(sessionsQuery, (snapshot) => {
    const sessions = snapshot.docs.map((document) => {
      const data = document.data();

      return {
        id: document.id,
        cvText: data.cvText ?? "",
        personaId: data.personaId ?? "startup",
        targetRole: data.targetRole ?? "",
        targetCompany: data.targetCompany ?? "",
        jobDescription: data.jobDescription ?? "",
        roast: data.roast ?? "",
        score: data.score ?? null,
        structuredRoast: data.structuredRoast ?? null,
        fixedCritiqueIds: Array.isArray(data.fixedCritiqueIds)
          ? data.fixedCritiqueIds
          : [],
        status: data.status ?? "draft",
        errorMessage: data.errorMessage,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as RoastSession;
    });

    callback(sessions);
  });
}
