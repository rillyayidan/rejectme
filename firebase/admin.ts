// firebase/admin.ts

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type AppOptions,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getProjectId() {
  return (
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GOOGLE_CLOUD_PROJECT
  );
}

function getFirebaseAdminOptions(): AppOptions {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  const baseOptions: AppOptions = {
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  };

  if (privateKey || clientEmail) {
    if (!privateKey || !clientEmail) {
      throw new Error(
        "FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL must both be set for key-based Firebase Admin credentials."
      );
    }

    return {
      ...baseOptions,
      credential: cert({
        projectId: getProjectId(),
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    };
  }

  return {
    ...baseOptions,
    credential: applicationDefault(),
    projectId: getProjectId(),
  };
}

export const adminApp =
  getApps().length === 0
    ? initializeApp(getFirebaseAdminOptions())
    : getApps()[0];

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
