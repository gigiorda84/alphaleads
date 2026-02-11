import React from "react";

type BadgeVariant = "success" | "warning" | "error" | "info";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  success: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },
  warning: {
    background: "var(--gold-100)",
    color: "#92400e",
    border: "1px solid var(--gold-500)",
  },
  error: {
    background: "var(--coral-100)",
    color: "var(--coral-700)",
    border: "1px solid var(--coral-500)",
  },
  info: {
    background: "var(--navy-100)",
    color: "var(--navy-800)",
    border: "1px solid var(--navy-700)",
  },
};

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-full px-[10px] py-[2px] text-xs font-semibold tracking-[0.02em]"
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
}
