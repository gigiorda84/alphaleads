import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "default";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}

export default function Button({
  variant = "primary",
  size = "default",
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const sizeClasses =
    size === "sm"
      ? "px-4 py-[9px] rounded-lg text-[13px]"
      : "px-6 py-[11px] rounded-[10px] text-sm";

  const variantStyles: Record<ButtonVariant, string> = {
    primary: "text-white font-semibold hover:brightness-105",
    secondary:
      "bg-transparent text-navy-800 font-semibold hover:bg-navy-50",
    ghost:
      "bg-transparent text-neutral-600 font-semibold hover:bg-neutral-50",
  };

  const variantInline: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, var(--orange-600), var(--orange-700))",
      boxShadow: "0 2px 12px rgba(240,123,63,0.25)",
    },
    secondary: {
      border: "1.5px solid var(--navy-700)",
    },
    ghost: {
      border: "1.5px solid var(--neutral-300)",
    },
  };

  return (
    <button
      className={`inline-flex items-center justify-center cursor-pointer transition-all duration-150 font-sans ${sizeClasses} ${variantStyles[variant]} ${className}`}
      style={variantInline[variant]}
      {...rest}
    >
      {children}
    </button>
  );
}
