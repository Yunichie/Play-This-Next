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
  Gamepad2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/library", label: "Library", icon: Library },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-72 md:flex-col fixed inset-y-0 z-50">
      <div className="flex flex-col flex-1 min-h-0 glass border-r">
        {/* Logo */}
        <div className="flex items-center gap-3 h-20 px-8 border-b border-border/50">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center"
          >
            <Gamepad2 className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Play This Next
            </h1>
            <p className="text-xs text-muted-foreground">
              Your gaming companion
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>

                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-3 w-1.5 h-6 bg-primary-foreground rounded-full"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-border/50">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground transition-smooth"
            onClick={() => signOut()}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full space-y-1 relative"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex flex-col items-center transition-all",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    isActive && "bg-accent",
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium mt-1">{item.label}</span>
              </motion.div>

              {isActive && (
                <motion.div
                  layoutId="mobileActiveIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
