import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ReactElement } from "react";

interface ProtectedRouteProps {
  children: ReactElement;
  requireRegistered?: boolean;
}

const ProtectedRoute = ({ children, requireRegistered = false }: ProtectedRouteProps) => {
  const { user, isGuest, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // If page requires a full registered account and user is in guest mode
  if (requireRegistered && isGuest) {
    return <Navigate to="/login" replace state={{ from: location.pathname, requiresAccount: true }} />;
  }

  return children;
};

export default ProtectedRoute;
