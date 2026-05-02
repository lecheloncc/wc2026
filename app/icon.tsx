import { ImageResponse } from "next/og";

const IS_WERK = process.env.NEXT_PUBLIC_INSTANCE_THEME === "werk";
const BG = IS_WERK ? "#16A34A" : "#00A3E0";

// PWA / favicon — sky-blue (or green for the work instance) rounded square
// with a trophy emoji centered. Generated at request time by Next so we
// don't need static image assets.
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
          background: BG,
          fontSize: 360,
        }}
      >
        🏆
      </div>
    ),
    { ...size }
  );
}
