"use client";

import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "glass";
type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-gradient hover:bg-primary-gradient-hover text-white shadow-glow-sm hover:shadow-glow border border-primary-light/30 focus:ring-primary/50",
  secondary:
    "bg-surface hover:bg-hover text-text border border-border hover:border-border-hover focus:ring-primary/30",
  glass:
    "glass-panel hover:bg-hover/80 text-text border border-border hover:border-primary/40 focus:ring-primary/30",
  outline:
    "bg-transparent hover:bg-surface text-text border border-border hover:border-primary/40 focus:ring-primary/30",
  ghost:
    "bg-transparent hover:bg-surface text-text-muted hover:text-text focus:ring-primary/20",
  danger:
    "bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 hover:border-danger/40 focus:ring-danger/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "px-2.5 py-1 text-xs rounded-lg gap-1.5 font-medium",
  sm: "px-3.5 py-1.5 text-xs rounded-xl gap-2 font-semibold",
  md: "px-4 py-2 text-sm rounded-xl gap-2 font-semibold",
  lg: "px-6 py-3 text-base rounded-2xl gap-2.5 font-bold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.01 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center select-none transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
