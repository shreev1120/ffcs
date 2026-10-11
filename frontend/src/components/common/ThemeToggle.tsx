import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  variant?: "icon" | "button" | "pill";
  className?: string;
  showText?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "button",
  className = "",
  showText = true,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        className={`p-1.5 rounded transition-colors border ${
          isDark
            ? "bg-slate-800 text-amber-400 hover:bg-slate-700 border-slate-700"
            : "bg-white/10 text-white hover:bg-white/20 border-white/20"
        } ${className}`}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors border ${
          isDark
            ? "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700"
            : "bg-white/15 hover:bg-white/25 text-white border-white/30"
        } ${className}`}
      >
        {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-200" />}
        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs h-10 px-4 rounded ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-500 mr-2 shrink-0" />
      ) : (
        <Moon className="w-4 h-4 text-[#2455a3] dark:text-blue-400 mr-2 shrink-0" />
      )}
      {showText && <span>{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>}
    </Button>
  );
};

export default ThemeToggle;
