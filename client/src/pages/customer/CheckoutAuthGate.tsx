import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store/store";
import Checkout from "./Checkout";

const checkoutLocation = { pathname: "/checkout", search: "" };

const CheckoutAuthGate = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();

  if (user) return <Checkout />;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 7, md: 12 } }}>
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, border: "1px solid rgba(30,64,175,.12)", borderRadius: 4, textAlign: "center" }}>
        <Typography variant="overline" color="secondary.dark" sx={{ fontWeight: 800 }}>பாதுகாப்பான Checkout</Typography>
        <Typography variant="h3" sx={{ mt: 1, fontWeight: 900 }}>ஆர்டரைத் தொடர உங்கள் கணக்கைத் தேர்ந்தெடுக்கவும்</Typography>
        <Typography color="text.secondary" sx={{ mt: 2, mb: 4 }}>முகவரி, ஆர்டர் மற்றும் கட்டண விவரங்களை பாதுகாப்பாக நிர்வகிக்க கணக்கு தேவை.</Typography>
        <Stack spacing={2}>
          <Button size="large" variant="contained" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => navigate("/register", { state: { from: checkoutLocation } })}>புதிய பயனர் பதிவு</Button>
          <Button size="large" variant="outlined" startIcon={<LoginOutlinedIcon />} onClick={() => navigate("/login", { state: { from: checkoutLocation } })}>ஏற்கனவே பதிவு செய்தவர் Login</Button>
          <Button color="inherit" onClick={() => navigate("/cart")}>வாங்கும் கூடைக்குத் திரும்புக</Button>
        </Stack>
      </Paper>
      <Box sx={{ height: 20 }} />
    </Container>
  );
};

export default CheckoutAuthGate;
