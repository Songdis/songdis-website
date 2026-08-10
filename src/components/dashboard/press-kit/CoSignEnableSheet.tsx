"use client";

import { useMemo, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import type { CoSignEnableRequest } from "@/lib/api/co-sign";
import type { CoSignFailure } from "@/lib/hooks/useCoSign";
import { FailureNotice, InlineField, PrimaryButton, Sheet } from "./primitives";
import { ACCENT_TEXT } from "./theme";


interface Props {
  onClose: () => void;
  artistName: string;
  busy: boolean;
  failure: CoSignFailure | null;
  onSubmit: (details: CoSignEnableRequest) => Promise<boolean>;
  retrying?: boolean;
}

interface Draft {
  first_name: string;
  last_name: string;
  email: string;
  dob: string;
  bvn: string;
  phone_country_code: string;
  phone_number: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
}

const EMPTY: Draft = {
  first_name: "",
  last_name: "",
  email: "",
  dob: "",
  bvn: "",
  phone_country_code: "234",
  phone_number: "",
  street: "",
  city: "",
  state: "",
  postal_code: "",
};

function toMapleradDob(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function localProblems(draft: Draft): Partial<Record<keyof Draft, string>> {
  const out: Partial<Record<keyof Draft, string>> = {};

  if (!draft.first_name.trim()) out.first_name = "Required.";
  if (!draft.last_name.trim()) out.last_name = "Required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
    out.email = "Enter the email you can be reached on.";
  }
  if (!toMapleradDob(draft.dob)) out.dob = "Pick your date of birth.";

  const bvn = draft.bvn.replace(/\D/g, "");
  if (bvn.length !== 11) out.bvn = "A BVN is exactly 11 digits.";

  if (!draft.phone_country_code.replace(/\D/g, "")) out.phone_country_code = "Required.";
  if (draft.phone_number.replace(/\D/g, "").length < 7) {
    out.phone_number = "Enter the phone number on your bank records.";
  }

  if (!draft.street.trim()) out.street = "Required.";
  if (!draft.city.trim()) out.city = "Required.";
  if (!draft.state.trim()) out.state = "Required.";
  if (!draft.postal_code.trim()) out.postal_code = "Required.";

  return out;
}

export function CoSignEnableSheet({
  onClose,
  artistName,
  busy,
  failure,
  onSubmit,
  retrying = false,
}: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [showProblems, setShowProblems] = useState(false);

  const problems = useMemo(() => localProblems(draft), [draft]);
  const set = <K extends keyof Draft>(key: K) => (value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const problemOf = (key: keyof Draft) => (showProblems ? problems[key] ?? null : null);

  const submit = async () => {
    if (Object.keys(problems).length > 0) {
      setShowProblems(true);
      return;
    }
    const dob = toMapleradDob(draft.dob);
    if (!dob) {
      setShowProblems(true);
      return;
    }

    const ok = await onSubmit({
      first_name: draft.first_name.trim(),
      last_name: draft.last_name.trim(),
      email: draft.email.trim(),
      dob,
      bvn: draft.bvn.replace(/\D/g, ""),
      phone_country_code: draft.phone_country_code.replace(/\D/g, ""),
      phone_number: draft.phone_number.replace(/\D/g, "").replace(/^0+/, ""),
      street: draft.street.trim(),
      city: draft.city.trim(),
      state: draft.state.trim(),
      postal_code: draft.postal_code.trim(),
      country: "NG",
    });

    if (ok) onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={retrying ? "Finish setting up co-sign" : "Turn on co-sign"}
      subtitle={`We'll open a Nigerian bank account in your own name, so fans can transfer straight to ${artistName}.`}
      footer={
        <div className="flex flex-col gap-3">
          {failure && (
            <FailureNotice
              title="Your co-sign account was not opened"
              error={failure.error}
              errors={failure.errors}
            />
          )}
          <PrimaryButton onClick={() => void submit()} disabled={busy} full>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" aria-hidden />
                Opening your account…
              </span>
            ) : (
              "Open my co-sign account"
            )}
          </PrimaryButton>
          <p className="font-body text-white/30 text-[11px] leading-relaxed text-center">
            This takes a few seconds. Nothing is charged, now or ever — co-sign is money
            coming in.
          </p>
        </div>
      }
    >
      <div
        className="rounded-xl border p-4 flex flex-col gap-2"
        style={{ borderColor: "rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.02)" }}
      >
        <p className="font-body text-white text-xs font-medium flex items-center gap-2">
          <ShieldCheck size={15} style={{ color: ACCENT_TEXT }} aria-hidden />
          Why we ask for your BVN
        </p>
        <p className="font-body text-white/60 text-[11.5px] leading-relaxed">
          Your co-sign account is a real bank account in your name, and Nigerian banking
          rules require the bank to confirm who owns it before it can be opened. Your BVN
          is that check.
        </p>
        <p className="font-body text-white/60 text-[11.5px] leading-relaxed">
          A BVN is not a password and cannot be used to move money.{" "}
          <span className="text-white/85">
            Songdis never asks for your bank login, your PIN, your OTP or your card
            details
          </span>
          , and would never need them. We pass your BVN once to our licensed banking
          partner, store it encrypted, and never show it again — not on this page, not in
          an email, not to our own staff.
        </p>
      </div>

      <FieldGroup
        title="Your legal name"
        hint="As it appears on your bank records — not your stage name. The bank matches these against your BVN."
      >
        <div className="grid grid-cols-2 gap-3">
          <InlineField
            label="First name"
            value={draft.first_name}
            onChange={set("first_name")}
            error={problemOf("first_name")}
            maxLength={80}
          />
          <InlineField
            label="Last name"
            value={draft.last_name}
            onChange={set("last_name")}
            error={problemOf("last_name")}
            maxLength={80}
          />
        </div>

        <InlineField
          label="Email"
          type="email"
          inputMode="email"
          value={draft.email}
          onChange={set("email")}
          error={problemOf("email")}
          maxLength={190}
        />

        <DateField
          label="Date of birth"
          value={draft.dob}
          onChange={set("dob")}
          error={problemOf("dob")}
        />

        <InlineField
          label="BVN"
          value={draft.bvn}
          onChange={(v) => set("bvn")(v.replace(/\D/g, "").slice(0, 11))}
          error={problemOf("bvn")}
          hint="11 digits. Dial *565*0# from the number registered with your bank if you don't know it."
          inputMode="text"
          maxLength={11}
        />
      </FieldGroup>

      <FieldGroup title="Phone" hint="The number your bank has on file.">
        <div className="grid grid-cols-[88px_1fr] gap-3">
          <InlineField
            label="Code"
            value={draft.phone_country_code}
            onChange={(v) => set("phone_country_code")(v.replace(/\D/g, "").slice(0, 4))}
            error={problemOf("phone_country_code")}
            maxLength={5}
          />
          <InlineField
            label="Phone number"
            value={draft.phone_number}
            onChange={(v) => set("phone_number")(v.replace(/\D/g, "").slice(0, 15))}
            error={problemOf("phone_number")}
            maxLength={20}
          />
        </div>
      </FieldGroup>

      <FieldGroup
        title="Address"
        hint="Nigeria only for now — a co-sign account is a naira account."
      >
        <InlineField
          label="Street"
          value={draft.street}
          onChange={set("street")}
          error={problemOf("street")}
          maxLength={150}
        />
        <div className="grid grid-cols-2 gap-3">
          <InlineField
            label="City"
            value={draft.city}
            onChange={set("city")}
            error={problemOf("city")}
            maxLength={80}
          />
          <InlineField
            label="State"
            value={draft.state}
            onChange={set("state")}
            error={problemOf("state")}
            maxLength={80}
          />
        </div>
        <InlineField
          label="Postal code"
          value={draft.postal_code}
          onChange={set("postal_code")}
          error={problemOf("postal_code")}
          maxLength={20}
        />
      </FieldGroup>
    </Sheet>
  );
}


function FieldGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="font-heading text-white uppercase text-[11px] tracking-[0.14em]">
          {title}
        </h3>
        {hint && (
          <p className="font-body text-white/35 text-[11px] mt-1 leading-relaxed">{hint}</p>
        )}
      </div>
      {children}
    </div>
  );
}


function DateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label
        htmlFor="cosign-dob"
        className="font-body text-[10px] uppercase tracking-[0.12em] text-white/40"
      >
        {label}
      </label>
      <input
        id="cosign-dob"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={[
          "w-full bg-transparent text-white rounded-md px-2 py-1.5 font-body text-sm",
          "border border-dashed border-white/20 transition-colors",
          "focus:outline-none focus:border-solid focus:border-[#E5342F] focus:bg-white/[0.03]",
          "[color-scheme:dark]",
          error ? "border-solid border-[#d03b3b]" : "",
        ].join(" ")}
      />
      {error && (
        <p className="font-body text-[11px]" style={{ color: ACCENT_TEXT }}>
          {error}
        </p>
      )}
    </div>
  );
}
