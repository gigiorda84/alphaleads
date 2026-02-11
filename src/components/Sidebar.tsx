"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, List, Bookmark, Settings } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Nuova Ricerca", href: "/search/new", icon: Search },
  { label: "Le tue Ricerche", href: "/searches", icon: List },
  { label: "Templates", href: "/templates", icon: Bookmark },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar (>= 1024px): full 260px */}
      <aside
        className="hidden lg:flex flex-col sticky top-0 h-screen shrink-0"
        style={{
          width: 260,
          background: "var(--navy-800)",
          padding: "24px 16px",
        }}
      >
        <SidebarContent pathname={pathname} collapsed={false} />
      </aside>

      {/* Tablet sidebar (768-1023px): collapsed 60px, icons only */}
      <aside
        className="hidden md:flex lg:hidden flex-col sticky top-0 h-screen shrink-0"
        style={{
          width: 60,
          background: "var(--navy-800)",
          padding: "24px 6px",
        }}
      >
        <SidebarContent pathname={pathname} collapsed={true} />
      </aside>
    </>
  );
}

/** Reusable inner content for both full and collapsed modes */
function SidebarContent({
  pathname,
  collapsed,
}: {
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div
        className={`flex items-center ${collapsed ? "justify-center pb-5" : "gap-2.5 px-4 pb-7"}`}
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 24,
        }}
      >
        {/* Logo icon */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "linear-gradient(135deg, #F07B3F, #FFD460)",
          }}
        >
          <span className="text-white font-bold" style={{ fontSize: 16 }}>
            &alpha;
          </span>
        </div>
        {/* Logo text (hidden when collapsed) */}
        {!collapsed && (
          <span
            className="text-white font-bold"
            style={{ fontSize: 18, letterSpacing: "-0.02em" }}
          >
            Alphaleads
          </span>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              collapsed={collapsed}
            />
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: 12,
        }}
      >
        <NavItem
          href="/settings"
          label="Settings"
          icon={Settings}
          isActive={pathname === "/settings"}
          collapsed={collapsed}
        />
      </div>

      {/* User card */}
      <div
        className={`flex items-center ${collapsed ? "justify-center p-2" : "gap-3"} mt-4`}
        style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: 10,
          ...(!collapsed ? { padding: "14px 16px" } : {}),
        }}
      >
        {/* Avatar */}
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
        {/* User info (hidden when collapsed) */}
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span
              className="text-white font-bold truncate"
              style={{ fontSize: 13 }}
            >
              Utente
            </span>
            <span
              className="truncate"
              style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}
            >
              Piano Pro
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Single navigation item */
function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  isActive: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center ${
        collapsed ? "justify-center" : "gap-3"
      } rounded-lg transition-colors duration-150`}
      style={{
        padding: collapsed ? "10px" : "10px 16px",
        background: isActive ? "rgba(240,123,63,0.15)" : undefined,
        color: isActive ? "#F07B3F" : "rgba(255,255,255,0.65)",
        fontWeight: isActive ? 600 : 400,
        fontSize: 14,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
      {!collapsed && <span>{label}</span>}

      {/* Active indicator dot (right side) */}
      {isActive && !collapsed && (
        <span
          className="absolute right-3"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#F07B3F",
          }}
        />
      )}

      {/* Tooltip for collapsed sidebar */}
      {collapsed && (
        <span
          className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{
            background: "var(--navy-900)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            zIndex: 50,
          }}
        >
          {label}
        </span>
      )}
    </Link>
  );
}
