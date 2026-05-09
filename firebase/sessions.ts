// firebase/sessions.ts

import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import type { PersonaId } from "@/lib/personas";
import type { SurvivalScoreData } from "@/components/score/SurvivalScore";
import { db } from "@/firebase/config";

interface CreateRoastSessionInput {
  user: User;
  cvText: string;
  personaId: PersonaId;
  targetRole: string;
  targetCompany?: string;
}

interface UpdateRoastSessionInput {
  user: User;
  sessionId: string;
  roast?: string;
  score?: SurvivalScoreData | null;
  status?: "draft" | "roasting" | "completed" | "failed";
  errorMessage?: string;
}

export async function createRoastSession({
  user,
  cvText,
  personaId,
  targetRole,
  targetCompany,
}: CreateRoastSessionInput) {
  const sessionsRef = collection(db, "users", user.uid, "sessions");

  const docRef = await addDoc(sessionsRef, {
    cvText,
    personaId,
    targetRole,
    targetCompany: targetCompany ?? "",
    roast: "",
    score: null,
    status: "roasting",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateRoastSession({
  user,
  sessionId,
  roast,
  score,
  status,
  errorMessage,
}: UpdateRoastSessionInput) {
  const sessionRef = doc(db, "users", user.uid, "sessions", sessionId);

  await updateDoc(sessionRef, {
    ...(roast !== undefined ? { roast } : {}),
    ...(score !== undefined ? { score } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(errorMessage !== undefined ? { errorMessage } : {}),
    updatedAt: serverTimestamp(),
  });
}