"use client";

import { useEffect } from "react";
import { savePromoFromUrl } from "@/lib/billing/promoCapture";

/** Remembers ?promo=CODE from any link into the site (see promoCapture). */
export default function PromoCapture() {
  useEffect(() => savePromoFromUrl(), []);
  return null;
}
