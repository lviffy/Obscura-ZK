import { T } from "@/lib/tokens";

const LOGOS = [
  { name: "Stellar",   abbr: "STR",  href: "https://stellar.org"                },
  { name: "Soroban",   abbr: "SRB",  href: "https://soroban.stellar.org"        },
  { name: "Noir",      abbr: "NOIR", href: "https://noir-lang.org"              },
  { name: "RISC Zero", abbr: "R0",   href: "https://risczero.com"               },
  { name: "Circom",    abbr: "CRM",  href: "https://docs.circom.io"             },
  { name: "Rust",      abbr: "RS",   href: "https://rust-lang.org"              },
];

export default function TrustStrip() {
  return (
    <section style={{ borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "28px 24px",
          display: "flex",
          alignItems: "center",
          gap: 32,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--font-geist-mono), monospace",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: T.border,
            flexShrink: 0,
          }}
        >
          Built with
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          {LOGOS.map((logo) => (
            <a
              key={logo.name}
              href={logo.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={logo.name}
              style={{
                fontSize: 12,
                fontFamily: "var(--font-geist-mono), monospace",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: T.border,
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = T.mutedLo)}
              onMouseLeave={(e) => (e.currentTarget.style.color = T.border)}
            >
              {logo.abbr}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
