import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

const GlassCard = ({
  children,
  className,
  hover = true,
  glow = false,
  ...rest
}: GlassCardProps) => {
  return (
    <div
      {...rest}
      className={cn(
        "glass-card p-6",
        hover && "hover:translate-y-[-4px] hover:shadow-glass-lg",
        glow && "shadow-glow",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
