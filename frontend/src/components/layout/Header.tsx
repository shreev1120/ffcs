import { User, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Header = () => {
  const { user } = useAuth();

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between px-8 py-6 border-b border-border backdrop-blur-md sticky top-0 z-40">
        <div>
          <h2 className="text-sm text-text-muted font-medium">
            Academic Year 2025-26
          </h2>

        </div>
        <div className="flex items-center gap-6">

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold">{user?.registrationNumber || user?.vitEmail || "Account"}</p>
              <p className="text-[10px] text-text-muted">{user?.name || user?.vitEmail?.split("@")[0] || "User"}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center overflow-hidden">
              <User className="w-4 h-4 text-text-muted" />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="lg:hidden glass m-4 px-6 py-4 flex items-center justify-between z-50 sticky top-4 shadow-glass-lg ring-1 ring-foreground/10">
        <Link to="/" className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="font-display font-bold tracking-tight text-sm">
            FFCS Agent
          </span>
        </Link>
        <div className="flex items-center gap-3">

          <button className="p-2 rounded-lg bg-primary/20 text-primary flex flex-col gap-0.5">
            <div className="w-5 h-0.5 bg-current rounded-full" />
            <div className="w-5 h-0.5 bg-current rounded-full" />
            <div className="w-3.5 h-0.5 bg-current opacity-60 rounded-full" />
          </button>
        </div>
      </nav>
    </>
  );
};

export default Header;
