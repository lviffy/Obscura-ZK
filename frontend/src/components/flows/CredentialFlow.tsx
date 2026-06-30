"use client";

import { useState } from "react";
import ZKConsole from "../hero/ZKConsole";
import { CheckCircle, Lock } from "@phosphor-icons/react";
import { T } from "@/lib/tokens";

interface Credential { nullifier: string; issuedAt: string; }
interface Props { onCredentialIssued: (c: Credential) => void; }

export default function CredentialFlow({ onCredentialIssued }: Props) {
  const [balance, setBalance] = useState("");
  const [member, setMember] = useState(false);
  const [age, setAge] = useState(false);
  const [status, setStatus] = useState<"idle" | "proving" | "done">("idle");
  const [credential, setCredential] = useState<Credential | null>(null);

  const canProve = balance !== "" && Number(balance) >= 0;

  function handleGenerate() {
    if (!canProve) return;
    setStatus("proving");
    setTimeout(() => {
      const cred: Credential = {
        nullifier: "0x7f3a8c2e91d4b6f05a3e7c1b" + Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0"),
        issuedAt: new Date().toISOString(),
      };
      setCredential(cred);
      setStatus("done");
      onCredentialIssued(cred);
    }, 4500);
  }

  const CHECKS = [
    "Balance threshold proof (Noir circuit)",
    "Allowlist membership gate",
    "Age eligibility check",
    "On-chain nullifier via rs-soroban-ultrahonk",
  ];

  return (
    <section id="credentials" style={{ borderTop: `1px solid ${T.border}`, padding: "80px 0" }}>
      <div
        style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16"
      >
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <h2
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: T.text,
            }}
          >
            ZK Credentials
          </h2>
          <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, maxWidth: "52ch" }}>
            Prove your balance, membership, and eligibility without revealing
            the underlying values. Your credential nullifier is stored on-chain
            and reused across payroll and voting flows.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CHECKS.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <CheckCircle size={14} weight="bold" style={{ marginTop: 2, flexShrink: 0, color: T.accent }} />
                <span style={{ fontSize: 14, color: T.muted }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <span
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 11,
                border: `1px solid ${T.border}`,
                padding: "4px 8px",
                color: T.mutedLo,
                borderRadius: T.r,
              }}
            >
              NOIR / rs-soroban-ultrahonk
            </span>
          </div>
        </div>

        {/* Right: interactive */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {status !== "done" ? (
            <>
              {/* Balance input */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  htmlFor="balance-input"
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-geist-mono), monospace",
                    color: T.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Minimum Balance (XLM)
                </label>
                <input
                  id="balance-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 500"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    color: T.text,
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 14,
                    padding: "12px 16px",
                    borderRadius: T.r,
                    outline: "none",
                    width: "100%",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
                />
              </div>

              {/* Checkboxes */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { id: "member-check", label: "Allowlist membership verified", val: member, set: setMember },
                  { id: "age-check",    label: "Age eligibility (18+) confirmed",  val: age,    set: setAge    },
                ].map(({ id, label, val, set }) => (
                  <label
                    key={id}
                    htmlFor={id}
                    style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      id={id}
                      checked={val}
                      onChange={(e) => set(e.target.checked)}
                      style={{ position: "absolute", opacity: 0, width: 0 }}
                    />
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: `1px solid ${val ? T.accent : T.border}`,
                        background: val ? T.accent : "transparent",
                        borderRadius: 2,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      {val && (
                        <svg viewBox="0 0 10 8" width="10" height="8">
                          <path d="M1 4l2.5 2.5L9 1" stroke={T.bg} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span style={{ fontSize: 14, color: T.muted }}>{label}</span>
                  </label>
                ))}
              </div>

              {status === "proving" && <ZKConsole lines={6} autoplay />}
              {status === "idle" && (
                <div
                  style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    padding: "24px 16px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: 12, fontFamily: "var(--font-geist-mono), monospace", color: T.mutedLo }}>
                    No credential generated yet.
                  </p>
                </div>
              )}

              <button
                id="generate-credential-btn"
                onClick={handleGenerate}
                disabled={!canProve || status === "proving"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 20px",
                  fontSize: 11,
                  fontFamily: "var(--font-geist-mono), monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  background: T.accent,
                  color: T.bg,
                  borderRadius: T.r,
                  border: "none",
                  cursor: canProve && status !== "proving" ? "pointer" : "not-allowed",
                  opacity: canProve && status !== "proving" ? 1 : 0.35,
                  transition: "background 0.15s",
                }}
              >
                {status === "proving" ? "Proving..." : "Generate Credential"}
              </button>
            </>
          ) : (
            /* Success state */
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ border: `1px solid ${T.border}`, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.success, display: "inline-block" }} />
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-geist-mono), monospace",
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: T.success,
                    }}
                  >
                    Credential Verified
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", color: T.mutedLo, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Nullifier
                  </span>
                  <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 13, color: T.mono, wordBreak: "break-all" }}>
                    {credential?.nullifier}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", color: T.mutedLo, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Issued
                  </span>
                  <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 12, color: T.muted }}>
                    {credential?.issuedAt}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontFamily: "var(--font-geist-mono), monospace", color: T.success }}>
                <Lock size={12} weight="bold" />
                Payroll and Voting flows unlocked
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
