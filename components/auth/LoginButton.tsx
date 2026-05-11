// components/auth/LoginButton.tsx

"use client";

import { LogIn, LogOut, Loader2 } from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/firebase/config";
import { useCurrentUser } from "@/firebase/use-current-user";
import { Button } from "@/components/ui/button";

export function LoginButton() {
  const { user, isAuthLoading } = useCurrentUser();

  async function handleSignIn() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("[LoginButton] Sign in error:", error);
      alert("Could not sign in with Google. Try again.");
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("[LoginButton] Sign out error:", error);
      alert("Could not sign out. Try again.");
    }
  }

  if (isAuthLoading) {
    return (
      <Button variant="secondary" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking auth...
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
          <p className="font-medium text-neutral-100">
            {user.displayName ?? "Logged in"}
          </p>
          <p className="text-xs text-neutral-400">{user.email}</p>
        </div>

        <Button type="button" variant="secondary" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={handleSignIn}
      className="bg-emerald-300 text-neutral-950 hover:bg-emerald-200"
    >
      <LogIn className="mr-2 h-4 w-4" />
      Login with Google
    </Button>
  );
}
