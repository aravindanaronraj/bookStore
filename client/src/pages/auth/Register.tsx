import { useState, type ComponentProps, type FormEvent, type InputHTMLAttributes } from "react";
import { Alert, Box, Button, Link, Stack, TextField as MuiTextField, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { registerUser, resendVerification, verifyRegistrationOtp } from "../../services/authService";
import { getErrorMessage } from "../../utils/getErrorMessage";

type CompatibleTextFieldProps = ComponentProps<typeof MuiTextField> & {
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
};
const TextField = (props: CompatibleTextFieldProps) => <MuiTextField {...props} />;

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [otp, setOtp] = useState(""); const [verification, setVerification] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const change = (name: keyof typeof form, value: string) => setForm((current) => ({ ...current, [name]: value }));
  const submit = async (event: FormEvent) => { event.preventDefault(); if (form.password !== form.confirmPassword) { setError("கடவுச்சொற்கள் பொருந்தவில்லை"); return; } try { setLoading(true); setError(""); await registerUser({ name: form.name, email: form.email, phone: form.phone, password: form.password }); setVerification(true); setMessage("மின்னஞ்சலுக்கு அனுப்பப்பட்ட 6 இலக்கக் குறியீட்டை உள்ளிடுங்கள்."); } catch (e: unknown) { setError(getErrorMessage(e, "பதிவு செய்ய முடியவில்லை")); } finally { setLoading(false); } };
  const verify = async () => { try { setLoading(true); setError(""); await verifyRegistrationOtp(form.email, otp); setMessage("Email Confirmed. இப்போது உள்நுழையலாம்."); setTimeout(() => navigate("/login", { state: location.state }), 1200); } catch (e: unknown) { setError(getErrorMessage(e, "குறியீட்டைச் சரிபார்க்க முடியவில்லை")); } finally { setLoading(false); } };
  if (verification) return <Stack spacing={2.5}><Typography variant="h5" sx={{ fontWeight: 800 }}>மின்னஞ்சலை உறுதிசெய்யுங்கள்</Typography>{message && <Alert severity="info">{message}</Alert>}{error && <Alert severity="error">{error}</Alert>}<TextField label="6 இலக்க OTP" value={otp} inputProps={{ maxLength: 6, inputMode: "numeric" }} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} /><Button variant="contained" disabled={loading || otp.length !== 6} onClick={() => void verify()}>{loading ? "சரிபார்க்கப்படுகிறது…" : "உறுதிசெய்க"}</Button><Button onClick={() => void resendVerification(form.email)}>குறியீட்டை மீண்டும் அனுப்புக</Button></Stack>;
  return <Box component="form" onSubmit={submit}><Typography variant="h5" sx={{ fontWeight: 800 }}>புதிய கணக்கு</Typography><Typography color="text.secondary" sx={{ mt: .5, mb: 3 }}>தூறல் பதிப்பக வாசகர் குடும்பத்தில் இணையுங்கள்.</Typography>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Stack spacing={2}><TextField required label="முழுப் பெயர்" value={form.name} onChange={(e) => change("name", e.target.value)} /><TextField required type="email" label="மின்னஞ்சல்" value={form.email} onChange={(e) => change("email", e.target.value)} /><TextField required label="10 இலக்க கைபேசி எண்" value={form.phone} inputProps={{ maxLength: 10 }} onChange={(e) => change("phone", e.target.value.replace(/\D/g, ""))} /><TextField required type="password" label="கடவுச்சொல்" helperText="குறைந்தது 8 எழுத்துகள்; பெரிய, சிறிய எழுத்து மற்றும் எண் தேவை" value={form.password} onChange={(e) => change("password", e.target.value)} /><TextField required type="password" label="கடவுச்சொல்லை மீண்டும் உள்ளிடுக" value={form.confirmPassword} onChange={(e) => change("confirmPassword", e.target.value)} /><Button type="submit" variant="contained" size="large" disabled={loading}>{loading ? "பதிவு செய்யப்படுகிறது…" : "கணக்கு உருவாக்குக"}</Button><Typography variant="body2" sx={{ textAlign: "center" }}>ஏற்கனவே கணக்கு உள்ளதா? <Link href="/login">உள்நுழைக</Link></Typography></Stack></Box>;
};
export default Register;
