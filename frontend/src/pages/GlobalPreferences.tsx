import { FormEvent, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { useAuth, type UserPreferences } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const GlobalPreferences = () => {
  const { user, updatePreferences } = useAuth();
  const { toast } = useToast();

  const [batchPreference, setBatchPreference] = useState<UserPreferences["batchPreference"]>(
    user?.preferences.batchPreference ?? null,
  );
  const [rankingCriteria, setRankingCriteria] = useState<UserPreferences["rankingCriteria"]>(
    user?.preferences.rankingCriteria || "balanced",
  );
  const [maxTimetables, setMaxTimetables] = useState<number>(user?.preferences.maxTimetables || 12);
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
      await updatePreferences({ batchPreference, rankingCriteria, maxTimetables });
      toast({ title: "Preferences saved", description: "Global preferences updated successfully." });
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
      <div className="mb-8">
        <h1 className="font-display text-4xl font-black text-gradient">Global Preferences</h1>
        <p className="text-text-secondary mt-2">These settings persist across sessions until changed.</p>
      </div>

      <GlassCard hover={false} className="max-w-3xl">
        <form onSubmit={handleSave} className="space-y-8">
          <section>
            <h2 className="font-display text-lg font-bold mb-3">Preferred Slot Window</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["Morning", "Evening"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBatchPreference(option)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    batchPreference === option
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <p className="font-semibold">{option}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {option === "Morning" ? "Prioritize morning slot combinations only." : "Prioritize evening slot combinations only."}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-3">Ranking Criteria</h2>
            <select
              value={rankingCriteria}
              onChange={(e) => setRankingCriteria(e.target.value as UserPreferences["rankingCriteria"])}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="balanced">Balanced</option>
              <option value="earliest_finish">Earliest Finish</option>
              <option value="no_morning">No Morning</option>
              <option value="max_free_days">Maximum Free Days</option>
            </select>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-3">Combination Volume</h2>
            <input
              type="range"
              min={4}
              max={60}
              value={maxTimetables}
              onChange={(e) => setMaxTimetables(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-text-secondary mt-2">
              Generate up to <span className="font-bold text-primary">{maxTimetables}</span> timetable combinations per run.
            </p>
          </section>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </form>
      </GlassCard>
    </DashboardLayout>
  );
};

export default GlobalPreferences;
