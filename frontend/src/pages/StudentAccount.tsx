import { FormEvent, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
      toast({ title: "Profile updated", description: "Student account details saved." });
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
      <div className="mb-8">
        <h1 className="font-display text-4xl font-black text-gradient">Student Account</h1>
        <p className="text-text-secondary mt-2">Manage your profile and account security.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GlassCard hover={false}>
          <h2 className="font-display text-lg font-bold mb-4">Profile Details</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-text-muted uppercase tracking-wide font-bold">Full Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Student Name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-text-muted uppercase tracking-wide font-bold">VIT Email</label>
              <Input value={user?.vitEmail || ""} disabled />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-text-muted uppercase tracking-wide font-bold">Registration Number</label>
              <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
            </div>

            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </GlassCard>

        <GlassCard hover={false}>
          <h2 className="font-display text-lg font-bold mb-4">Security</h2>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-text-muted uppercase tracking-wide font-bold">Current Password</label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-text-muted uppercase tracking-wide font-bold">New Password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default StudentAccount;
