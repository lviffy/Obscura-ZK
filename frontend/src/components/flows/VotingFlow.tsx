"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import ZKConsole from "../hero/ZKConsole";
import { Lock } from "@phosphor-icons/react";
import { T } from "@/lib/tokens";
import { useWallet } from "@/hooks/useWallet";
import { proveVote } from "@/lib/zkProver";
import { invokeSorobanContract } from "@/lib/soroban";
import { PRIVATE_GOVERNANCE_ID } from "@/lib/contracts";
import { LogEntry } from "@/lib/types";

interface Props { credentialNullifier: string | null; }

const PROPOSALS = [
  { id: "p1", title: "Increase treasury reserve ratio to 15%", status: "OPEN"   },
  { id: "p2", title: "Fund ZK circuit audit by external firm",  status: "OPEN"   },
  { id: "p3", title: "Add USDC collateral to protocol reserves", status: "CLOSED" },
];

interface Tally { yes: number; no: number; }

export default function VotingFlow({ credentialNullifier }: Props) {
  const { address, connectWallet } = useWallet();
  const [selected, setSelected] = useState<string | null>(null);
  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  const [status, setStatus] = useState<"idle" | "proving" | "done">("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tally, setTally] = useState<Record<string, Tally>>({
    p1: { yes: 14, no: 3 },
    p2: { yes: 9,  no: 2 },
    p3: { yes: 21, no: 8 },
  });
  const [voted, setVoted] = useState<Set<string>>(new Set());

  const locked = !credentialNullifier;
  const currentProposal = PROPOSALS.find((p) => p.id === selected);

  async function handleVote() {
    if (!selected || !choice || status === "proving") return;
    
    let activeAddress = address;
    if (!activeAddress) {
      activeAddress = await connectWallet();
      if (!activeAddress) return;
    }
    
    setStatus("proving");
    setLogs([{ label: "system", text: "Initializing private vote..." }]);
    
    const proposalNum = selected === "p1" ? 1n : selected === "p2" ? 2n : 3n;
    
    const result = await proveVote(12345, Number(proposalNum), choice === "yes" ? 1 : 0);
    setLogs(result.logs);
    
    if (!result.success || !result.proof) {
      setStatus("idle");
      return;
    }
    
    // Invoke Soroban vote
    setLogs((prev) => [...prev, { label: "soroban", text: "Broadcasting vote transaction to testnet..." }]);
    
    const callResult = await invokeSorobanContract(
      PRIVATE_GOVERNANCE_ID,
      "vote",
      [
        {
          a: Buffer.concat([Buffer.from(result.proof.proof.a[0].replace("0x",""), "hex"), Buffer.from(result.proof.proof.a[1].replace("0x",""), "hex")]),
          b: Buffer.concat([
            Buffer.from(result.proof.proof.b[0][1].replace("0x",""), "hex"),
            Buffer.from(result.proof.proof.b[0][0].replace("0x",""), "hex"),
            Buffer.from(result.proof.proof.b[1][1].replace("0x",""), "hex"),
            Buffer.from(result.proof.proof.b[1][0].replace("0x",""), "hex"),
          ]),
          c: Buffer.concat([Buffer.from(result.proof.proof.c[0].replace("0x",""), "hex"), Buffer.from(result.proof.proof.c[1].replace("0x",""), "hex")]),
        },
        Buffer.from(result.proof.publicInputs[0].replace("0x",""), "hex"), // credential_nullifier
        proposalNum,
        choice === "yes" ? 1n : 0n,
        Buffer.from(result.proof.publicInputs[3].replace("0x",""), "hex") // voting_nullifier
      ],
      activeAddress
    );
    
    if (callResult.success) {
      setLogs((prev) => [
        ...prev,
        { label: "soroban", text: "Verification Succeeded!" },
        { label: "soroban", text: `Tx Hash: ${callResult.txHash}` },
        { label: "system", text: "Vote cast successfully & stored on-chain!" }
      ]);
      setTally((prev) => ({
        ...prev,
        [selected]: {
          yes: prev[selected].yes + (choice === "yes" ? 1 : 0),
          no:  prev[selected].no  + (choice === "no"  ? 1 : 0),
        },
      }));
      setVoted((prev) => new Set([...prev, selected]));
      setStatus("done");
      setTimeout(() => { setStatus("idle"); setSelected(null); setChoice(null); }, 3500);
    } else {
      setLogs((prev) => [
        ...prev,
        { label: "soroban", text: `Verification Failed: ${callResult.error}` }
      ]);
      setStatus("idle");
    }
  }

  return (
    <section id="voting" style={{ borderTop: `1px solid ${T.border}`, padding: "80px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <div style={{ maxWidth: 640, marginBottom: 40 }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 600, letterSpacing: "-0.02em", color: T.text, marginBottom: 16 }}>
            Private DAO Voting
          </h2>
          <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, maxWidth: "55ch", marginBottom: 16 }}>
            Your credential nullifier proves membership. A Circom Groth16 proof
            seals your vote. The tally publishes on-chain. Individual votes are
            permanently sealed.
          </p>
          <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, border: `1px solid ${T.border}`, padding: "4px 8px", color: T.mutedLo, borderRadius: T.r }}>
            CIRCOM / Groth16 Soroban Verifier
          </span>
        </div>

        {/* Lock wrapper */}
        <div style={{ position: "relative", opacity: locked ? 0.4 : 1, pointerEvents: locked ? "none" : "auto" }}>
          {locked && (
            <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
              <Lock size={24} style={{ color: T.muted }} />
              <p style={{ fontSize: 12, fontFamily: "var(--font-geist-mono), monospace", color: T.muted }}>Complete Flow 1 to unlock</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
            {/* Left: proposals */}
            <div>
              {PROPOSALS.map((proposal) => (
                <div
                  key={proposal.id}
                  onClick={() => {
                    if (proposal.status === "OPEN" && !voted.has(proposal.id)) {
                      setSelected(selected === proposal.id ? null : proposal.id);
                      setChoice(null);
                      setStatus("idle");
                    }
                  }}
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    cursor: proposal.status === "OPEN" && !voted.has(proposal.id) ? "pointer" : "default",
                    background: selected === proposal.id ? T.surface : "transparent",
                    transition: "background 0.15s",
                    marginLeft: -24,
                    marginRight: -24,
                    paddingLeft: 24,
                    paddingRight: 24,
                  }}
                  onMouseEnter={(e) => {
                    if (proposal.status === "OPEN") (e.currentTarget as HTMLDivElement).style.background = T.surface;
                  }}
                  onMouseLeave={(e) => {
                    if (selected !== proposal.id) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }}
                >
                  <span style={{ fontSize: 14, color: T.text }}>{proposal.title}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    {voted.has(proposal.id) && (
                      <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", color: T.success }}>Voted</span>
                    )}
                    <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", textTransform: "uppercase", letterSpacing: "0.12em", color: proposal.status === "OPEN" ? T.accent : T.mutedLo }}>
                      {proposal.status}
                    </span>
                  </div>
                </div>
              ))}

              {/* Vote panel */}
              <AnimatePresence>
                {selected && currentProposal?.status === "OPEN" && !voted.has(selected) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ paddingTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                      <p style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", color: T.mutedLo, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Vote on: {currentProposal?.title.slice(0, 40)}...
                      </p>

                      <div style={{ display: "flex", gap: 12 }}>
                        {(["yes", "no"] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setChoice(opt)}
                            style={{
                              padding: "10px 24px",
                              fontSize: 11,
                              fontFamily: "var(--font-geist-mono), monospace",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              border: `1px solid ${choice === opt ? (opt === "yes" ? T.success : T.error) : T.border}`,
                              background: choice === opt ? (opt === "yes" ? T.success : T.error) : "transparent",
                              color: choice === opt ? T.bg : T.muted,
                              borderRadius: T.r,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      {(status === "proving" || status === "done") && <ZKConsole lines={4} autoplay={false} logs={logs} />}
                      {status === "done" && (
                        <span style={{ fontSize: 12, fontFamily: "var(--font-geist-mono), monospace", color: T.success }}>
                          Vote recorded. Nullifier sealed.
                        </span>
                      )}

                      <button
                        id="cast-vote-btn"
                        onClick={handleVote}
                        disabled={!choice || status === "proving" || status === "done"}
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
                          cursor: !choice || status !== "idle" ? "not-allowed" : "pointer",
                          opacity: !choice || status !== "idle" ? 0.35 : 1,
                          width: "fit-content",
                        }}
                      >
                        {status === "proving" ? "Proving..." : "Cast Sealed Vote"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: tally */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <p style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", textTransform: "uppercase", letterSpacing: "0.14em", color: T.mutedLo }}>
                Live Tally
              </p>
              {PROPOSALS.map((proposal) => (
                <div key={proposal.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.4 }}>
                    {proposal.title.length > 36 ? proposal.title.slice(0, 36) + "..." : proposal.title}
                  </p>
                  <div style={{ display: "flex", gap: 24 }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 28, color: T.success }}>
                        {tally[proposal.id].yes}
                      </div>
                      <div style={{ fontSize: 10, fontFamily: "var(--font-geist-mono), monospace", color: T.mutedLo, marginTop: 2 }}>YES</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 28, color: T.error }}>
                        {tally[proposal.id].no}
                      </div>
                      <div style={{ fontSize: 10, fontFamily: "var(--font-geist-mono), monospace", color: T.mutedLo, marginTop: 2 }}>NO</div>
                    </div>
                  </div>
                </div>
              ))}

              {credentialNullifier && (
                <div style={{ borderLeft: `2px solid ${T.accent}`, paddingLeft: 12 }}>
                  <p style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", color: T.muted }}>
                    Nullifier: {credentialNullifier.slice(0, 18)}...
                  </p>
                  <p style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", color: T.success, marginTop: 4 }}>
                    Not previously used
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
