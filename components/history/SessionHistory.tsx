"use client";

import { useEffect, useState } from "react";
import { Clock, FileText, Loader2 } from "lucide-react";
import type { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  subscribeToRoastSessions,
  type RoastSession,
} from "@/firebase/sessions";

interface SessionHistoryProps {
  user: User | null;
  onSelectSession: (session: RoastSession) => void;
}

function formatDate(session: RoastSession) {
  const date = session.createdAt?.toDate?.();

  if (!date) {
    return "Just now";
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
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }

  if (status === "failed") {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  return "border-white/10 bg-white/5 text-neutral-300";
}

export function SessionHistory({ user, onSelectSession }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<RoastSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    queueMicrotask(() => {
      setIsLoading(true);
    });

    const unsubscribe = subscribeToRoastSessions(user, (nextSessions) => {
      setSessions(nextSessions);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/25 p-5 text-sm text-neutral-400">
        Login to view previous roasts.
      </div>
    );
  }

  if (user && isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 p-5 text-sm text-neutral-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading history...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/25 p-5 text-sm text-neutral-400">
        No history yet. Your first roast will appear here.
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
          className="w-full rounded-lg border border-white/10 bg-black/25 p-4 text-left transition hover:border-emerald-300/40 hover:bg-emerald-500/5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-neutral-500" />
                <p className="truncate font-medium text-neutral-100">
                  {session.targetRole || "Untitled role"}
                </p>
              </div>

              <p className="mt-1 truncate text-sm text-neutral-500">
                {session.targetCompany || "No company"} / {session.personaId}
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

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-neutral-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(session)}
            </div>

            {session.score ? (
              <span className="font-medium text-neutral-300">
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
