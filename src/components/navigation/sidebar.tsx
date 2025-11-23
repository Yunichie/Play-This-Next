"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Library,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useState, createContext, useContext } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/library", label: "Library", icon: Library },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const SidebarContext = createContext<{
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}>({
  collapsed: false,
  setCollapsed: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col fixed inset-y-0 z-50 transition-all duration-300",
        collapsed ? "md:w-20" : "md:w-64",
      )}
    >
      <div className="flex flex-col flex-1 min-h-0 bg-card border-r border-border">
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          {!collapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Play This Next
            </h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("ml-auto", collapsed && "mx-auto")}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative"
                  title={collapsed ? item.label : undefined}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      collapsed && "justify-center",
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute inset-0 bg-primary rounded-lg -z-10"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            className={cn(
              "w-full text-muted-foreground",
              collapsed ? "justify-center px-0" : "justify-start",
            )}
            onClick={() => signOut()}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <main
      className={cn(
        "flex-1 pb-16 md:pb-0 overflow-y-auto transition-all duration-300",
        collapsed ? "md:pl-20" : "md:pl-64",
      )}
    >
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">{children}</div>
    </main>
  );
}
