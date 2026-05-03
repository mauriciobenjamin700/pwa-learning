import { Navigate, Outlet } from "react-router";
import { ROUTES } from "@/core/constants/routes";
import { useUserStore } from "@/store/useUserStore";

export default function PrivateRoute() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  return <Outlet />;
}
