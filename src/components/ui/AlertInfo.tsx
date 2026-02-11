import React from "react";

interface AlertInfoProps {
  children: React.ReactNode;
}

export default function AlertInfo({ children }: AlertInfoProps) {
  return (
    <div
      className="rounded-lg px-[14px] py-[10px] text-[13px] leading-relaxed"
      style={{
        background: "var(--gold-50)",
        border: "1px solid var(--gold-500)",
        color: "#92400e",
      }}
    >
      {children}
    </div>
  );
}
