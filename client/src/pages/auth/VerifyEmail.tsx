import { useEffect, useState } from "react";
import { Alert, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { verifyRegistrationToken } from "../../services/authService";
import { getErrorMessage } from "../../utils/getErrorMessage";

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("The verification link is incomplete.");
      return;
    }

    void verifyRegistrationToken(token)
      .then((result) => {
        setStatus("success");
        setMessage(result.message || "Email verified successfully.");
      })
      .catch((error: unknown) => {
        setStatus("error");
        setMessage(getErrorMessage(error, "This verification link is invalid or has expired."));
      });
  }, [token]);

  return (
    <Stack spacing={2.5} sx={{ alignItems: "stretch" }}>
      <Typography variant="h5" sx={{ fontWeight: 800 }}>Email verification</Typography>
      {status === "loading" && <CircularProgress sx={{ alignSelf: "center" }} />}
      {status !== "loading" && <Alert severity={status}>{message}</Alert>}
      {status === "success" && <Button component={Link} to="/login" variant="contained">Continue to login</Button>}
      {status === "error" && <Button component={Link} to="/register" variant="outlined">Return to registration</Button>}
    </Stack>
  );
};

export default VerifyEmail;
