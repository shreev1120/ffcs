import { FormEvent, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth, type UserPreferences } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/common/SEO";
import { Sliders, Sun, Moon } from "lucide-react";

const GlobalPreferences = () => {
  const { user, updatePreferences } = useAuth();
  const { toast } = useToast();

  const [batchPreference, setBatchPreference] = useState<UserPreferences["batchPreference"]>(
    user?.preferences.batchPreference ?? null,
  );
  const [maxTimetables, setMaxTimetables] = useState<number>(
    user?.preferences.maxTimetables && user.preferences.maxTimetables > 12 ? user.preferences.maxTimetables : 50,
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!batchPreference) {
      toast({
        title: "Select a slot preference",
        description: "Choose Morning or Evening to continue.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await updatePreferences({
        batchPreference,
        rankingCriteria: "balanced",
        maxTimetables,
      });
      toast({ title: "Preferences saved", description: "Global slot preferences updated successfully." });
    } catch (error) {
      toast({
        title: "Unable to save preferences",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <SEO title="Global Preferences" description="Configure your morning or evening batch preference and timetable generation constraints." />

      {/* VTOP Page Header */}
      <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-5 border-l-4 border-l-[#2455a3]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-[#2455a3] dark:text-blue-400 uppercase tracking-wider">
            Slot Preference Rules
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">VTOP Solver Optimization Constraints</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
          Timetable Optimization Preferences
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 text-xs">
          Select preferred batch shift timing. Settings persist across timetable calculations.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-card p-6 max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6">
          <section>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#2455a3] dark:text-blue-400" />
              <span>Preferred Theory / Lab Slot Shift</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["Morning", "Evening"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBatchPreference(option)}
                  className={`p-3.5 rounded border text-left transition-colors ${
                    batchPreference === option
                      ? "border-[#2455a3] bg-blue-50/50 dark:bg-blue-950/40 border-l-4 border-l-[#2455a3] ring-1 ring-[#2455a3]/30"
                      : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {option === "Morning" ? (
                      <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-[#2455a3] dark:text-blue-400" />
                    )}
                    <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{option} Shift</p>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {option === "Morning"
                      ? "Strict Morning Shift: Theory in A1/B1/C1... (*1 series, 08:00 AM - 01:00 PM) & Labs in L31 to L60 (02:00 PM - 07:30 PM). Zero mixed slots."
                      : "Strict Evening Shift: Labs in L1 to L30 (08:00 AM - 01:20 PM) & Theory in A2/B2/C2... (*2 series, 02:00 PM - 07:00 PM). Zero mixed slots."}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#2455a3] dark:text-blue-400" />
              <span>Default Combinations To Generate</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">
              Configure how many conflict-free timetable options to calculate per Excel upload:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { count: 15, label: "15 Options" },
                { count: 30, label: "30 Options" },
                { count: 50, label: "50 Options (Recommended)" },
                { count: 100, label: "100 Options (Max)" },
              ].map(({ count, label }) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setMaxTimetables(count)}
                  className={`p-3 rounded border text-center transition-all text-xs font-bold ${
                    maxTimetables === count
                      ? "border-[#2455a3] bg-blue-50/70 dark:bg-blue-950/50 ring-2 ring-[#2455a3]/30 dark:ring-blue-500/30 text-[#2455a3] dark:text-blue-300"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-bold text-xs h-9 rounded shadow-sm"
            >
              {saving ? "Saving Preferences..." : "Save Preferences"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default GlobalPreferences;
