import { Link } from "react-router-dom";
import { MapPin, Mail, Phone, ShieldCheck, FileText, Cookie, BadgeCheck, School } from "lucide-react";
import AppLogo from "@/components/common/AppLogo";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-300 bg-white text-slate-700">
      <div className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
        {/* Brand & Genuine Academic Details */}
        <div className="space-y-2.5">
          <AppLogo size="sm" textVariant="dark" linkTo="/" showBadge={false} />
          <p className="text-slate-600 leading-relaxed">
            Academic timetable optimization system designed for Vellore Institute of Technology students to generate clash-free course schedules.
          </p>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-300">
            <School className="w-3 h-3 text-[#2455a3]" />
            <span>VIT Fall &amp; Winter Sessions</span>
          </div>
        </div>

        {/* Real Campus Address (Item 19) */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
            Campus Address
          </h4>
          <div className="flex items-start gap-2 text-slate-600">
            <MapPin className="w-4 h-4 text-[#2455a3] shrink-0 mt-0.5" />
            <address className="not-italic leading-relaxed">
              Vellore Institute of Technology (VIT)<br />
              Katpadi Road, Vellore,<br />
              Tamil Nadu - 632014, India
            </address>
          </div>
        </div>

        {/* Support & Desk */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
            Student Support Desk
          </h4>
          <div className="space-y-1.5 text-slate-600">
            <a
              href="mailto:ffcs.support@vitstudent.ac.in"
              className="flex items-center gap-2 hover:text-[#2455a3] transition-colors"
            >
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <span>ffcs.support@vitstudent.ac.in</span>
            </a>
            <a
              href="tel:+914162202000"
              className="flex items-center gap-2 hover:text-[#2455a3] transition-colors"
            >
              <Phone className="w-4 h-4 text-slate-500 shrink-0" />
              <span>+91 (0416) 220 2000</span>
            </a>
          </div>
        </div>

        {/* Compliance, Policies & Disclaimers */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
            Institutional Policies
          </h4>
          <ul className="space-y-1.5 text-slate-600">
            <li>
              <Link
                to="/privacy-policy"
                className="hover:text-[#2455a3] transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Privacy Policy</span>
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="hover:text-[#2455a3] transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Terms of Service</span>
              </Link>
            </li>
            <li>
              <Link
                to="/cookie-policy"
                className="hover:text-[#2455a3] transition-colors flex items-center gap-1.5"
              >
                <Cookie className="w-3.5 h-3.5 text-slate-500" />
                <span>Cookie Policy</span>
              </Link>
            </li>
            <li>
              <Link
                to="/refund-policy"
                className="hover:text-[#2455a3] transition-colors flex items-center gap-1.5"
              >
                <BadgeCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Refund &amp; Free Service Terms</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Official VTOP Footer Banner */}
      <div className="vtop-footer-gradient text-white py-2 px-4 text-center text-xs">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-white/90">
            Copyright © 2026 Software Development Cell, VIT, Vellore-632 014. Independent student tool.
          </p>
          <div className="flex items-center gap-3 text-[11px] text-white/80">
            <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <span>|</span>
            <Link to="/terms" className="hover:text-white">Terms of Use</Link>
            <span>|</span>
            <Link to="/cookie-policy" className="hover:text-white">Cookies</Link>
            <span>|</span>
            <Link to="/refund-policy" className="hover:text-white">Service Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
