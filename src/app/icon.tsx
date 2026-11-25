import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
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
          background: "linear-gradient(135deg, #10b981 0%, #0d9488 100%)",
          borderRadius: 8,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="8.5"
            y="4"
            width="11"
            height="8.5"
            rx="2.5"
            fill="#ffffff"
            fillOpacity="0.35"
          />
          <path
            d="M5.5 7.5C5.5 6.4 6.4 5.5 7.5 5.5H16.5C17.6 5.5 18.5 6.4 18.5 7.5V14.5C18.5 15.6 17.6 16.5 16.5 16.5H9.3L6 19.2C5.7 19.45 5.5 19.25 5.5 18.9V7.5Z"
            fill="#ffffff"
          />
          <path
            d="M9 11.2L10.8 13L15 9"
            stroke="#059669"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
