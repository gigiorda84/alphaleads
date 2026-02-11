"use client";

import React from "react";

interface ChipSelectProps {
  options: string[];
  value: string[];
  onChange: (selected: string[]) => void;
}

export default function ChipSelect({ options, value, onChange }: ChipSelectProps) {
  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`px-[14px] py-[6px] rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-150 ${
              selected
                ? "bg-orange-50 text-orange-700"
                : "bg-white text-neutral-600"
            }`}
            style={{
              border: selected
                ? "1.5px solid var(--orange-600)"
                : "1.5px solid var(--neutral-300)",
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
