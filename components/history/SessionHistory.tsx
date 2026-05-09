// components/history/SessionHistory.tsx

"use client";

import { useEffect, useState } from "react";
import { Clock, FileText, Loader2 } from "lucide-react";
import type { User } from "firebase/auth";
import {
  subscribeToRoastSessions,
  type RoastSession,
} from "@/firebase/sessions";
import { Button } from "@/components/ui/button";

interface SessionHistoryProps {
  user: User | null;
  onSelectSession: (session: RoastSession) => void;
}

function formatDate(session: RoastSession) {
  const date = session.createdAt?.toDate?.();

  if (!date) {
    return "Baru saja";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status: RoastSession["status"]) {
  if (status === "completed") return "Completed";
  if (status === "roasting") return "Roasting";
  if (status === "failed") return "Failed";
  return "Draft";
}

function getStatusClass(status: RoastSession["status"]) {
  if (status === "completed") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "roasting") {
    return "border-purple-500/30 bg-purple-500/10 text-purple-200";
  }

  if (status === "failed") {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  return "border-zinc-700 bg-zinc-900 text-zinc-300";
}

export function SessionHistory({ user, onSelectSession }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<RoastSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeToRoastSessions(user, (nextSessions) => {
      setSessions(nextSessions);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-5 text-sm text-zinc-400">
        Login untuk melihat history roast kamu.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-black/30 p-5 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading history...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-5 text-sm text-zinc-400">
        Belum ada history. Roast CV pertama kamu akan muncul di sini.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <button
          key={session.id}
          type="button"
          onClick={() => onSelectSession(session)}
          className="w-full rounded-2xl border border-zinc-800 bg-black/30 p-4 text-left transition hover:border-purple-500/50 hover:bg-purple-500/5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
                <p className="truncate font-medium text-zinc-100">
                  {session.targetRole || "Untitled role"}
                </p>
              </div>

              <p className="mt-1 truncate text-sm text-zinc-500">
                {session.targetCompany || "No company"} · {session.personaId}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                session.status
              )}`}
            >
              {getStatusLabel(session.status)}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(session)}
            </div>

            {session.score ? (
              <span className="font-medium text-zinc-300">
                Score {session.score.total}/100
              </span>
            ) : null}
          </div>

          {session.errorMessage ? (
            <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-200">
              {session.errorMessage}
            </p>
          ) : null}
        </button>
      ))}

      <Button type="button" variant="secondary" disabled className="w-full">
        Showing latest {sessions.length} sessions
      </Button>
    </div>
  );
}