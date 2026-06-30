"use client";

import { motion, useReducedMotion } from "motion/react";
import { T } from "@/lib/tokens";

const STEPS = [
  {
    fw: "Noir",
    color: T.accent,
    title: "Generate a ZK Credential",
    body: "Proves balance, membership, and age without revealing the underlying values. Credential nullifier stored on-chain and reusable across flows.",
  },
  {
    fw: "RISC Zero + Noir",
    color: "#60a5fa",
    title: "Run Private Payroll",
    body: "Batch compliance validation off-chain via RISC Zero. Individual salary transfers shielded by Noir. Only the total is ever emitted publicly.",
  },
  {
    fw: "Circom + Groth16",
    color: "#c084fc",
    title: "Cast a Sealed Vote",
    body: "Your credential nullifier proves membership. A Circom Groth16 proof seals your vote choice. The tally publishes; individual votes never do.",
  },
];

export default function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section
      style={{
        borderTop: `1px solid ${T.border}`,
        padding: "80px 0",
      }}
    >
      <div style={{ maxWidth: 768, margin: "0 auto", padding: "0 24px" }}>
        {/* Eyebrow 2/3 */}
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
          How It Works
        </p>

        <h2
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            color: T.text,
            marginBottom: 56,
          }}
        >
          Three flows. Three ZK frameworks.
          <br />
          One shared identity layer.
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.fw}
              initial={reduce ? undefined : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{
                borderLeft: `2px solid ${T.accent}`,
                paddingLeft: 24,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-geist-mono), monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: step.color,
                }}
              >
                {step.fw}
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: T.text }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, maxWidth: "55ch" }}>
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
