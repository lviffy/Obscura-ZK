"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { T } from "@/lib/tokens";

const STEPS = [
  { label: "noir",    text: "witness generation complete"                      },
  { label: "noir",    text: "constraint system satisfied (1,248 gates)"        },
  { label: "noir",    text: "UltraHonk proof generated — 2.8 kb"              },
  { label: "soroban", text: "broadcasting to testnet..."                       },
  { label: "soroban", text: "rs-soroban-ultrahonk: verification OK"            },
  { label: "soroban", text: "nullifier stored on-chain: 0x7f3a...c21b"         },
  { label: "system",  text: "credential issued successfully"                   },
  { label: "risc0",   text: "guest program executing..."                       },
  { label: "risc0",   text: "budget constraint satisfied: 8,200 XLM"          },
  { label: "risc0",   text: "STARK receipt generated"                          },
  { label: "circom",  text: "witness computation complete"                     },
  { label: "circom",  text: "Groth16 proof size: 256 bytes"                   },
  { label: "soroban", text: "private_governance: vote recorded"                },
  { label: "system",  text: "nullifier 0x7f3a...c21b: not previously used"     },
];

const LABEL_HEX: Record<string, string> = {
  noir:    T.accent,
  risc0:   "#60a5fa",
  circom:  "#c084fc",
  soroban: T.success,
  system:  T.mutedLo,
};

interface ZKConsoleProps {
  lines?: number;
  autoplay?: boolean;
}

export default function ZKConsole({ lines = 8, autoplay = true }: ZKConsoleProps) {
  const reduce = useReducedMotion();
  const [displayed, setDisplayed] = useState<typeof STEPS>([]);
  const [cursor, setCursor] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce || !autoplay) {
      setDisplayed(STEPS.slice(0, lines));
      return;
    }
    const interval = setInterval(() => {
      setDisplayed((prev) => [...prev, STEPS[cursor % STEPS.length]].slice(-lines));
      setCursor((c) => c + 1);
    }, 900);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, autoplay, lines, cursor]);

  useEffect(() => {
    if (containerRef.current)
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [displayed]);

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        overflow: "hidden",
      }}
    >
      {/* top accent line */}
      <div style={{ height: 2, background: T.accent }} />

      {/* terminal header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: T.border, display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: T.border, display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: T.border, display: "inline-block" }} />
        <span
          style={{
            marginLeft: 12,
            fontSize: 11,
            fontFamily: "var(--font-geist-mono), monospace",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: T.mutedLo,
          }}
        >
          ZK Console
        </span>
      </div>

      {/* log lines */}
      <div
        ref={containerRef}
        style={{
          padding: "16px",
          height: 260,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 12,
        }}
      >
        {displayed.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span
              style={{
                flexShrink: 0,
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: LABEL_HEX[step.label] ?? T.muted,
              }}
            >
              [{step.label}]
            </span>
            <span style={{ color: T.mono }}>{step.text}</span>
          </div>
        ))}

        {!reduce && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: T.accent }}>
              [sys]
            </span>
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 12,
                background: T.accent,
                animation: "pulse 1s ease-in-out infinite",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
