"use client";

import React, { useState, useRef } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({
  value,
  onChange,
  placeholder = "Aggiungi...",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const tag = raw.trim();
    if (tag.length < 2) return;
    if (value.includes(tag)) return;
    onChange([...value, tag]);
    setInputValue("");
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value.length - 1);
    }
  }

  function handleContainerClick() {
    inputRef.current?.focus();
  }

  return (
    <div
      className="bg-white rounded-lg px-3 py-2 flex flex-wrap items-center gap-2 cursor-text"
      style={{
        minHeight: 42,
        border: isFocused
          ? "1.5px solid var(--orange-500)"
          : "1px solid var(--neutral-300)",
      }}
      onClick={handleContainerClick}
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
              removeTag(i);
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
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          if (inputValue.trim().length >= 2) {
            addTag(inputValue);
          }
        }}
        placeholder={value.length === 0 ? placeholder : ""}
      />
    </div>
  );
}
