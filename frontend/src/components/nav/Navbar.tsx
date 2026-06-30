"use client";

import { useState } from "react";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react";

// Hardcoded tokens - Tailwind v4 arbitrary var() needs @theme registration
const T = {
  bg: "#09090b",
  surface: "#18181b",
  border: "#27272a",
  text: "#fafafa",
  muted: "#a1a1aa",
  accent: "#e5ff47",
  accentH: "#d4ee36",
};

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#credentials", label: "Credentials" },
    { href: "#payroll",     label: "Payroll"      },
    { href: "#voting",      label: "Voting"        },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: T.bg,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <svg width="18" height="22" viewBox="0 0 20 24" fill="none">
              <path
                d="M10 0L20 5V13C20 18.523 15.523 23 10 23C4.477 23 0 18.523 0 13V5L10 0Z"
                fill={T.accent}
              />
              <path
                d="M10 6L14 8.5V12.5C14 15.261 12.209 17.5 10 17.5C7.791 17.5 6 15.261 6 12.5V8.5L10 6Z"
                fill={T.bg}
              />
            </svg>
            <span
              className="text-sm font-semibold tracking-tight"
              style={{ color: T.text }}
            >
              Stellar Shield
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm transition-colors duration-150"
                style={{ color: T.muted }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-4">
            <a
              href="#credentials"
              id="nav-connect-wallet"
              className="hidden md:inline-flex items-center px-4 py-2 text-[11px] font-mono uppercase tracking-widest transition-all duration-150 active:scale-[0.98]"
              style={{
                backgroundColor: T.accent,
                color: T.bg,
                borderRadius: "2px",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = T.accentH)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = T.accent)
              }
            >
              Connect Wallet
            </a>
            <button
              onClick={() => setOpen((p) => !p)}
              className="md:hidden transition-colors"
              style={{ color: T.muted }}
              aria-label="Toggle menu"
            >
              {open ? <X size={20} /> : <List size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-40 pt-[68px] flex flex-col px-6 py-8 gap-6 md:hidden"
          style={{ backgroundColor: T.bg }}
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-xl transition-colors"
              style={{ color: T.muted }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#credentials"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex items-center px-4 py-3 text-xs font-mono uppercase tracking-widest w-fit"
            style={{ backgroundColor: T.accent, color: T.bg, borderRadius: "2px" }}
          >
            Connect Wallet
          </a>
        </div>
      )}
    </>
  );
}
