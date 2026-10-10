import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("ffcs_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("ffcs_cookie_consent", "all");
    analytics.setConsent(true);
    analytics.trackEvent("cookie_consent_accepted", { tier: "all" });
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem("ffcs_cookie_consent", "essential");
    analytics.setConsent(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie Preferences"
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 animate-in fade-in duration-200"
    >
      <div className="bg-white p-4 border border-slate-300 shadow-card text-slate-800 rounded border-t-4 border-t-[#2455a3]">
        <div className="flex items-start gap-3 mb-2">
          <div className="p-2 rounded bg-slate-100 text-[#2455a3] shrink-0 mt-0.5 border border-slate-200">
            <Cookie className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs tracking-tight flex items-center gap-1.5 text-slate-900">
              <span>Cookie &amp; Privacy Preferences</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#2455a3]" />
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              We use essential session cookies to secure your VIT student login and remember your batch preferences. No advertising cookies are tracked.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-200">
          <Button
            size="sm"
            onClick={handleAcceptAll}
            className="flex-1 bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-semibold text-xs h-7 rounded"
          >
            Accept All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleEssentialOnly}
            className="flex-1 border-slate-300 hover:bg-slate-100 text-xs h-7 rounded"
          >
            Essential Only
          </Button>
          <Link
            to="/cookie-policy"
            className="text-[11px] text-slate-600 hover:text-[#2455a3] transition-colors underline px-1"
          >
            Cookies
          </Link>
          <span className="text-slate-300 text-[10px]">•</span>
          <Link
            to="/privacy-policy"
            className="text-[11px] text-slate-600 hover:text-[#2455a3] transition-colors underline px-1"
          >
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
