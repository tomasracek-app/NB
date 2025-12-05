"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Upload,
  Settings,
  TrendingUp,
  Package,
  UserCheck,
  Phone,
  LogOut,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: NavItem[];
  title: string;
}

export function Sidebar({ items, title }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-card border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <span className="font-semibold text-lg truncate">{title}</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(collapsed && "mx-auto")}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="border-t p-4">
        {!collapsed && session?.user && (
          <div className="mb-3 text-sm">
            <p className="font-medium truncate">{session.user.name || session.user.email}</p>
            <p className="text-muted-foreground text-xs truncate">
              {session.user.role === "ADMIN" ? "Administrátor" : session.user.clientName}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn("w-full justify-start gap-2", collapsed && "justify-center px-2")}
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Odhlásit se" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Odhlásit se</span>}
        </Button>
      </div>
    </aside>
  );
}

// Předdefinované navigační položky
export const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/clients", label: "Klienti", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/import", label: "Import dat", icon: <Upload className="h-4 w-4" /> },
  { href: "/admin/settings", label: "Nastavení", icon: <Settings className="h-4 w-4" /> },
];

export const clientNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/revenue", label: "Obraty", icon: <TrendingUp className="h-4 w-4" /> },
  { href: "/inventory", label: "Sklad", icon: <Package className="h-4 w-4" /> },
  { href: "/leads", label: "Leads", icon: <UserCheck className="h-4 w-4" /> },
  { href: "/telephony", label: "Telefonie", icon: <Phone className="h-4 w-4" /> },
];
