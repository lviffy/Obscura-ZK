import { T } from "@/lib/tokens";

const STACK = [
  {
    fw: "Noir",
    color: T.accent,
    desc: "Credential proofs, balance gates, membership circuits.",
    verifier: "rs-soroban-ultrahonk",
  },
  {
    fw: "RISC Zero",
    color: "#60a5fa",
    desc: "Batch computation, compliance rules, off-chain validation.",
    verifier: "stellar-risc0-verifier",
  },
  {
    fw: "Circom",
    color: "#c084fc",
    desc: "Groth16 per-vote sealed proofs, double-vote prevention.",
    verifier: "Official Groth16 Soroban",
  },
];

export default function TechStack() {
  return (
    <section style={{ borderTop: `1px solid ${T.border}`, padding: "80px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        {/* Eyebrow 3/3 */}
        <p
          style={{
            fontSize: 11,
            fontFamily: "var(--font-geist-mono), monospace",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: T.mutedLo,
            marginBottom: 24,
          }}
        >
          Under The Hood
        </p>

        <h2
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: T.text,
            marginBottom: 56,
            maxWidth: 560,
          }}
        >
          Three frameworks. Each matched to its optimal use case.
        </h2>

        {/* gap-px hairline grid */}
        <div
          style={{ display: "grid", gap: 1, background: T.border }}
          className="grid-cols-1 md:grid-cols-3"
        >
          {STACK.map((item) => (
            <div
              key={item.fw}
              style={{
                background: T.bg,
                padding: "40px 32px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 18,
                  fontWeight: 600,
                  color: item.color,
                }}
              >
                {item.fw}
              </span>
              <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7 }}>
                {item.desc}
              </p>
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 11,
                  color: T.border,
                  marginTop: "auto",
                  paddingTop: 16,
                }}
              >
                {item.verifier}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
