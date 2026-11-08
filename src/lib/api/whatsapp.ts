/**
 * lib/api/whatsapp.ts — WhatsApp number per artist profile, for the dashboard prompt.
 */

import { request } from "./core";

export interface WhatsAppProfile {
  id: number;
  stage_name: string;
  image: string | null;
  whatsapp_number: string | null;
  /** Their saved phone in WhatsApp form, so confirming it is one tap. */
  suggested_number: string | null;
}

export interface WhatsAppStatus {
  profiles: WhatsAppProfile[];
  missing: number;
}

export async function getWhatsAppStatus() {
  return request<WhatsAppStatus>("/profile/whatsapp", { method: "GET" }, true);
}

export async function saveWhatsAppNumber(profileId: number, whatsappNumber: string) {
  return request<{ id: number; whatsapp_number: string }>(
    `/profile/${profileId}/whatsapp`,
    { method: "PUT", body: JSON.stringify({ whatsapp_number: whatsappNumber, consent: true }) },
    true
  );
}
