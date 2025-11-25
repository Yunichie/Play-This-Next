"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Library,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Gamepad2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, createContext, useContext, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebar();
  const [signingOut, setSigningOut] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();

      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    } finally {
      setSigningOut(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (sidebarRef.current) {
      const rect = sidebarRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col fixed inset-y-0 z-50 transition-all duration-500 ease-out",
        collapsed ? "md:w-20" : "md:w-72",
      )}
    >
      <motion.div
        ref={sidebarRef}
        initial={false}
        animate={{ width: collapsed ? 80 : 288 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col flex-1 min-h-0 relative overflow-hidden"
        onMouseMove={handleMouseMove}
        style={{ backgroundColor: "#0a0a0a" }}
      >
        {}
        <div
          className="absolute pointer-events-none transition-opacity duration-300"
          style={{
            width: "400px",
            height: "400px",
            left: mousePosition.x - 200,
            top: mousePosition.y - 200,
            background:
              "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
          }}
        />

        {}
        <div className="absolute inset-0 backdrop-blur-xl bg-black/20 border-r border-white/5" />

        {}
        <div className="relative z-10 flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between h-20 px-5 relative">
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="flex items-center gap-3"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center backdrop-blur-sm"
                  >
                    <Gamepad2
                      className="w-5 h-5 text-white/90"
                      strokeWidth={1.5}
                    />
                  </motion.div>
                  <div className="overflow-hidden">
                    <motion.h1
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-base font-light tracking-wide text-white/90"
                    >
                      Play This Next
                    </motion.h1>
                    <motion.p
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-xs font-light text-white/40"
                    >
                      AI Companion
                    </motion.p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors backdrop-blur-sm",
                collapsed && "mx-auto",
              )}
            >
              <motion.div
                animate={{ rotate: collapsed ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <ChevronLeft
                  className="w-4 h-4 text-white/60"
                  strokeWidth={1.5}
                />
              </motion.div>
            </motion.button>
          </div>

          {}
          <nav className="flex-1 px-3 py-8 space-y-2 overflow-y-auto">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                    title={collapsed ? item.label : undefined}
                  >
                    {}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 bg-white rounded-full"
                        style={{
                          boxShadow:
                            "0 0 30px rgba(255,255,255,0.3), 0 0 60px rgba(255,255,255,0.15)",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}

                    <div
                      className={cn(
                        "relative flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200",
                        isActive
                          ? "text-black font-medium"
                          : "text-white/30 hover:text-white/50",
                        collapsed && "justify-center px-0 w-14 h-14 mx-auto",
                      )}
                    >
                      {}
                      <motion.div
                        animate={{
                          scale: isActive ? 1 : 1,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                        }}
                      >
                        <Icon
                          className="flex-shrink-0 w-5 h-5"
                          strokeWidth={isActive ? 2 : 1.5}
                        />
                      </motion.div>

                      {}
                      <AnimatePresence mode="wait">
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 25,
                            }}
                            className="text-sm tracking-wide"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {}
          <div className="p-3 relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-white/5" />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignOut}
              disabled={signingOut}
              title={collapsed ? "Sign Out" : undefined}
              className={cn(
                "relative w-full text-white/30 hover:text-white/50 rounded-full transition-all group mt-4",
                collapsed
                  ? "justify-center w-14 h-14 mx-auto"
                  : "justify-start",
              )}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-full transition-colors duration-200" />

              <div
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3",
                  collapsed && "justify-center px-0",
                )}
              >
                <motion.div
                  animate={{ rotate: signingOut ? 360 : 0 }}
                  transition={{
                    duration: 1,
                    repeat: signingOut ? Infinity : 0,
                    ease: "linear",
                  }}
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                </motion.div>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-light tracking-wide"
                    >
                      {signingOut ? "Signing out..." : "Sign Out"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl"
      style={{ backgroundColor: "rgba(10,10,10,0.95)" }}
    >
      <div className="flex items-center justify-around h-16 px-2 border-t border-white/5">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-200 rounded-xl relative"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute inset-2 bg-white rounded-2xl"
                  style={{
                    boxShadow: "0 0 20px rgba(255,255,255,0.2)",
                  }}
                  transition={{
                    type: "spring",
                    bounce: 0.2,
                    duration: 0.6,
                  }}
                />
              )}
              <Icon
                className={cn(
                  "w-5 h-5 relative z-10 transition-all",
                  isActive ? "text-black scale-110" : "text-white/30",
                )}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span
                className={cn(
                  "text-xs font-light relative z-10 tracking-wide transition-all",
                  isActive ? "text-black" : "text-white/30",
                )}
              >
                {item.label}
              </span>
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
        "flex-1 pb-16 md:pb-0 overflow-y-auto transition-all duration-500",
        collapsed ? "md:pl-20" : "md:pl-72",
      )}
    >
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">{children}</div>
    </main>
  );
}
