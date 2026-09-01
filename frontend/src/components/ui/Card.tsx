import { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "bordered" | "gradient";
  glow?: boolean;
}

export function Card({
  className = "",
  variant = "glass",
  glow = false,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-card border border-border shadow-card",
    glass: "glass-card",
    bordered: "bg-surface/50 border border-border/80 hover:border-border",
    gradient:
      "bg-gradient-to-b from-card to-surface/80 border border-border shadow-card",
  };

  return (
    <div
      className={`rounded-2xl p-5 ${variantStyles[variant]} ${glow ? "shadow-glow" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
