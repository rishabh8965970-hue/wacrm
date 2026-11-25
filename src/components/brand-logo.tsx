import { useId } from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
}

/**
 * Brand mark for ChatStack WhatsApp CRM: a layered chat-stack
 * speech bubble on an emerald-teal rounded squircle.
 */
export function BrandLogo({ className }: BrandLogoProps) {
  const gradId = useId();

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-8 w-8 shrink-0", className)}
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="4"
          y1="4"
          x2="36"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>

      <rect width="40" height="40" rx="10" fill={`url(#${gradId})`} />

      {/* Back stacked chat card */}
      <rect
        x="14"
        y="9"
        width="17"
        height="13"
        rx="4"
        fill="#FFFFFF"
        fillOpacity="0.32"
      />

      {/* Front primary WhatsApp-style speech bubble */}
      <path
        d="M11 14C11 12.3431 12.3431 11 14 11H26C27.6569 11 29 12.3431 29 14V23C29 24.6569 27.6569 26 26 26H16.2L11.8 29.6C11.4 29.93 11 29.65 11 29.15V14Z"
        fill="#FFFFFF"
      />

      {/* Crisp checkmark inside bubble */}
      <path
        d="M15.8 18.6L18.4 21.1L24.2 15.6"
        stroke="#059669"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
