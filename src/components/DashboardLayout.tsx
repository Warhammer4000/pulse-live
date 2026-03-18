import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, Presentation, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Presentations", url: "/dashboard/presentations", icon: Presentation },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.display_name || user?.email || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen flex bg-[#080810] text-white">
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col shrink-0 border-r border-white/5 bg-[#080810] overflow-hidden"
      >
        <div className="flex h-16 items-center px-4 border-b border-white/5 shrink-0">
          <AnimatePresence mode="wait">
            {collapsed ? (
              <motion.span key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                P
              </motion.span>
            ) : (
              <motion.span key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                Pulse<span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Live</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.url === "/dashboard"}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all duration-150 whitespace-nowrap overflow-hidden",
                collapsed && "justify-center px-2"
              )}
              activeClassName="text-violet-400 bg-violet-500/10 hover:bg-violet-500/10 hover:text-violet-400"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 p-2 shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-violet-500/20 text-violet-300 text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5" onClick={signOut}>
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl p-2 hover:bg-white/5 transition-colors">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-violet-500/20 text-violet-300 text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-white/30 truncate">{user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-white/30 hover:text-white hover:bg-white/5" onClick={signOut}>
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[4.5rem] flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#080810] text-white/40 hover:text-white transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
