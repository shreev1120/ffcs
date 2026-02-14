import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  LogOut,
  User,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const sidebarItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard Home",
    href: "/dashboard",
  },
  {
    icon: Calendar,
    label: "Timetable Generator",
    href: "/upload",
  },
  {
    icon: GraduationCap,
    label: "My Schedules",
    href: "/results",
  },
];

const settingsItems = [
  {
    icon: User,
    label: "Student Account",
    href: "/student-account",
  },
  {
    icon: Settings,
    label: "Global Preferences",
    href: "/global-preferences",
  },
];

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-[280px] h-screen bg-card/50 backdrop-blur-xl border-r border-border/40 fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl tracking-tight">
            FFCS<span className="text-primary">AGENT</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
        <div className="mb-8">
          <p className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
            Main Menu
          </p>
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                    )}
                  />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1 h-4 bg-primary-foreground/30 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
            Settings & Tools
          </p>
          <div className="space-y-1">
            {settingsItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                    )}
                  />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 group mt-4"
            >
              <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border/40 bg-card/30">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/25 shadow-[0_0_0_1px_rgba(99,102,241,0.15)]">
          <Avatar className="h-10 w-10 border border-primary/30">
            <AvatarFallback className="bg-primary/20 text-primary font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.name || user?.vitEmail?.split("@")[0] || "User"}</p>
            <p className="text-xs text-muted-foreground truncate font-mono">
              {user?.registrationNumber || user?.vitEmail || "No registration number"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
