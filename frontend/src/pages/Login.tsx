import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Lock, Mail, AlertCircle, ArrowRight, School, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/common/SEO";
import AppLogo, { LogoIcon } from "@/components/common/AppLogo";
import ThemeToggle from "@/components/common/ThemeToggle";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, login, loginAsGuest } = useAuth();

  const [vitEmail, setVitEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const vitEmailRegex = /^[a-zA-Z0-9._%+-]+@vitstudent\.ac\.in$/;
  const isEmailValid = vitEmailRegex.test(vitEmail.trim());
  const isFormValid = isEmailValid && password.length > 0;

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await login(vitEmail, password);
      toast({
        title: "Welcome back!",
        description: "Logged in successfully to VIT FFCS Portal.",
      });
      const redirectTo = (location.state as { from?: string } | null)?.from || "/";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Invalid email or password.";
      setErrorMessage(msg);
      toast({
        title: "Login failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <SEO
        title="Student Login"
        description="Sign in to your VIT FFCS student account to generate, inspect, and save clash-free timetables."
      />

      {/* VTOP Top Institutional Navigation Bar */}
      <nav className="vtop-header-gradient text-white py-2 px-6 shadow-sm border-b border-[#1b4b8a]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <AppLogo size="sm" textVariant="white" linkTo="/login" showBadge={false} />
          <div className="flex items-center gap-3">
            <div className="text-xs text-white/80 hidden sm:block font-medium">
              VTOP Academic Login Portal
            </div>
            <ThemeToggle variant="icon" />
          </div>
        </div>
      </nav>

      {/* Main Login Box */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card overflow-hidden border-t-4 border-t-[#2455a3] transition-colors">
          {/* Card Header */}
          <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-[#1b4b8a] dark:text-blue-400">Student Portal Login</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Access Timetable Optimization &amp; Course Slot Allocation
              </p>
            </div>
            <LogoIcon className="w-10 h-10 shrink-0" />
          </div>

          <div className="p-6">
            {/* Form Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800 flex items-start gap-2.5 text-xs animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div className="leading-relaxed">
                  <p className="font-bold">Authentication Failed</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-1">
                <label
                  htmlFor="vit-email"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block"
                >
                  VIT Student Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <Input
                    id="vit-email"
                    value={vitEmail}
                    onChange={(e) => {
                      setVitEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    type="email"
                    required
                    aria-required="true"
                    aria-invalid={vitEmail.length > 0 && !isEmailValid}
                    className={`pl-9 h-10 text-xs rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
                      vitEmail.length > 0 && !isEmailValid
                        ? "border-red-500 focus-visible:ring-red-400"
                        : "focus-visible:ring-[#2455a3]"
                    }`}
                    placeholder="your.name@vitstudent.ac.in"
                  />
                </div>
                {vitEmail.trim().length > 0 && !isEmailValid && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Must be a valid @vitstudent.ac.in address.</span>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <Input
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    type="password"
                    required
                    aria-required="true"
                    className="pl-9 h-10 text-xs rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-[#2455a3]"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Primary CTA Above The Fold */}
              <Button
                type="submit"
                className="w-full h-10 mt-2 bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-bold text-xs rounded shadow-sm"
                disabled={submitting || !isFormValid}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>Sign In to Student Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </Button>

              {/* Instant Guest / Client-Side Access */}
              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <span className="relative bg-white dark:bg-slate-900 px-2 text-[10px] uppercase font-bold text-slate-400">
                  OR
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  loginAsGuest();
                  toast({
                    title: "Guest Student Access",
                    description: "Entered as Student in Offline / Client-Side Mode.",
                  });
                  const redirectTo = (location.state as { from?: string } | null)?.from || "/planner";
                  navigate(redirectTo, { replace: true });
                }}
                className="w-full h-10 border-emerald-500/70 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold text-xs rounded flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Instant Student Access (Offline / No Server)</span>
              </Button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  New student registration?{" "}
                  <Link to="/signup" className="text-[#2455a3] dark:text-blue-400 font-bold hover:underline">
                    Create Account
                  </Link>
                </p>
              </div>
            </form>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Fall Semester</span>
            <div className="flex items-center gap-3">
              <Link to="/privacy-policy" className="hover:text-slate-800 dark:hover:text-slate-200">Privacy Policy</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-slate-800 dark:hover:text-slate-200">Terms</Link>
            </div>
          </div>
        </div>
      </div>

      {/* VTOP Footer */}
      <footer className="vtop-footer-gradient text-white py-2 text-center text-[11px] text-white/90 border-t border-[#1b4b8a]">
        Copyright © 2026 Software Development Cell, VIT, Vellore-632 014.
      </footer>
    </div>
  );
};

export default Login;
