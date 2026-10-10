import { Link, useLocation } from "react-router-dom";
import { CalendarDays, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export const StickyMobileCTA = () => {
  const location = useLocation();

  // Hide on auth pages
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  const isUploadPage = location.pathname === "/upload";

  return (
    <div
      role="region"
      aria-label="Quick Actions"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-300 p-2.5 px-4 shadow-md safe-area-bottom"
    >
      <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
        {!isUploadPage ? (
          <Button
            asChild
            className="flex-1 bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-bold text-xs h-10 rounded"
          >
            <Link to="/upload" className="flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Generate Timetable</span>
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            variant="outline"
            className="flex-1 border-[#2455a3] text-[#2455a3] hover:bg-slate-50 font-bold text-xs h-10 rounded"
          >
            <Link to="/results" className="flex items-center justify-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span>View Saved Schedules</span>
            </Link>
          </Button>
        )}

        <Button
          asChild
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded text-slate-700 hover:bg-slate-100 shrink-0 border border-slate-300"
        >
          <Link to="/results" title="My Schedules">
            <CalendarDays className="w-4 h-4 text-[#2455a3]" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default StickyMobileCTA;
