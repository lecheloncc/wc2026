import { ImageResponse } from "next/og";

const IS_WERK = process.env.NEXT_PUBLIC_INSTANCE_THEME === "werk";
const BG = IS_WERK ? "#16A34A" : "#00A3E0";

// iOS home-screen icon. iOS expects 180×180; we keep the same trophy theme
// but on the instance accent (blue family / green work).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
          fontSize: 130,
        }}
      >
        🏆
      </div>
    ),
    { ...size }
  );
}
