import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Calendar, Lock, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, login } = useAuth();

  const [vitEmail, setVitEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const vitEmailRegex = /^[a-zA-Z0-9._%+-]+@vitstudent\.ac\.in$/;
  const isFormValid = vitEmailRegex.test(vitEmail.trim()) && password.length > 0;

  useEffect(() => {
    document.title = "Login | FFCS Agent";
  }, []);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(vitEmail, password);
      const redirectTo = (location.state as { from?: string } | null)?.from || "/";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
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
            <p className="text-xs text-text-muted mt-1">Sign in to continue</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">VIT Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                value={vitEmail}
                onChange={(e) => setVitEmail(e.target.value)}
                type="email"
                required
                className="pl-10"
                placeholder="your.name@vitstudent.ac.in"
              />
            </div>
            {vitEmail.trim().length > 0 && !vitEmailRegex.test(vitEmail.trim()) && (
              <p className="text-xs text-destructive">Use your @vitstudent.ac.in email.</p>
            )}
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

          <Button type="submit" className="w-full mt-2" disabled={submitting || !isFormValid}>
            {submitting ? "Signing in..." : "Login"}
          </Button>
          <p className="text-xs text-text-muted text-center mt-4">
            New here?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
