import React from "react";

interface FormSectionProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

export default function FormSection({ number, title, children }: FormSectionProps) {
  return (
    <div
      className="bg-white rounded-xl border border-neutral-200 p-6"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center gap-3 mb-5">
        <span className="w-6 h-6 rounded-md bg-navy-100 text-navy-800 text-xs font-bold flex items-center justify-center">
          {number}
        </span>
        <h3 className="text-[15px] font-bold text-navy-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}
