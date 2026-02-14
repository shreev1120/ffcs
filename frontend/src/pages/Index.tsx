import {
  Calendar,
  Clock,
  BookOpen,
  Zap,
  Upload,
  LayoutDashboard,
  Settings,
  Sparkles,
  TrendingUp,
  Target,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import QuickAction from "@/components/dashboard/QuickAction";
import GlassCard from "@/components/ui/GlassCard";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  generatedSchedules: number;
  hoursSaved: number;
  activeCourses: number;
  optimizationScore: number;
}

interface ActivityLog {
  title: string;
  desc: string;
  time: string;
  type: string;
}

const Index = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    generatedSchedules: 0,
    hoursSaved: 0,
    activeCourses: 0,
    optimizationScore: 0
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, activityData] = await Promise.all([
          apiRequest<DashboardStats>("/dashboard/stats"),
          apiRequest<ActivityLog[]>("/dashboard/activity")
        ]);
        setStats(statsData);
        setActivities(activityData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <DashboardLayout>
      {/* Hero Section */}
      <div className="mb-10 reveal">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs font-bold text-primary uppercase tracking-widest">
            Dashboard Overview
          </span>
        </div>
        <h1 className="font-display text-4xl lg:text-5xl font-black text-gradient leading-tight">
          Welcome back, <span className="text-primary-gradient">{user?.name || user?.vitEmail?.split("@")[0] || "User"}</span>
        </h1>
        <p className="text-text-secondary mt-3 max-w-xl">
          Your intelligent timetable companion. Generate conflict-free schedules
          optimized for your preferences in seconds.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <StatCard
          icon={Calendar}
          label="Generated Schedules"
          value={stats.generatedSchedules.toString()}
          trend={stats.generatedSchedules > 0 ? "+1" : "0"}
          trendUp={stats.generatedSchedules > 0}
          color="primary"
        />

      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickAction
            to="/upload"
            icon={Upload}
            title="Generate New Timetable"
            description="Upload your course list and preferences"
            gradient
          />
          <QuickAction
            to="/results"
            icon={LayoutDashboard}
            title="View My Schedules"
            description="Browse and compare generated options"
          />

        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <GlassCard className="lg:col-span-2 reveal">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Recent Activity
            </h3>
            <span className="text-xs text-text-muted">Last 7 days</span>
          </div>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-foreground/5 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    {item.type === 'calendar' ? <Calendar className="w-4 h-4 text-primary" /> :
                      item.type === 'settings' ? <Settings className="w-4 h-4 text-primary" /> :
                        item.type === 'book' ? <BookOpen className="w-4 h-4 text-primary" /> :
                          <Sparkles className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-text-muted">{item.desc}</p>
                  </div>
                  <span className="text-xs text-text-muted">
                    {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted text-center py-4">No recent activity found.</p>
            )}
          </div>
        </GlassCard>

        {/* AI Insights */}
        <GlassCard className="reveal">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="font-display font-bold">AI Insights</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <p className="text-sm font-medium mb-2">💡 Pro Tip</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {stats.optimizationScore > 90
                  ? "Great job! Your schedules are highly optimized."
                  : "Try adjusting your preferences to find better slots."}
              </p>
            </div>
            {stats.generatedSchedules > 0 && (
              <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                <p className="text-sm font-medium mb-2 text-success">
                  ✓ All Clear
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  No conflicts detected in your latest schedule.
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default Index;
