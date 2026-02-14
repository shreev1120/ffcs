import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Lock, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const vitEmailRegex = /^[a-zA-Z0-9._%+-]+@vitstudent\.ac\.in$/;
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signup } = useAuth();

  const [vitEmail, setVitEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validationError = useMemo(() => {
    if (!vitEmail || !password || !confirmPassword) return null;
    if (!vitEmailRegex.test(vitEmail)) return "Use your @vitstudent.ac.in email.";
    if (!strongPasswordRegex.test(password)) {
      return "Password must be 8+ chars with uppercase, lowercase, number, and special character.";
    }
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  }, [confirmPassword, password, vitEmail]);

  const isFormValid = vitEmail.length > 0 && password.length > 0 && confirmPassword.length > 0 && !validationError;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (validationError) {
      toast({ title: "Validation error", description: validationError, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await signup(vitEmail, password, confirmPassword);
      toast({ title: "Signup successful", description: "Account created. Please login." });
      navigate("/login", { replace: true });
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Server unavailable",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[130px] rounded-full -z-10" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[130px] rounded-full -z-10" />

      <div className="w-full max-w-md glass-card p-8 border border-border/50">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30 shadow-glow">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-black tracking-tight leading-none">
              FFCS <span className="text-primary">AGENT</span>
            </h1>
            <p className="text-xs text-text-muted mt-1">Create your student account</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">VIT Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                value={vitEmail}
                onChange={(e) => setVitEmail(e.target.value.trim())}
                type="email"
                required
                className="pl-10"
                placeholder="your.name@vitstudent.ac.in"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                required
                className="pl-10"
              />
            </div>
          </div>

          {validationError && <p className="text-xs text-destructive">{validationError}</p>}

          <Button type="submit" className="w-full mt-2" disabled={submitting || !isFormValid}>
            {submitting ? "Creating account..." : "Sign up"}
          </Button>
          <p className="text-xs text-text-muted text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
