import { ImageResponse } from "next/og";
import { PROJECT } from "@/lib/stats";

export const alt = `${PROJECT.name} - ${PROJECT.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Dynamically-generated social preview card (shown when the URL is shared).
export default function Og() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0b1120 0%, #111a2e 55%, #1e1b4b 100%)",
          padding: "72px",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg,#6366f1,#22d3ee)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 800,
              color: "#0b1120",
            }}
          >
            ₹
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
            {PROJECT.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 980,
            }}
          >
            A backtesting simulator that teaches fundamental analysis.
          </div>
          <div style={{ fontSize: 28, color: "#94a3b8", maxWidth: 900 }}>
            Verified NSE data · 50 stocks · dual scoring vs the Nifty 50 &amp; scenario fundamentals
          </div>
        </div>

        <div style={{ display: "flex", gap: 40, fontSize: 24, color: "#cbd5e1" }}>
          <span>Next.js · TypeScript</span>
          <span>Python data pipeline</span>
          <span>Vercel</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
