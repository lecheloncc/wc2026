import { ImageResponse } from "next/og";

// PWA / favicon — sky-blue rounded square with a trophy emoji centered.
// Generated at request time by Next so we don't need static image assets.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 360,
        }}
      >
        🏆
      </div>
    ),
    { ...size }
  );
}
