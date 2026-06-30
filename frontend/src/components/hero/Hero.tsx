"use client";

import { motion, useReducedMotion } from "motion/react";
import ZKConsole from "./ZKConsole";
import { T } from "@/lib/tokens";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

function FadeUp({
  delay = 0,
  children,
  style,
  className,
}: {
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className} style={style}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "0 24px",
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 48,
        minHeight: "100dvh",
        alignItems: "center",
        paddingTop: 64,
        paddingBottom: 80,
      }}
      className="lg:grid-cols-[1fr_480px]"
    >
      {/* Left: copy */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 560 }}>
        {/* Eyebrow 1/3 */}
        <FadeUp
          delay={0}
          style={{
            fontSize: 11,
            fontFamily: "var(--font-geist-mono), monospace",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: T.mutedLo,
          }}
        >
          Stellar Hacks 2026
        </FadeUp>

        <FadeUp delay={0.1}>
          <h1
            style={{
              fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              color: T.text,
            }}
          >
            Privacy-first finance{" "}
            <span style={{ color: T.accent }}>on Stellar.</span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.2}>
          <p
            style={{
              fontSize: 16,
              color: T.muted,
              lineHeight: 1.7,
              maxWidth: "55ch",
            }}
          >
            ZK credentials, private payroll, and sealed DAO votes. Verified
            on-chain by Soroban using Noir, RISC Zero, and Circom.
          </p>
        </FadeUp>

        <FadeUp
          delay={0.3}
          style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
        >
          <a
            href="#credentials"
            id="hero-run-demo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 20px",
              fontSize: 11,
              fontFamily: "var(--font-geist-mono), monospace",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              background: T.accent,
              color: T.bg,
              borderRadius: T.r,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = T.accentH)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = T.accent)}
          >
            Run Demo
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            id="hero-view-contracts"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 20px",
              fontSize: 11,
              fontFamily: "var(--font-geist-mono), monospace",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              border: `1px solid ${T.border}`,
              color: T.muted,
              borderRadius: T.r,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = T.muted;
              el.style.color = T.text;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = T.border;
              el.style.color = T.muted;
            }}
          >
            View Contracts
          </a>
        </FadeUp>
      </div>

      {/* Right: terminal */}
      <FadeUp delay={0.4} className="w-full">
        <ZKConsole lines={8} autoplay />

        {/* Proof stats */}
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            border: `1px solid ${T.border}`,
          }}
        >
          {[
            { label: "Frameworks", value: "3"       },
            { label: "Verifiers",  value: "4"       },
            { label: "Network",    value: "Testnet" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: "12px 16px",
                borderRight: i < 2 ? `1px solid ${T.border}` : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 18,
                  color: T.text,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </FadeUp>
    </section>
  );
}
