import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, CircularProgress } from "@mui/material";

import type {
  AppDispatch,
  RootState,
} from "../../store/store";

import {
  fetchCurrentUser,
} from "../../store/slices/authSlice";

interface AuthInitializerProps {
  children: React.ReactNode;
}

const AuthInitializer = ({
  children,
}: AuthInitializerProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const initialized = useSelector(
    (state: RootState) =>
      state.auth.initialized
  );

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  if (!initialized) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
};

export default AuthInitializer;