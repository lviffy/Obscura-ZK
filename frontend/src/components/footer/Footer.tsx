import { T } from "@/lib/tokens";

const LINKS = [
  { label: "GitHub",          href: "https://github.com"                              },
  { label: "TRD",             href: "/TRD.md"                                         },
  { label: "ADR",             href: "/ADR.md"                                         },
  { label: "Stellar Testnet", href: "https://stellar.org/developers/guides/concepts/testnet" },
];

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: `1px solid ${T.border}`,
        padding: "48px 0",
        marginTop: "auto",
      }}
    >
      <div
        style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="16" height="20" viewBox="0 0 20 24" fill="none">
              <path d="M10 0L20 5V13C20 18.523 15.523 23 10 23C4.477 23 0 18.523 0 13V5L10 0Z" fill={T.accent} />
              <path d="M10 6L14 8.5V12.5C14 15.261 12.209 17.5 10 17.5C7.791 17.5 6 15.261 6 12.5V8.5L10 6Z" fill={T.bg} />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Stellar Shield</span>
          </div>
          <p style={{ fontSize: 14, color: T.muted, maxWidth: 320, lineHeight: 1.6 }}>
            Built for Stellar Hacks: Real-World ZK. Privacy-first finance and
            governance on Stellar Soroban.
          </p>
          <p style={{ fontSize: 12, fontFamily: "var(--font-geist-mono), monospace", color: T.border, marginTop: 8 }}>
            &copy; 2026 Stellar Shield. Open source.
          </p>
        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }} className="md:items-end">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 14, color: T.muted, textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
