"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Search, List, Bookmark, Settings } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Nuova Ricerca", href: "/search/new", icon: Search },
  { label: "Le tue Ricerche", href: "/searches", icon: List },
  { label: "Templates", href: "/templates", icon: Bookmark },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      {/* Top bar */}
      <header
        className="flex items-center justify-between shrink-0"
        style={{
          height: 56,
          background: "var(--navy-800)",
          padding: "0 16px",
        }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center cursor-pointer"
          style={{ color: "rgba(255,255,255,0.8)" }}
          aria-label={open ? "Chiudi menu" : "Apri menu"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "linear-gradient(135deg, #F07B3F, #FFD460)",
            }}
          >
            <span className="text-white font-bold" style={{ fontSize: 13 }}>
              &alpha;
            </span>
          </div>
          <span
            className="text-white font-bold"
            style={{ fontSize: 16, letterSpacing: "-0.02em" }}
          >
            Alphaleads
          </span>
        </div>

        {/* User avatar */}
        <div
          className="flex items-center justify-center"
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f49565, #FFD460)",
          }}
        >
          <span className="text-white font-bold" style={{ fontSize: 12 }}>
            U
          </span>
        </div>
      </header>

      {/* Mobile slide-down menu */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            style={{ background: "rgba(0,0,0,0.4)", zIndex: 40 }}
            onClick={() => setOpen(false)}
          />

          {/* Menu panel */}
          <nav
            className="fixed left-0 right-0 flex flex-col gap-1"
            style={{
              top: 56,
              background: "var(--navy-800)",
              padding: "12px 16px 20px",
              zIndex: 50,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg transition-colors duration-150"
                  style={{
                    padding: "10px 16px",
                    background: isActive
                      ? "rgba(240,123,63,0.15)"
                      : undefined,
                    color: isActive ? "#F07B3F" : "rgba(255,255,255,0.65)",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 14,
                  }}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* User card */}
            <div
              className="flex items-center gap-3 mt-3"
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f49565, #FFD460)",
                }}
              >
                <span
                  className="text-white font-bold"
                  style={{ fontSize: 13 }}
                >
                  U
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-white font-bold"
                  style={{ fontSize: 13 }}
                >
                  Utente
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  Piano Pro
                </span>
              </div>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
