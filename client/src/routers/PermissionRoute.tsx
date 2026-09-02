import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "../store/store";

const PermissionRoute = () => {
  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin gets full access
  if (user.role === "admin") {
    return <Outlet />;
  }

  return <Navigate to="/admin" replace />;
};

export default PermissionRoute;
