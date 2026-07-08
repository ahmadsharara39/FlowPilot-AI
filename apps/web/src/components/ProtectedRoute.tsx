import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingScreen } from "./Spinner";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen label="Restoring session…" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
