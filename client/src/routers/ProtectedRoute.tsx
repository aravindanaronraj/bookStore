import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

const ProtectedRoute = () => {
  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;