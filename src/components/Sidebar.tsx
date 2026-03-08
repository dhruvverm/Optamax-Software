"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Receipt,
  TrendingUp,
  Users,
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/sales", label: "Sales", icon: TrendingUp },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/reports", label: "Reports", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const navLinks = (
    <>
      {nav.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              active
                ? "bg-accent text-accent-fg"
                : "text-muted-fg hover:text-foreground hover:bg-muted",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} strokeWidth={1.8} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-card border border-border shadow-sm text-foreground hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Spacer so main content doesn't sit under the fixed sidebar on desktop */}
      <div
        className={cn(
          "hidden md:block shrink-0 transition-[width] duration-200",
          collapsed ? "w-16" : "w-56"
        )}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "h-screen border-r border-border bg-card flex flex-col transition-all duration-200 z-50",
          "fixed top-0 left-0",
          "w-64 md:w-56",
          mobileOpen ? "flex" : "hidden md:flex",
          collapsed && "md:w-16"
        )}
      >
        <div className={cn("h-14 flex items-center border-b border-border px-4 shrink-0", collapsed && "md:justify-center")}>
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight">SideView</span>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden ml-auto p-2 rounded hover:bg-muted text-muted-fg"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "hidden md:flex p-1 rounded hover:bg-muted text-muted-fg transition-colors",
              !collapsed && "ml-auto"
            )}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navLinks}
        </nav>

        <div className={cn("p-4 border-t border-border shrink-0", collapsed && "md:p-2")}>
          {!collapsed && (
            <p className="text-xs text-muted-fg">Business Manager</p>
          )}
        </div>
      </aside>
    </>
  );
}
