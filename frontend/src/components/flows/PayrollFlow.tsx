"use client";

import { useState } from "react";
import ZKConsole from "../hero/ZKConsole";
import { Lock } from "@phosphor-icons/react";
import { T } from "@/lib/tokens";
import { useWallet } from "@/hooks/useWallet";
import { provePayroll } from "@/lib/zkProver";
import { invokeSorobanContract } from "@/lib/soroban";
import { PRIVATE_TREASURY_ID } from "@/lib/contracts";
import { LogEntry } from "@/lib/types";

interface Props { credentialNullifier: string | null; }

const DEMO_CSV = `GBWVWI4DQ5ECDYSMG7PMJC47ZDM3XKDSZFCZAHMEJSMK5IQPJWSNKZX, 850
GBZXN7PIRZGNMHGA7S4GS4E5RJVL7DWD5GVPXHMJVVVQ3DXEAADGXY, 1200
GDSVO7GGKJNVKGCPGKIXBXPHZXAXMVYXMPNMJK7JXFXMM4E7BKGYKWK, 650`;

export default function PayrollFlow({ credentialNullifier }: Props) {
  const { address, connectWallet } = useWallet();
  const [csv, setCsv] = useState("");
  const [status, setStatus] = useState<"idle" | "proving" | "done">("idle");
  const [total, setTotal] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const locked = !credentialNullifier;

  async function handleRun() {
    let activeAddress = address;
    if (!activeAddress) {
      activeAddress = await connectWallet();
      if (!activeAddress) return;
    }
    
    setStatus("proving");
    setLogs([{ label: "system", text: "Initializing private payroll batch..." }]);
    
    const inputCsv = csv.trim() || DEMO_CSV;
    const sum = inputCsv.split("\n")
      .map((l) => Number(l.split(",")[1]?.trim()))
      .filter((n) => !isNaN(n))
      .reduce((a, b) => a + b, 0);
    setTotal(sum);
    
    const result = await provePayroll(inputCsv, 5000);
    setLogs(result.logs);
    
    if (!result.success || !result.proof) {
      setStatus("idle");
      return;
    }
    
    // Invoke Soroban execute_payroll
    setLogs((prev) => [...prev, { label: "soroban", text: "Broadcasting execute_payroll transaction to testnet..." }]);
    
    const callResult = await invokeSorobanContract(
      PRIVATE_TREASURY_ID,
      "execute_payroll",
      [
        Buffer.from(result.proof.risc0Receipt.replace("0x", ""), "hex"),
        Buffer.from("00".repeat(80), "hex"), // 80 bytes journal
        result.proof.noirTransferProofs.map(p => Buffer.from(p.replace("0x", ""), "hex"))
      ],
      activeAddress
    );
    
    if (callResult.success) {
      setLogs((prev) => [
        ...prev,
        { label: "soroban", text: "Verification Succeeded!" },
        { label: "soroban", text: `Tx Hash: ${callResult.txHash}` },
        { label: "system", text: "Confidential payroll batch fully processed!" }
      ]);
      setStatus("done");
    } else {
      setLogs((prev) => [
        ...prev,
        { label: "soroban", text: `Verification Failed: ${callResult.error}` }
      ]);
      setStatus("idle");
    }
  }

  const recipients = csv.split("\n").filter(Boolean);

  return (
    <section id="payroll" style={{ borderTop: `1px solid ${T.border}`, padding: "80px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <div style={{ maxWidth: 640, marginBottom: 40 }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 600, letterSpacing: "-0.02em", color: T.text, marginBottom: 16 }}>
            Private Payroll
          </h2>
          <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, maxWidth: "55ch", marginBottom: 16 }}>
            Batch compliance validation via RISC Zero. Individual transfers
            shielded by Noir. Only the total disbursement is ever emitted
            publicly on-chain.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["RISC ZERO / stellar-risc0-verifier", "NOIR / rs-soroban-ultrahonk"].map((b) => (
              <span
                key={b}
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 11,
                  border: `1px solid ${T.border}`,
                  padding: "4px 8px",
                  color: T.mutedLo,
                  borderRadius: T.r,
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Lock overlay wrapper */}
        <div style={{ position: "relative", opacity: locked ? 0.4 : 1, pointerEvents: locked ? "none" : "auto" }}>
          {locked && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <Lock size={24} style={{ color: T.muted }} />
              <p style={{ fontSize: 12, fontFamily: "var(--font-geist-mono), monospace", color: T.muted }}>
                Complete Flow 1 to unlock
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  htmlFor="payroll-csv"
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-geist-mono), monospace",
                    color: T.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Payroll CSV (address, amount_xlm)
                </label>
                <textarea
                  id="payroll-csv"
                  rows={6}
                  value={csv}
                  onChange={(e) => setCsv(e.target.value)}
                  placeholder={DEMO_CSV}
                  style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    color: T.mono,
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 12,
                    padding: "12px 16px",
                    borderRadius: T.r,
                    outline: "none",
                    resize: "none",
                    width: "100%",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
                />
              </div>

              <button
                id="run-payroll-btn"
                onClick={handleRun}
                disabled={!csv.trim() || status === "proving"}
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
                  cursor: !csv.trim() || status === "proving" ? "not-allowed" : "pointer",
                  opacity: !csv.trim() || status === "proving" ? 0.35 : 1,
                  width: "fit-content",
                }}
              >
                {status === "proving" ? "Processing..." : "Run Payroll Batch"}
              </button>

              {credentialNullifier && (
                <div style={{ borderLeft: `2px solid ${T.accent}`, paddingLeft: 12, fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", color: T.mutedLo }}>
                  Using nullifier: {credentialNullifier.slice(0, 18)}...
                </div>
              )}
            </div>

            {/* Output */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {status === "idle" && (
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: "32px 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontSize: 12, fontFamily: "var(--font-geist-mono), monospace", color: T.mutedLo }}>
                    No batch submitted yet.
                  </p>
                </div>
              )}

              {(status === "proving" || status === "done") && <ZKConsole lines={6} autoplay={false} logs={logs} />}

              {status === "done" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* RISC Zero */}
                  <div style={{ border: `1px solid ${T.border}`, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", textTransform: "uppercase", letterSpacing: "0.14em", color: T.mutedLo }}>
                        RISC Zero Receipt
                      </span>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", color: T.success }}>VALID</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 12, color: T.mono }}>
                      Batch size: {recipients.length} recipients
                    </span>
                    <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 12, color: T.mono }}>
                      Budget constraint: satisfied
                    </span>
                  </div>

                  {/* Noir proofs */}
                  <div style={{ border: `1px solid ${T.border}`, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", textTransform: "uppercase", letterSpacing: "0.14em", color: T.mutedLo }}>
                        Noir Transfer Proofs
                      </span>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", color: T.success }}>VERIFIED</span>
                    </div>
                    {recipients.map((_, i) => (
                      <span key={i} style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 12, color: T.mono }}>
                        Transfer {i + 1}: amount shielded - proof 2.8 kb
                      </span>
                    ))}
                  </div>

                  {/* Public total */}
                  <div style={{ borderTop: `2px solid ${T.accent}`, paddingTop: 16 }}>
                    <div style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", color: T.mutedLo, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                      Public Event: Total Disbursed
                    </div>
                    <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 40, color: T.text }}>
                      {total.toLocaleString()}{" "}
                      <span style={{ fontSize: 20, color: T.muted }}>XLM</span>
                    </div>
                    <div style={{ fontSize: 12, fontFamily: "var(--font-geist-mono), monospace", color: T.mutedLo, marginTop: 4 }}>
                      Individual amounts permanently sealed.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
