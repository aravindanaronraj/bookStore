import {  useState } from "react";
import type{FormEvent} from "react";
import {
  Box,
  Link,
  Stack,
  Typography,
} from "@mui/material";

import {
  AppButton,
  AppInput,
} from "../../design-system";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";


import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store/store";
import { login } from "../../store/slices/authSlice";

const Login = () => {
  const navigate = useNavigate();
const location = useLocation();
const from = location.state?.from
  ? location.state.from.pathname +
    location.state.from.search
  : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");
  const dispatch =
  useDispatch<AppDispatch>();

  const handleSubmit = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  setError("");

  try {
    setLoading(true);

   await dispatch(
  login({
    email,
    password,
  })
).unwrap();

navigate(from, {
  replace: true,
});

  } catch (error: unknown) {
    setError(typeof error === "string" ? error : "Login failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <Box>
      <Typography
        variant="h5"
        sx={{fontWeight:700,
        mb:1}}
      >
        மீண்டும் வரவேற்கிறோம்
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{mb:3}}
      >
        தொடர்ந்து நூல்கள் வாங்க உள்நுழையுங்கள்.
      </Typography>

      <Stack
        component="form"
        spacing={2}
        onSubmit={handleSubmit}
      >
        <AppInput
        label="மின்னஞ்சல்"
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
        />

        <AppInput
        label="கடவுச்சொல்"
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          required
        />

        {error && (
          <Typography
            color="error"
            variant="body2"
          >
            {error}
          </Typography>
        )}

        <Box sx={{textAlign:"right"}}>
          <Link
            href="/forgot-password"
            underline="hover"
          >
            கடவுச்சொல்லை மறந்துவிட்டீர்களா?
          </Link>
        </Box>

        <AppButton
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
        >
          {loading
            ? "Loginிறது..."
            : "Login"}
        </AppButton>

        <Typography
          variant="body2"
          
          sx={{textAlign:"center",color:"text.secondary"}}
        >
          கணக்கு இல்லையா?{" "}
          <Link
            href="/register"
            underline="hover"
          >
            புதிய கணக்கு உருவாக்குக
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
};

export default Login;
