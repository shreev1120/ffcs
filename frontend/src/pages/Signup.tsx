import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Lock, Mail, User, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/common/SEO";
import AppLogo, { LogoIcon } from "@/components/common/AppLogo";
import ThemeToggle from "@/components/common/ThemeToggle";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signup } = useAuth();

  const [name, setName] = useState("");
  const [vitEmail, setVitEmail] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeDataProcessing, setAgreeDataProcessing] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const vitEmailRegex = /^[a-zA-Z0-9._%+-]+@vitstudent\.ac\.in$/;
  const isEmailValid = vitEmailRegex.test(vitEmail.trim());
  const isRegValid = registrationNumber.trim().length >= 6;
  const isPasswordValid = password.length >= 6;
  const isNameValid = name.trim().length >= 2;

  const isFormValid =
    isNameValid &&
    isEmailValid &&
    isRegValid &&
    isPasswordValid &&
    agreeTerms &&
    agreeDataProcessing;

  const getValidationError = () => {
    if (vitEmail.trim() && !isEmailValid) {
      return "VIT student email must end with @vitstudent.ac.in";
    }
    if (registrationNumber.trim() && !isRegValid) {
      return "Registration number must be at least 6 characters (e.g. 21BCE1001)";
    }
    if (password && !isPasswordValid) {
      return "Password must be at least 6 characters long.";
    }
    if (!agreeTerms || !agreeDataProcessing) {
      return "Please check both consent boxes to proceed.";
    }
    return null;
  };

  const validationError = getValidationError();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError(null);

    if (honeypot.trim().length > 0) {
      setServerError("Spam protection triggered. Submission blocked.");
      return;
    }

    if (!isFormValid) {
      setServerError(validationError || "Please satisfy all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await signup(vitEmail, password, name, registrationNumber.toUpperCase().trim());
      toast({
        title: "Account created!",
        description: "Welcome to VIT FFCS Portal. You are now logged in.",
      });
      navigate("/", { replace: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to register account. Please try again.";
      setServerError(msg);
      toast({
        title: "Registration Failed",
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
        title="Create Student Account"
        description="Register for VIT FFCS Agent to automatically generate clash-free schedules from your VTOP Excel sheets."
      />

      {/* VTOP Top Institutional Navigation Bar */}
      <nav className="vtop-header-gradient text-white py-2 px-6 shadow-sm border-b border-[#1b4b8a]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <AppLogo size="sm" textVariant="white" linkTo="/signup" showBadge={false} />
          <div className="flex items-center gap-3">
            <div className="text-xs text-white/80 hidden sm:block font-medium">
              Student Registration Portal
            </div>
            <ThemeToggle variant="icon" />
          </div>
        </div>
      </nav>

      {/* Main Registration Box */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card overflow-hidden border-t-4 border-t-[#2455a3] transition-colors">
          {/* Card Header */}
          <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-[#1b4b8a] dark:text-blue-400">Create Student Account</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Register to save schedules and optimize course registration
              </p>
            </div>
            <LogoIcon className="w-10 h-10 shrink-0" />
          </div>

          <div className="p-6">
            {/* Server Error Alert */}
            {serverError && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800 flex items-start gap-2.5 text-xs animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div className="leading-relaxed">
                  <p className="font-bold">Registration Alert</p>
                  <p>{serverError}</p>
                </div>
              </div>
            )}

            <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="website_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Student Full Name */}
              <div className="space-y-1">
                <label
                  htmlFor="student-name"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input
                    id="student-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setServerError(null);
                    }}
                    required
                    aria-required="true"
                    className="pl-9 h-9 text-xs rounded border-slate-300 focus-visible:ring-[#2455a3]"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              {/* VIT Student Email */}
              <div className="space-y-1">
                <label
                  htmlFor="vit-email"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block"
                >
                  VIT Student Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input
                    id="vit-email"
                    value={vitEmail}
                    onChange={(e) => {
                      setVitEmail(e.target.value);
                      setServerError(null);
                    }}
                    type="email"
                    required
                    aria-required="true"
                    aria-invalid={vitEmail.length > 0 && !isEmailValid}
                    className={`pl-9 h-9 text-xs rounded border-slate-300 ${
                      vitEmail.length > 0 && !isEmailValid
                        ? "border-red-500"
                        : "focus-visible:ring-[#2455a3]"
                    }`}
                    placeholder="john.doe2023@vitstudent.ac.in"
                  />
                </div>
              </div>

              {/* Registration Number */}
              <div className="space-y-1">
                <label
                  htmlFor="reg-number"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block"
                >
                  Registration Number
                </label>
                <Input
                  id="reg-number"
                  value={registrationNumber}
                  onChange={(e) => {
                    setRegistrationNumber(e.target.value.toUpperCase());
                    setServerError(null);
                  }}
                  required
                  aria-required="true"
                  className="h-9 text-xs font-mono rounded border-slate-300 uppercase focus-visible:ring-[#2455a3]"
                  placeholder="23BCE1042"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block"
                >
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setServerError(null);
                    }}
                    type="password"
                    required
                    aria-required="true"
                    className="pl-9 h-9 text-xs rounded border-slate-300 focus-visible:ring-[#2455a3]"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-2 text-xs text-slate-600 border-t border-slate-200">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    id="agree-terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      setServerError(null);
                    }}
                    className="mt-0.5 rounded border-slate-300 text-[#2455a3] focus:ring-[#2455a3] h-3.5 w-3.5 shrink-0"
                  />
                  <span className="leading-tight">
                    I agree to the{" "}
                    <Link to="/terms" className="text-[#2455a3] hover:underline font-semibold">
                      Terms of Service
                    </Link>
                    ,{" "}
                    <Link to="/privacy-policy" className="text-[#2455a3] hover:underline font-semibold">
                      Privacy Policy
                    </Link>
                    , and{" "}
                    <Link to="/cookie-policy" className="text-[#2455a3] hover:underline font-semibold">
                      Cookie Policy
                    </Link>
                    .
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    id="agree-data"
                    type="checkbox"
                    checked={agreeDataProcessing}
                    onChange={(e) => {
                      setAgreeDataProcessing(e.target.checked);
                      setServerError(null);
                    }}
                    className="mt-0.5 rounded border-slate-300 text-[#2455a3] focus:ring-[#2455a3] h-3.5 w-3.5 shrink-0"
                  />
                  <span className="leading-tight">
                    I consent to processing my course registration slots solely for clash-free schedule calculation.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-10 mt-3 bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-bold text-xs rounded shadow-sm"
                disabled={submitting || !isFormValid}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>Create Student Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </Button>

              <div className="text-center pt-1">
                <p className="text-xs text-slate-600">
                  Already registered?{" "}
                  <Link to="/login" className="text-[#2455a3] font-bold hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>

          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Fall Semester</span>
            <div className="flex items-center gap-3">
              <Link to="/privacy-policy" className="hover:text-slate-800">Privacy Policy</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-slate-800">Terms</Link>
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

export default Signup;
