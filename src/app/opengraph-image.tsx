import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";
export const alt = "IPTV - Live TV & Streaming";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const fontData = await fs.readFile(
    path.join(process.cwd(), "public/fonts/Orbitron-Black.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
          background: "linear-gradient(135deg, #09060e 0%, #150927 50%, #030014 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle Ambient Radial Glows */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            right: "-100px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(0, 0, 0, 0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(0, 0, 0, 0) 70%)",
          }}
        />

        {/* Top Header Bar with exact Brand Logo & Orbitron Font */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            {/* Exact TV Icon Box */}
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "#18181b",
                border: "1px solid #27272a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(147, 51, 234, 0.35)",
              }}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#c084fc"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="15" rx="2" />
                <polyline points="17 2 12 7 7 2" />
              </svg>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontFamily: "Orbitron",
                  fontSize: "32px",
                  fontWeight: "900",
                  letterSpacing: "3px",
                  color: "#ffffff",
                }}
              >
                IPTV
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "800",
                  letterSpacing: "1.5px",
                  color: "#c084fc",
                }}
              >
                LIVE
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 20px",
              borderRadius: "999px",
              background: "rgba(220, 38, 38, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#ef4444",
              }}
            />
            <span
              style={{
                fontSize: "15px",
                fontWeight: "800",
                color: "#f87171",
                letterSpacing: "1px",
              }}
            >
              LIVE STREAMING
            </span>
          </div>
        </div>

        {/* Center Hero Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: "950px",
          }}
        >
          <div
            style={{
              fontSize: "58px",
              fontWeight: "900",
              letterSpacing: "-1.5px",
              lineHeight: "1.08",
              background: "linear-gradient(to right, #ffffff 0%, #f3e8ff 60%, #c084fc 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Live TV & Global Streaming
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#a1a1aa",
              lineHeight: "1.4",
              fontWeight: "400",
              maxWidth: "800px",
            }}
          >
            Watch worldwide sports, news, cinema, and documentaries online in HD quality.
          </div>

          {/* Feature Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "8px",
            }}
          >
            {["8,000+ Worldwide Channels", "Adaptive HLS Engine", "Custom M3U Import", "No Sign Up"].map(
              (badge) => (
                <div
                  key={badge}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(168, 85, 247, 0.25)",
                    color: "#e9d5ff",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {badge}
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "22px",
            color: "#71717a",
            fontSize: "18px",
          }}
        >
          <span>Modern Web & Smart TV Streaming Progressive Web App</span>
          <span style={{ color: "#c084fc", fontWeight: "600" }}>iptv.usama.dev</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Orbitron",
          data: fontData,
          style: "normal",
          weight: 900,
        },
      ],
    }
  );
}
