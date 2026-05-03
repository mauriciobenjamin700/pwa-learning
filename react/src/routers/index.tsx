import { lazy, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router";
import PrivateRoute from "@/middlewares/PrivateRoute";
import { ROUTES } from "@/core/constants/routes";
import { useTokenStore } from "@/store/useTokenStore";

const HomePage = lazy(() => import("@/pages/Home"));
const LoginPage = lazy(() => import("@/pages/Login"));

export default function AllRoutes() {
  const loadToken = useTokenStore((s) => s.loadToken);
  useEffect(() => {
    loadToken();
  }, [loadToken]);

  return (
    <Suspense fallback={<div>Carregando…</div>}>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route element={<PrivateRoute />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
