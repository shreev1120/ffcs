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
  const [rankingCriteria, setRankingCriteria] = useState<UserPreferences["rankingCriteria"]>(
    user?.preferences.rankingCriteria || "balanced",
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
        rankingCriteria,
        maxTimetables: user?.preferences.maxTimetables || 20,
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
      <SEO title="Global Preferences" description="Configure your morning or evening batch preference, ranking heuristics, and timetable generation constraints." />

      {/* VTOP Page Header */}
      <div className="mb-6 bg-white border border-slate-300 rounded shadow-card p-5 border-l-4 border-l-[#2455a3]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-[#2455a3] uppercase tracking-wider">
            Slot Preference Rules
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500">VTOP Solver Optimization Constraints</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
          Timetable Optimization Preferences
        </h1>
        <p className="text-slate-600 mt-1 text-xs">
          Select preferred batch shift timing and ranking heuristics. Settings persist across timetable calculations.
        </p>
      </div>

      <div className="bg-white border border-slate-300 rounded shadow-card p-6 max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6">
          <section>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#2455a3]" />
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
                      ? "border-[#2455a3] bg-blue-50/50 border-l-4 border-l-[#2455a3]"
                      : "border-slate-300 hover:border-slate-400 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {option === "Morning" ? (
                      <Sun className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Moon className="w-4 h-4 text-[#2455a3]" />
                    )}
                    <p className="font-bold text-xs text-slate-900">{option} Shift</p>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {option === "Morning"
                      ? "Strict Morning Shift: Theory in A1/B1/C1... (*1 series, 08:00 AM - 01:00 PM) & Labs in L31 to L60 (02:00 PM - 07:30 PM). Zero mixed slots."
                      : "Strict Evening Shift: Labs in L1 to L30 (08:00 AM - 01:20 PM) & Theory in A2/B2/C2... (*2 series, 02:00 PM - 07:00 PM). Zero mixed slots."}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Optimization Heuristic Criteria
            </h2>
            <select
              value={rankingCriteria}
              onChange={(e) => setRankingCriteria(e.target.value as UserPreferences["rankingCriteria"])}
              className="w-full h-9 rounded border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2455a3]"
            >
              <option value="balanced">Balanced (Optimal gaps between classes)</option>
              <option value="earliest_finish">Earliest Finish (Compact daily schedules)</option>
              <option value="no_morning">Late Start (Avoid 8:00 AM periods)</option>
              <option value="max_free_days">Maximum Free Days (Cluster periods into fewer days)</option>
            </select>
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
