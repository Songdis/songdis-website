import { redirect } from "next/navigation";

// Short link for the CBA2026 campaign (songdis.com/cba): sign up with the code remembered,
// so it applies by itself when they pick a plan.
export default function CbaCampaign() {
  redirect("/sign-up?promo=CBA2026");
}
