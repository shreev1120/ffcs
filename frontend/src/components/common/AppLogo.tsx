import React from "react";
import { Link } from "react-router-dom";

interface AppLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textVariant?: "white" | "dark";
  showBadge?: boolean;
  subtitle?: string;
  className?: string;
  linkTo?: string;
}

export const LogoIcon: React.FC<{ className?: string; size?: number }> = ({
  className = "w-9 h-9",
}) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 128 128"
        className="w-full h-full drop-shadow-sm select-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* VIT Institutional Royal Navy Gradient */}
          <linearGradient id="appLogoNavy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="45%" stopColor="#1b4b8a" />
            <stop offset="100%" stopColor="#0f2552" />
          </linearGradient>

          {/* Academic Imperial Gold Gradient */}
          <linearGradient id="appLogoGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Morning Slot Gradient (Sky to Azure) */}
          <linearGradient id="appLogoMorning" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Evening Slot Gradient (Warm Amber to Orange) */}
          <linearGradient id="appLogoEvening" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>

        {/* Outer Collegiate Shield Base */}
        <path
          d="M 64 6 
             C 90 6, 114 12, 116 28
             C 116 70, 92 102, 64 122
             C 36 102, 12 70, 12 28
             C 14 12, 38 6, 64 6 Z"
          fill="url(#appLogoNavy)"
          stroke="url(#appLogoGold)"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />

        {/* Inner Filigree Rim */}
        <path
          d="M 64 14 
             C 85 14, 106 19, 108 32
             C 108 67, 87 96, 64 113
             C 41 96, 20 67, 20 32
             C 22 19, 43 14, 64 14 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.25"
          strokeOpacity="0.3"
        />

        {/* Academic Torch of Knowledge at Apex */}
        <g transform="translate(64, 27)">
          <path
            d="M 0 -11 C 3.5 -6, 5 -2.5, 3.2 1.5 C 1.5 3.5, -1.5 3.5, -3.2 1.5 C -5 -2.5, -3.5 -6, 0 -11 Z"
            fill="url(#appLogoGold)"
          />
          <path
            d="M 0 -7 C 1.5 -4, 2 -2, 1 0.5 C 0 1.5, -1 1.5, -1.5 0.5 C -2 -2, -1.5 -4, 0 -7 Z"
            fill="#fef08a"
          />
          <path d="M -6 1.5 L 6 1.5 L 4 5 L -4 5 Z" fill="#ffffff" />
          <path d="M -2.5 5 L 2.5 5 L 1.5 10 L -1.5 10 Z" fill="url(#appLogoGold)" />
        </g>

        {/* Central Clash-Free Timetable Slot Matrix */}
        <g transform="translate(36, 42)">
          <rect
            x="0"
            y="0"
            width="56"
            height="52"
            rx="7"
            fill="#0c1d3b"
            fillOpacity="0.6"
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.2"
          />

          {/* Slot A1 (Morning Theory) */}
          <rect x="4.5" y="4.5" width="21" height="20" rx="4" fill="url(#appLogoMorning)" />
          <text
            x="15"
            y="18"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="10.5"
            fontWeight="900"
            fill="#ffffff"
            textAnchor="middle"
            letterSpacing="-0.5"
          >
            A1
          </text>

          {/* Slot A2 (Evening Theory) */}
          <rect x="30.5" y="4.5" width="21" height="20" rx="4" fill="url(#appLogoEvening)" />
          <text
            x="41"
            y="18"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="10.5"
            fontWeight="900"
            fill="#ffffff"
            textAnchor="middle"
            letterSpacing="-0.5"
          >
            A2
          </text>

          {/* Slot L31 (Morning Labs) */}
          <rect x="4.5" y="28" width="21" height="20" rx="4" fill="url(#appLogoEvening)" />
          <text
            x="15"
            y="41.5"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="9"
            fontWeight="900"
            fill="#ffffff"
            textAnchor="middle"
          >
            L31
          </text>

          {/* Slot L1 (Evening Labs) */}
          <rect x="30.5" y="28" width="21" height="20" rx="4" fill="url(#appLogoMorning)" />
          <text
            x="41"
            y="41.5"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="9.5"
            fontWeight="900"
            fill="#ffffff"
            textAnchor="middle"
          >
            L1
          </text>
        </g>

        {/* FFCS Banner */}
        <g transform="translate(64, 107)">
          <rect
            x="-35"
            y="-8.5"
            width="70"
            height="16"
            rx="3.5"
            fill="#ffffff"
            stroke="url(#appLogoGold)"
            strokeWidth="1.8"
          />
          <text
            x="0"
            y="3.5"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="9"
            fontWeight="900"
            fill="#1b4b8a"
            textAnchor="middle"
            letterSpacing="1.5"
          >
            FFCS
          </text>
        </g>
      </svg>
    </div>
  );
};

const AppLogo: React.FC<AppLogoProps> = ({
  size = "md",
  showText = true,
  textVariant = "white",
  showBadge = true,
  subtitle,
  className = "",
  linkTo = "/dashboard",
}) => {
  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  const isWhite = textVariant === "white";

  const content = (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <LogoIcon className={sizeClasses[size]} />

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span
              className={`font-serif font-black tracking-wider ${
                size === "sm" ? "text-lg" : size === "xl" ? "text-2xl" : "text-xl"
              } ${isWhite ? "text-white" : "text-[#1b4b8a]"}`}
            >
              VIT
            </span>
            <span
              className={`text-xs font-semibold ${
                isWhite ? "text-white/90" : "text-slate-600"
              }`}
            >
              (Vellore Campus)
            </span>
            {showBadge && (
              <span
                className={`hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${
                  isWhite
                    ? "bg-white/15 text-amber-300 border-white/20"
                    : "bg-blue-50 text-[#1b4b8a] border-blue-200"
                }`}
              >
                VTOP FFCS
              </span>
            )}
          </div>
          {subtitle && (
            <p
              className={`text-[11px] leading-tight ${
                isWhite ? "text-white/80" : "text-slate-500"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded">
        {content}
      </Link>
    );
  }

  return content;
};

export default AppLogo;
