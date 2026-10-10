import { FormEvent, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/common/SEO";
import { User, ShieldCheck } from "lucide-react";

const StudentAccount = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [registrationNumber, setRegistrationNumber] = useState(user?.registrationNumber || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ name, registrationNumber });
      toast({ title: "Profile updated", description: "Student account details saved successfully." });
    } catch (error) {
      toast({
        title: "Unable to save profile",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (event: FormEvent) => {
    event.preventDefault();
    setSavingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      toast({ title: "Password updated", description: "Please login again to continue." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast({
        title: "Password update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <SEO title="Student Account" description="Manage your VIT student registration number, profile name, and account security settings." />

      {/* Institutional Page Title */}
      <div className="mb-6 bg-white border border-slate-300 rounded shadow-card p-5 border-l-4 border-l-[#2455a3]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-[#2455a3] uppercase tracking-wider">
            Student Profile Registry
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500">VTOP Academic Account</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
          Student Profile &amp; Account Settings
        </h1>
        <p className="text-slate-600 mt-1 text-xs">
          Manage your VIT registered name, registration number, and authentication credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-300 rounded shadow-card p-5">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200">
            <User className="w-4 h-4 text-[#2455a3]" />
            <h2 className="text-sm font-bold text-slate-900">Student Profile Information</h2>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 uppercase tracking-wide font-bold">Full Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Student Name"
                className="h-9 text-xs rounded border-slate-300 focus-visible:ring-[#2455a3]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-700 uppercase tracking-wide font-bold">VIT Student Email</label>
              <Input
                value={user?.vitEmail || ""}
                disabled
                className="h-9 text-xs rounded border-slate-300 bg-slate-100 text-slate-600 cursor-not-allowed font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-700 uppercase tracking-wide font-bold">Registration Number</label>
              <Input
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                className="h-9 text-xs font-mono uppercase rounded border-slate-300 focus-visible:ring-[#2455a3]"
                placeholder="e.g. 23BCE1042"
              />
            </div>

            <Button
              type="submit"
              disabled={savingProfile}
              className="bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-bold text-xs h-9 rounded"
            >
              {savingProfile ? "Saving Details..." : "Save Profile Details"}
            </Button>
          </form>
        </div>

        {/* Security Card */}
        <div className="bg-white border border-slate-300 rounded shadow-card p-5">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200">
            <ShieldCheck className="w-4 h-4 text-[#2455a3]" />
            <h2 className="text-sm font-bold text-slate-900">Account Security &amp; Password</h2>
          </div>

          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 uppercase tracking-wide font-bold">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="h-9 text-xs rounded border-slate-300 focus-visible:ring-[#2455a3]"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-700 uppercase tracking-wide font-bold">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                className="h-9 text-xs rounded border-slate-300 focus-visible:ring-[#2455a3]"
                placeholder="Minimum 6 characters"
              />
            </div>
            <Button
              type="submit"
              disabled={savingPassword}
              className="bg-[#2455a3] hover:bg-[#1b4b8a] text-white font-bold text-xs h-9 rounded"
            >
              {savingPassword ? "Updating Password..." : "Update Security Password"}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentAccount;
