import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "../store/store";

const AdminRoute = () => {
  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin" && !(user.role === "staff" && user.staffApproval === "approved")) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
