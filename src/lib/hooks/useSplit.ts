/**
 * lib/hooks/useSplit.ts
 */

import { useState, useEffect, useCallback } from "react";
import {
  getSplits,
  getSplit,
  createSplit,
  updateSplit,
  deleteSplit,
  addRecipient,
  updateRecipient,
  removeRecipient,
  getMyEarnings,
  type Split,
  type SplitEarnings,
  type CreateSplitPayload,
  type UpdateSplitPayload,
  type AddRecipientPayload,
} from "../api/splitr";
import { useToast } from "@/components/ui/Toast";

/* ─── Unwrap helper ───────────────────────────────────────────── */
function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (obj.data && typeof obj.data === "object") {
      const inner = obj.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) return inner.data as T[];
    }
  }
  return [];
}

/* ─── Normalised split shape for the page ─────────────────────── */
export interface NormalisedSplit {
  id: string;
  trackTitle: string;
  trackCover: string;
  pendingCount: number;
  isLocked: boolean;
  collaborators: Array<{
    name: string;
    email: string;
    role: string;
    split: number;
    color: string;
    isYou: boolean;
    status: string;
    recipientId: number;
  }>;
  totalEarnings: number;
  musicUploadId: number;
  splitName: string;
}

const COLLAB_COLORS = ["#C30100", "#f59e0b", "#3b82f6", "#22c55e", "#a855f7", "#ec4899"];

function normaliseSplit(s: Split, userEmail?: string): NormalisedSplit {
  const music = s.music_upload;
  return {
    id: String(s.id),
    trackTitle:  (music?.release_title ?? music?.track_title ?? s.split_name ?? "") as string,
    trackCover:  (music?.album_art_url ?? "/images/releases/cover-blue.svg") as string,
    pendingCount: s.recipients?.filter((r) => r.status === "pending").length ?? 0,
    isLocked: s.is_locked ?? false,
    splitName: s.split_name,
    musicUploadId: s.music_upload_id,
    totalEarnings: 0, // populated from earnings endpoint separately
    collaborators: (s.recipients ?? []).map((r, i) => ({
      name: r.full_name,
      email: r.email,
      role: "Collaborator",
      split: r.percentage,
      color: COLLAB_COLORS[i % COLLAB_COLORS.length],
      isYou: userEmail ? r.email === userEmail : false,
      status: r.status ?? "pending",
      recipientId: r.id,
    })),
  };
}

/* ─── useSplits — main list ───────────────────────────────────── */
export function useSplits() {
  const [splits, setSplits] = useState<NormalisedSplit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await getSplits({ per_page: 50 });
    if (res.error) {
      setError(res.error);
    } else {
      const list = unwrapList<Split>(res.data);
      setSplits(list.map((s) => normaliseSplit(s)));
    }
    setIsLoading(false);
  }, []);

  const remove = useCallback(async (id: string) => {
    const res = await deleteSplit(id);
    if (!res.error) {
      setSplits((prev) => prev.filter((s) => s.id !== id));
    }
    return res;
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derived stats
  const stats = {
    activeAgreements: splits.length,
    collaborators: splits.reduce((sum, s) => sum + s.collaborators.length, 0),
    pendingAcceptance: splits.reduce((sum, s) => sum + s.pendingCount, 0),
  };

  return { splits, isLoading, error, refresh: load, remove, stats };
}

/* ─── useCreateSplit ──────────────────────────────────────────── */
export function useCreateSplit() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const create = useCallback(async (
    payload: CreateSplitPayload,
    onSuccess?: () => void
  ) => {
    setIsLoading(true);
    setError(null);
    const res = await createSplit(payload);
    if (res.error) {
      setError(res.error);
      toastError("Failed to create split", res.error);
    } else {
      success("Split agreement created!", "Collaborators have been notified via email.");
      onSuccess?.();
    }
    setIsLoading(false);
  }, [success, toastError]);

  return { create, isLoading, error };
}

/* ─── useUpdateSplit ──────────────────────────────────────────── */
export function useUpdateSplit() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: toastError } = useToast();

  const update = useCallback(async (
    id: string,
    payload: UpdateSplitPayload,
    onSuccess?: () => void
  ) => {
    setIsLoading(true);
    const res = await updateSplit(id, payload);
    if (res.error) {
      toastError("Failed to update split", res.error);
    } else {
      success("Split updated!", "Changes saved successfully.");
      onSuccess?.();
    }
    setIsLoading(false);
  }, [success, toastError]);

  return { update, isLoading };
}

/* ─── useRecipients ───────────────────────────────────────────── */
export function useRecipients(splitId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: toastError } = useToast();

  const add = useCallback(async (
    payload: AddRecipientPayload,
    onSuccess?: () => void
  ) => {
    setIsLoading(true);
    const res = await addRecipient(splitId, payload);
    if (res.error) {
      toastError("Failed to add recipient", res.error);
    } else {
      success("Recipient added!", "Invitation sent.");
      onSuccess?.();
    }
    setIsLoading(false);
  }, [splitId, success, toastError]);

  const update = useCallback(async (
    recipientId: number,
    payload: Partial<AddRecipientPayload>,
    onSuccess?: () => void
  ) => {
    setIsLoading(true);
    const res = await updateRecipient(splitId, recipientId, payload);
    if (res.error) {
      toastError("Failed to update recipient", res.error);
    } else {
      success("Recipient updated!");
      onSuccess?.();
    }
    setIsLoading(false);
  }, [splitId, success, toastError]);

  const remove = useCallback(async (
    recipientId: number,
    onSuccess?: () => void
  ) => {
    setIsLoading(true);
    const res = await removeRecipient(splitId, recipientId);
    if (res.error) {
      toastError("Failed to remove recipient", res.error);
    } else {
      success("Recipient removed.");
      onSuccess?.();
    }
    setIsLoading(false);
  }, [splitId, success, toastError]);

  return { add, update, remove, isLoading };
}

/* ─── useSplitEarnings ────────────────────────────────────────── */
export function useSplitEarnings() {
  const [earnings, setEarnings] = useState<SplitEarnings[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await getMyEarnings();
    if (!res.error) {
      setEarnings(unwrapList<SplitEarnings>(res.data));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalEarnings = earnings.reduce((sum, e) => sum + (e.your_earnings ?? 0), 0);

  return { earnings, totalEarnings, isLoading, refresh: load };
}