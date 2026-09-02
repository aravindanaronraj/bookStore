import { useState, type FormEvent } from "react";
import { Alert, Avatar, Box, Button, Chip, Container, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import { fetchCurrentUser } from "../../store/slices/authSlice";
import { updateProfile, verifyRegistrationOtp } from "../../services/authService";
import { getErrorMessage } from "../../utils/getErrorMessage";
import AddressManager from "../../components/profile/AddressManager";

const Profile = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const [form, setForm] = useState(() => ({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "", currentPassword: "" }));
  const [editing, setEditing] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const changedEmail = form.email.trim().toLowerCase() !== user?.email.toLowerCase();

  const save = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true); setError("");
      const result = await updateProfile(form);
      setMessage(result.message);
      if (result.verificationRequired) setOtpMode(true);
      else { await dispatch(fetchCurrentUser()); setEditing(false); }
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, "சுயவிவரத்தைப் புதுப்பிக்க முடியவில்லை"));
    } finally { setLoading(false); }
  };

  const verify = async () => {
    try {
      setLoading(true); setError("");
      await verifyRegistrationOtp(form.email, otp);
      await dispatch(fetchCurrentUser());
      setOtpMode(false); setEditing(false);
      setMessage("புதிய மின்னஞ்சல் உறுதிசெய்யப்பட்டு சுயவிவரம் புதுப்பிக்கப்பட்டது");
    } catch (verifyError: unknown) {
      setError(getErrorMessage(verifyError, "OTP-ஐ உறுதிசெய்ய முடியவில்லை"));
    } finally { setLoading(false); }
  };

  if (!user) return null;
  const initials = user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return <Container maxWidth="md" sx={{ py: { xs: 5, md: 9 } }}>
    <Paper elevation={0} sx={{ border: "1px solid rgba(30,64,175,.12)", borderRadius: 4, overflow: "hidden" }}>
      <Box sx={{ p: { xs: 3, sm: 4 }, bgcolor: "primary.dark", color: "white" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} sx={{ alignItems: { sm: "center" } }}>
          <Avatar sx={{ width: 76, height: 76, bgcolor: "secondary.main", color: "primary.dark", fontSize: 25, fontWeight: 900 }}>{initials}</Avatar>
          <Box><Typography variant="h4" sx={{ fontWeight: 900 }}>{user.name}</Typography><Typography sx={{ opacity: .72 }}>{user.email}</Typography><Chip size="small" label={user.subscription.plan === "premium" ? "சிறப்பு" : "இலவச கணக்கு"} sx={{ mt: 1, bgcolor: "rgba(255,255,255,.13)", color: "white" }} /></Box>
        </Stack>
      </Box>
      <Box component="form" onSubmit={save} sx={{ p: { xs: 3, sm: 4 } }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {otpMode ? <Stack spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: 850 }}>புதிய மின்னஞ்சலை உறுதிசெய்யவும்</Typography>
          <Typography color="text.secondary">{form.email} மின்னஞ்சலுக்கு அனுப்பப்பட்ட 6 இலக்கக் குறியீட்டை உள்ளிடுங்கள்.</Typography>
          <TextField label="6 இலக்க OTP" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} />
          <Button variant="contained" disabled={loading || otp.length !== 6} onClick={() => void verify()}>மின்னஞ்சலை உறுதிசெய்க</Button>
        </Stack> : <>
          <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 3 }}>
            <Box><Typography variant="h5" sx={{ fontWeight: 850 }}>தனிப்பட்ட தகவல்கள்</Typography><Typography color="text.secondary">உங்கள் கணக்குத் தகவல்களை நிர்வகிக்கவும்.</Typography></Box>
            {!editing && <Button variant="outlined" onClick={() => setEditing(true)}>சுயவிவரத்தைத் திருத்து</Button>}
          </Stack>
          <Divider sx={{ mb: 3 }} />
          <Stack spacing={2}>
            <TextField disabled={!editing} required label="முழுப் பெயர்" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <TextField disabled={!editing} required type="email" label="மின்னஞ்சல்" value={form.email} helperText={editing ? "மின்னஞ்சலை மாற்றினால் OTP உறுதிப்படுத்தல் தேவை" : undefined} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            <TextField disabled={!editing} required label="10 இலக்க தொலைபேசி எண்" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value.replace(/\D/g, "").slice(0, 10) }))} />
            {editing && changedEmail && <TextField required type="password" label="மின்னஞ்சலை மாற்ற தற்போதைய கடவுச்சொல்" value={form.currentPassword} onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))} />}
            {editing && <Stack direction="row" spacing={2}><Button type="submit" variant="contained" disabled={loading}>{loading ? "சேமிக்கப்படுகிறது…" : "மாற்றங்களைச் சேமிக்க"}</Button><Button color="inherit" onClick={() => { setEditing(false); setForm({ name: user.name, email: user.email, phone: user.phone, currentPassword: "" }); }}>ரத்து</Button></Stack>}
          </Stack>
        </>}
      </Box>
    </Paper>
    <AddressManager />
  </Container>;
};

export default Profile;
