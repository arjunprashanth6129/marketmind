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
          background: "#0b0f18",
          padding: "72px",
          color: "#e8edf7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              border: "1px solid #2a3651",
              background: "#161f30",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 17.5 9 11l3.5 3.5L20 6"
                stroke="#4d8dff"
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
          <div style={{ fontSize: 28, color: "#9aa8c0", maxWidth: 900 }}>
            Verified NSE data · 100 stocks · dual scoring vs the Nifty 50 &amp; scenario fundamentals
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 40,
            fontSize: 24,
            color: "#7c8aa4",
            borderTop: "1px solid #1c2537",
            paddingTop: 28,
          }}
        >
          <span>Next.js · TypeScript</span>
          <span>Python data pipeline</span>
          <span>Vercel</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
