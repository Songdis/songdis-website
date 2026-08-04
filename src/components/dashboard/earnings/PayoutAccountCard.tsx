"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getPayoutStatus,
  verifyIdentity,
  savePayoutAccount,
  type PayoutStatus,
} from "@/lib/api/payout";
import { useBanks } from "@/lib/hooks/useEarnings";
import BankSelect from "./BankSelect";


function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export default function PayoutAccountCard() {
  const [status, setStatus] = useState<PayoutStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"idle" | "verify" | "account">("idle");


  const load = useCallback(async (): Promise<void> => {
    const res = await getPayoutStatus();

    if (!res.error && res.data) {
      setStatus(res.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    getPayoutStatus().then((res) => {
      if (cancelled) return;
      if (!res.error && res.data) setStatus(res.data);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  if (loading || !status) return null;

  if (!status.provider_ready && !status.identity_verified) return null;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-heading text-white uppercase text-sm tracking-wide">
            Payout Account
          </p>
          <p className="font-body text-white/40 text-xs mt-1">
            Where your royalties are sent
          </p>
        </div>

        {status.identity_verified && (
          <span className="font-body text-[11px] rounded-full px-3 py-1 bg-green-500/15 text-green-400 border border-green-500/25">
            Identity verified
          </span>
        )}
      </div>

      {mode === "verify" && (
        <VerifyIdentityPanel
          onDone={() => { setMode("account"); load(); }}
          onCancel={() => setMode("idle")}
        />
      )}

      {mode === "account" && (
        <AccountPanel
          isChange={Boolean(status.account)}
          onDone={() => { setMode("idle"); load(); }}
          onCancel={() => setMode("idle")}
        />
      )}

      {mode === "idle" && (
        <IdleView status={status} onVerify={() => setMode("verify")} onAccount={() => setMode("account")} />
      )}
    </div>
  );
}

function IdleView({
  status,
  onVerify,
  onAccount,
}: {
  status: PayoutStatus;
  onVerify: () => void;
  onAccount: () => void;
}) {

  if (!status.identity_verified) {
    return (
      <div>
        <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
          {status.enforced
            ? "Verify your identity to withdraw your royalties. It takes about two minutes and you only do it once."
            : "Verify your identity now and add the account you want to be paid into. It takes about two minutes, and will be required for withdrawals soon."}
        </p>

        <button
          onClick={onVerify}
          className="font-body text-xs text-white bg-[#C30100] rounded-full px-5 py-2.5 hover:bg-[#a80000] transition-colors min-h-[44px]"
        >
          {status.enforced ? "Verify to withdraw" : "Verify my identity"}
        </button>
      </div>
    );
  }

  if (status.pending_review) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-4">
        <p className="font-body text-white text-sm font-medium mb-1">
          {status.pending_review.account_name}
        </p>
        <p className="font-body text-white/55 text-xs leading-relaxed">
          This is a business account, so our team is confirming it is connected
          to you before your first payout. This usually takes one working day.
        </p>
      </div>
    );
  }

  if (!status.account) {
    return (
      <div>
        <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
          Add the bank account you want your royalties paid into. It has to be
          in your own name — the one on the ID you verified.
        </p>
        <button
          onClick={onAccount}
          className="font-body text-xs text-white bg-[#C30100] rounded-full px-5 py-2.5 hover:bg-[#a80000] transition-colors min-h-[44px]"
        >
          Add payout account
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4 mb-3">
        <p className="font-body text-white text-sm font-medium">
          {status.account.account_name}
        </p>
        <p className="font-mono text-white/50 text-xs mt-1">
          {status.account.bank_name ?? "Bank"} · {status.account.account_number}
        </p>
      </div>

      <button
        onClick={onAccount}
        className="font-body text-white/40 text-[11px] hover:text-[#C30100] transition-colors min-h-[40px]"
      >
        Change account
      </button>
    </div>
  );
}

function VerifyIdentityPanel({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [front, setFront] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (file: File) => {
    setError(null);

    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That image is too large. Please use one under 8MB.");
      return;
    }

    try {
      setFront(await toBase64(file));
    } catch {
      setError("Could not read that file. Please try another image.");
    }
  };

  const submit = async () => {
    if (!front) return;

    setBusy(true);
    setError(null);

    const res = await verifyIdentity({ document_front: front });

    setBusy(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    onDone();
  };

  return (
    <div>
      <p className="font-body text-white/60 text-sm leading-relaxed mb-1">
        Upload a clear photo of your government ID — NIN slip, driver&apos;s
        licence, passport or voter&apos;s card.
      </p>
      <p className="font-body text-white/35 text-xs leading-relaxed mb-4">
        We read your name from it to check your bank account belongs to you.
        We do not keep the image.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }}
      />

      <button
        onClick={() => fileRef.current?.click()}
        className="w-full border-2 border-dashed border-[#C30100]/40 rounded-xl py-6 mb-3 font-body text-white/50 text-sm hover:border-[#C30100]/70 transition-colors"
      >
        {front ? "ID selected — tap to choose a different one" : "Choose your ID photo"}
      </button>

      {error && <p className="font-body text-[#ff6b6b] text-xs mb-3">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={busy}
          className="font-body text-xs text-white border border-white/20 rounded-full px-5 py-2.5 hover:border-white/40 transition-colors min-h-[44px] disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!front || busy}
          className="font-body text-xs text-white bg-[#C30100] rounded-full px-5 py-2.5 hover:bg-[#a80000] transition-colors min-h-[44px] disabled:opacity-30"
        >
          {busy ? "Checking..." : "Verify"}
        </button>
      </div>
    </div>
  );
}

function AccountPanel({
  isChange,
  onDone,
  onCancel,
}: {
  isChange: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");
  const [selfie, setSelfie] = useState<string | null>(null);
  const [document, setDocument] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selfieRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const { banks, isLoading: banksLoading } = useBanks("NGN");

  const read = async (file: File, set: (v: string) => void) => {
    setError(null);

    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That image is too large. Please use one under 8MB.");
      return;
    }

    try {
      set(await toBase64(file));
    } catch {
      setError("Could not read that file.");
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);

    const res = await savePayoutAccount({
      bank_code: bankCode,
      bank_name: banks.find((b) => b.code === bankCode)?.name,
      account_number: accountNumber.trim(),
      account_type: accountType,
      ...(isChange ? { selfie: selfie ?? "", document_front: document ?? "" } : {}),
    });

    setBusy(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    onDone();
  };

  const ready =
    bankCode !== "" &&
    /^[0-9]{10}$/.test(accountNumber.trim()) &&
    (!isChange || (Boolean(selfie) && Boolean(document)));

  return (
    <div className="flex flex-col gap-3">
      {isChange && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-3">
          <p className="font-body text-white/70 text-xs leading-relaxed">
            Because this changes where your money goes, we need to check it is
            really you: upload your ID again and take a selfie.
          </p>
        </div>
      )}

      <BankSelect
        banks={banks}
        value={bankCode}
        onChange={setBankCode}
        isLoading={banksLoading}
      />

      <Field
        label="Account number"
        value={accountNumber}
        onChange={(v) => setAccountNumber(v.replace(/[^0-9]/g, "").slice(0, 10))}
        placeholder="0123456789"
        inputMode="numeric"
      />

      <div>
        <label className="block font-body text-white/40 text-[11px] mb-1.5">
          Account type
        </label>
        <select
          value={accountType}
          onChange={(e) => setAccountType(e.target.value as "personal" | "business")}
          className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors"
        >
          <option value="personal">Personal — in my own name</option>
          <option value="business">Business or label account</option>
        </select>
        {accountType === "business" && (
          <p className="font-body text-white/35 text-[11px] mt-1.5 leading-relaxed">
            A label account is checked by our team before your first payout,
            since the name will not match your ID.
          </p>
        )}
      </div>

      {isChange && (
        <>
          <input ref={docRef} type="file" accept="image/jpeg,image/png" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) read(f, setDocument); }} />
          <input ref={selfieRef} type="file" accept="image/jpeg,image/png" capture="user" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) read(f, setSelfie); }} />

          <button
            onClick={() => docRef.current?.click()}
            className="w-full border border-dashed border-white/20 rounded-xl py-3 font-body text-white/50 text-xs hover:border-white/40 transition-colors min-h-[44px]"
          >
            {document ? "ID selected ✓" : "Upload your ID again"}
          </button>

          <button
            onClick={() => selfieRef.current?.click()}
            className="w-full border border-dashed border-white/20 rounded-xl py-3 font-body text-white/50 text-xs hover:border-white/40 transition-colors min-h-[44px]"
          >
            {selfie ? "Selfie taken ✓" : "Take a selfie"}
          </button>
        </>
      )}

      {error && <p className="font-body text-[#ff6b6b] text-xs leading-relaxed">{error}</p>}

      <div className="flex gap-2 mt-1">
        <button
          onClick={onCancel}
          disabled={busy}
          className="font-body text-xs text-white border border-white/20 rounded-full px-5 py-2.5 hover:border-white/40 transition-colors min-h-[44px] disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!ready || busy}
          className="font-body text-xs text-white bg-[#C30100] rounded-full px-5 py-2.5 hover:bg-[#a80000] transition-colors min-h-[44px] disabled:opacity-30"
        >
          {busy ? "Checking..." : isChange ? "Change account" : "Add account"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label className="block font-body text-white/40 text-[11px] mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/20 outline-none focus:border-[#C30100] transition-colors"
      />
    </div>
  );
}
