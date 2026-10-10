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
  hover,
  glow,
  ...rest
}: GlassCardProps) => {
  return (
    <div
      {...rest}
      className={cn(
        "bg-white border border-border shadow-card rounded p-6 text-foreground",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
