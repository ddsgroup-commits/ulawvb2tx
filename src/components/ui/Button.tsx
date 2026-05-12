"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gold" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "gold" && "btn-gold",
        variant === "outline" && "btn-outline",
        variant === "danger" && "btn-danger",
        variant === "ghost" && "btn-ghost",
        size === "sm" && "btn-sm",
        size === "lg" && "btn-lg",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
