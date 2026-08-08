/**
 * lib/api/label.ts — artist invitations for label accounts (Label design §6, L4).
 *
 * Two audiences share this module:
 *   - the LABEL, listing / sending / revoking invitations;
 *   - the ARTIST, accepting one from an emailed link.
 *
 * `accept` deliberately carries no label entitlement — the accepting account is by
 * definition not a label. It still requires a session, because the grant has to be bound
 * to an account.
 */

import { request } from "./core";

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export interface ArtistInvitation {
  id: number;
  artist_profile_id: number;
  artist_name: string | null;
  email: string;
  role: "viewer" | "manager" | "owner";
  status: InvitationStatus;
  /** Server-computed: a row can be `pending` and past its expiry until something touches it. */
  expired: boolean;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string | null;
  /** Returned ONLY when creating — never in a listing, where it would be a live credential. */
  token?: string;
}

const ROOT = "/label";

export async function listInvitations(profileId?: number) {
  const query = profileId ? `?profile_id=${profileId}` : "";
  return request<ArtistInvitation[]>(`${ROOT}/invitations${query}`, { method: "GET" }, true);
}

export async function sendInvitation(profileId: number, email: string) {
  return request<ArtistInvitation>(
    `${ROOT}/invitations`,
    { method: "POST", body: JSON.stringify({ profile_id: profileId, email }) },
    true
  );
}

export async function revokeInvitation(id: number) {
  return request<null>(`${ROOT}/invitations/${id}/revoke`, { method: "POST" }, true);
}

export async function acceptInvitation(token: string) {
  return request<ArtistInvitation>(
    `${ROOT}/invitations/accept`,
    { method: "POST", body: JSON.stringify({ token }) },
    true
  );
}
