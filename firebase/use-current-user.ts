// firebase/use-current-user.ts

"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/firebase/config";
import { syncUserProfile } from "@/firebase/users";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        try {
          await syncUserProfile(currentUser);
        } catch (error) {
          console.error("[useCurrentUser] Failed to sync profile:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    isAuthLoading,
    isLoggedIn: Boolean(user),
  };
}