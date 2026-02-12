"use client";

import React, { useState, useRef, useEffect } from "react";

interface SearchableSelectProps {
  options: string[];
  value: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Cerca e seleziona...",
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter(
    (opt) => !value.includes(opt) && opt.toLowerCase().includes(query.toLowerCase())
  );

  function select(option: string) {
    onChange([...value, option]);
    setQuery("");
    inputRef.current?.focus();
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Input area */}
      <div
        className="bg-white rounded-lg px-3 py-2 flex flex-wrap items-center gap-2 cursor-text"
        style={{
          minHeight: 42,
          border: isOpen
            ? "1.5px solid var(--orange-500)"
            : "1px solid var(--neutral-300)",
        }}
        onClick={() => {
          inputRef.current?.focus();
          setIsOpen(true);
        }}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 bg-navy-100 rounded-md px-[10px] py-[3px] text-[13px] font-medium text-navy-800"
          >
            {tag}
            <button
              type="button"
              className="text-neutral-400 hover:text-neutral-600 ml-0.5 cursor-pointer leading-none text-sm"
              onClick={(e) => {
                e.stopPropagation();
                remove(i);
              }}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[80px] outline-none border-none bg-transparent text-[13px] text-neutral-800 placeholder:text-neutral-400"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && query === "" && value.length > 0) {
              remove(value.length - 1);
            }
            if (e.key === "Enter" && filtered.length > 0) {
              e.preventDefault();
              select(filtered[0]);
            }
            if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder={value.length === 0 ? placeholder : ""}
        />
      </div>

      {/* Dropdown */}
      {isOpen && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            maxHeight: 220,
            overflowY: "auto",
            background: "white",
            border: "1px solid var(--neutral-300)",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            zIndex: 50,
          }}
        >
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              className="w-full text-left px-3 py-2 text-[13px] text-neutral-700 hover:bg-orange-50 hover:text-orange-700 cursor-pointer transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                select(opt);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
