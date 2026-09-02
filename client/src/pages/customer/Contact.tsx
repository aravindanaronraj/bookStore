import { useState, type ChangeEvent, type FormEvent } from "react";
import { Alert, Box, Button, Container, Grid, Paper, Stack, TextField, Typography } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import api from "../../api/axios";

const emptyForm = { name: "", email: "", subject: "", message: "" };

const Contact = () => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const update = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setSent(false);
    setError("");
    try {
      await api.post("/contact", form);
      setForm(emptyForm);
      setSent(true);
    } catch (requestError: unknown) {
      const responseError = requestError as { response?: { data?: { message?: string } } };
      setError(responseError.response?.data?.message || "செய்தியை அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.");
    } finally {
      setLoading(false);
    }
  };

  const contactDetails = [
    { icon: <EmailOutlinedIcon />, title: "Email", text: "support@thooralpathippagam.in" },
    { icon: <PhoneOutlinedIcon />, title: "Phone", text: "+91 98765 43210" },
    { icon: <LocationOnOutlinedIcon />, title: "முகவரி", text: "சென்னை, தமிழ்நாடு, இந்தியா" },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
      <Typography variant="overline" color="secondary.dark" sx={{ fontWeight: 800 }}>உங்களுடன் பேச விரும்புகிறோம்</Typography>
      <Typography variant="h2" sx={{ fontWeight: 900, mt: 1 }}>தொடர்பு</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 5 }}>நூல்கள், ஆர்டர்கள் அல்லது பதிப்பு தொடர்பான கேள்விகளுக்கு எங்களை அணுகுங்கள்.</Typography>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2}>
            {contactDetails.map(({ icon, title, text }) => (
              <Paper key={title} elevation={0} sx={{ p: 3, border: "1px solid rgba(30,64,175,.1)", borderRadius: 3 }}>
                <Stack direction="row" spacing={2}><Box sx={{ color: "primary.main" }}>{icon}</Box><Box><Typography sx={{ fontWeight: 800 }}>{title}</Typography><Typography color="text.secondary">{text}</Typography></Box></Stack>
              </Paper>
            ))}
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper component="form" onSubmit={submit} elevation={0} sx={{ p: { xs: 3, md: 4 }, border: "1px solid rgba(30,64,175,.1)", borderRadius: 4 }}>
            {sent && <Alert severity="success" sx={{ mb: 3 }}>உங்கள் Message பெறப்பட்டது. விரைவில் தொடர்புகொள்கிறோம்.</Alert>}
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            <Stack spacing={2}>
              <TextField required label="Name" value={form.name} onChange={update("name")} slotProps={{ htmlInput: { maxLength: 100 } }} />
              <TextField required type="email" label="மின்னஞ்சல்" value={form.email} onChange={update("email")} />
              <TextField required label="Title" value={form.subject} onChange={update("subject")} slotProps={{ htmlInput: { maxLength: 200 } }} />
              <TextField required multiline minRows={5} label="உங்கள் Message" value={form.message} onChange={update("message")} slotProps={{ htmlInput: { maxLength: 3000 } }} />
              <Button type="submit" variant="contained" size="large" disabled={loading}>{loading ? "அனுப்பப்படுகிறது..." : "Messageயை அனுப்புக"}</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Contact;
