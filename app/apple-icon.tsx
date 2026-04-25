import { ImageResponse } from "next/og";

// iOS home-screen icon. iOS expects 180×180; we keep the same trophy theme
// but on a slightly darker pitch tone so it pops on a light wallpaper too.
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
          background: "#00A3E0",
          fontSize: 130,
        }}
      >
        🏆
      </div>
    ),
    { ...size }
  );
}
