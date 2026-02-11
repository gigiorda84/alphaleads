import React from "react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
}

export default function StatCard({ icon, label, value, trend }: StatCardProps) {
  return (
    <div
      className="bg-white border border-neutral-200 rounded-xl px-6 py-5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-navy-100 flex items-center justify-center text-navy-800">
            {icon}
          </div>
          <div>
            <p className="text-[13px] text-neutral-500 mb-1">{label}</p>
            <p
              className="text-[28px] font-bold text-navy-800"
              style={{ letterSpacing: "-0.02em" }}
            >
              {value}
            </p>
          </div>
        </div>
        {trend && (
          <span
            className="text-xs font-semibold mt-1"
            style={{ color: "#16a34a" }}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
