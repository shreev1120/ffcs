import { useState, useEffect } from "react";
import {
  Calendar,
  User,
  X,
  Menu,
  LayoutDashboard,
  Upload,
  CalendarDays,
  Settings,
  ShieldCheck,
  FileText,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import AppLogo from "@/components/common/AppLogo";
import ThemeToggle from "@/components/common/ThemeToggle";

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Timetable Generator", href: "/upload", icon: Upload },
    { label: "Saved Schedules", href: "/results", icon: CalendarDays },
    { label: "Student Account", href: "/student-account", icon: User },
    { label: "Preferences", href: "/global-preferences", icon: Settings },
  ];

  return (
    <>
      {/* VTOP Institutional Top Navigation Bar */}
      <header className="vtop-header-gradient text-white sticky top-0 z-50 border-b border-[#1b4b8a] shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* VTOP Branding */}
          <div className="flex items-center gap-3">
            <AppLogo size="md" textVariant="white" linkTo="/dashboard" />
          </div>

          {/* Desktop Right Info & Controls */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right border-r border-white/20 pr-4">
              <p className="text-xs font-bold text-white tracking-wide">
                FALL SEMESTER
              </p>
              <p className="text-[11px] text-white/80">
                Course Registration &amp; Timetable System
              </p>
            </div>

            <Link
              to="/upload"
              className="text-xs font-bold px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Generate Timetable</span>
            </Link>

            <div className="flex items-center gap-2 pl-2">
              <Link
                to="/student-account"
                className="flex items-center gap-2 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
                title="Student Profile"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold leading-tight truncate max-w-[120px]">
                    {user?.name || user?.vitEmail?.split("@")[0] || "Student"}
                  </p>
                  <p className="text-[10px] text-white/80 font-mono leading-tight">
                    {user?.registrationNumber || "VIT Student"}
                  </p>
                </div>
              </Link>

              {/* Theme Toggle Button */}
              <ThemeToggle variant="icon" />

              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 rounded bg-white/10 hover:bg-red-600/80 text-white transition-colors border border-white/20"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Trigger & Quick Theme Switch */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle variant="icon" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              className="p-2 rounded bg-white/15 text-white hover:bg-white/25 border border-white/30"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-white text-slate-800 border-t border-slate-300 p-6 rounded-t-lg max-h-[85vh] overflow-y-auto space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <AppLogo
                size="sm"
                textVariant="dark"
                linkTo="/dashboard"
                showBadge={false}
                subtitle={user?.registrationNumber || user?.vitEmail || "Student Session"}
              />
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1">
                Portal Menu
              </p>
              {navLinks.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[#2455a3] text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1">
                Institutional Compliance
              </p>
              <Link
                to="/privacy-policy"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-100"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Privacy Policy</span>
              </Link>
              <Link
                to="/terms"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-100"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Terms of Service</span>
              </Link>
              <Link
                to="/cookie-policy"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-100"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Cookie Policy</span>
              </Link>
              <Link
                to="/refund-policy"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-100"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Refund Policy</span>
              </Link>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full justify-center gap-2 border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold h-9 rounded"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
