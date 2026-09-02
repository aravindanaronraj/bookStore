import { useEffect, useState, type ReactNode } from "react";
import { Box, Button, Container, Divider, Grid, Stack, Typography } from "@mui/material";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useNavigate } from "react-router-dom";
import { getSiteContent, type SiteContent } from "../services/adminService";

const SiteFooter = () => {
  const navigate = useNavigate();
  const [footer, setFooter] = useState<SiteContent["footer"] | null>(null);
  useEffect(() => { void getSiteContent().then((content) => setFooter(content.footer)).catch(() => undefined); }, []);
  const links = [["அனைத்து நூல்கள்", "/books"], ["நூல் வகைகள்", "/categories"], ["எங்களைப் பற்றி", "/about"], ["தொடர்பு", "/contact"]];
  return <Box component="footer" sx={{ mt: 10, color: "white", position: "relative", overflow: "hidden", background: "linear-gradient(145deg,#0f1f4d 0%,#1e40af 56%,#2563eb 100%)", "&::before": { content: '""', position: "absolute", width: 420, height: 420, borderRadius: "50%", bgcolor: "rgba(214,168,78,.07)", top: -240, right: -100 }, "&::after": { content: '""', position: "absolute", width: 280, height: 280, border: "1px solid rgba(255,255,255,.05)", borderRadius: "50%", bottom: -190, left: "34%" } }}>
    <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
      <Grid container spacing={2} sx={{ pt: { xs: 5, md: 6 }, mb: { xs: 5, md: 6 } }}>
        <TrustCard icon={<LocalShippingOutlinedIcon />} title="நம்பகமான விநியோகம்" text="தமிழ்நாடு முழுவதும் பாதுகாப்பான அனுப்புதல்" />
        <TrustCard icon={<VerifiedUserOutlinedIcon />} title="பாதுகாப்பான கட்டணம்" text="Razorpay பாதுகாப்புடன் எளிய UPI கட்டணம்" />
        <TrustCard icon={<AutoStoriesOutlinedIcon />} title="தேர்ந்தெடுத்த நூல்கள்" text="தமிழ் வாசகர்களுக்கான தரமான படைப்புகள்" />
      </Grid>
      <Grid container spacing={{ xs: 5, md: 7 }} sx={{ pb: { xs: 5, md: 7 } }}>
        <Grid size={{ xs: 12, lg: 5 }}><Box component="img" src="/thooral-logo.jpeg" alt="தூறல் பதிப்பகம்" onClick={() => navigate("/")} sx={{ width: 132, height: 132, display: "block", bgcolor: "white", borderRadius: "50%", objectFit: "cover", cursor: "pointer", boxShadow: "0 12px 30px rgba(0,0,0,.2)" }} /><Typography sx={{ mt: 2.5, maxWidth: 520, color: "rgba(255,255,255,.68)", lineHeight: 1.95 }}>{footer?.description || "தமிழ் வாசகர்களுக்கான தரமான நூல்களை அன்புடன் தேர்ந்தெடுத்து வழங்குகிறோம்."}</Typography><Button variant="contained" color="secondary" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate("/books")} sx={{ mt: 3, color: "primary.dark", fontWeight: 800, px: 2.5 }}>நூல்களை ஆராயுங்கள்</Button></Grid>
        <Grid size={{ xs: 12, sm: 5, lg: 2 }}><FooterHeading>விரைவு இணைப்புகள்</FooterHeading><Stack spacing={.25}>{links.map(([label, path]) => <Button key={path} color="inherit" onClick={() => navigate(path)} sx={{ justifyContent: "flex-start", px: 0, py: .75, width: "fit-content", color: "rgba(255,255,255,.66)", "&:hover": { color: "secondary.light", transform: "translateX(4px)", bgcolor: "transparent" }, transition: ".2s" }}>{label}</Button>)}</Stack></Grid>
        <Grid size={{ xs: 12, sm: 7, lg: 5 }}><FooterHeading>எங்களைத் தொடர்புகொள்ள</FooterHeading><Grid container spacing={1.5}><ContactItem icon={<EmailOutlinedIcon />} text={footer?.email || "support@thooralpathippagam.in"} /><ContactItem icon={<PhoneOutlinedIcon />} text={footer?.phone || "+91 98765 43210"} /><ContactItem icon={<AccessTimeOutlinedIcon />} text={footer?.workingHours || "திங்கள்–சனி, காலை 9–மாலை 6"} /><ContactItem icon={<LocationOnOutlinedIcon />} text={footer?.address || "தமிழ்நாடு, இந்தியா"} /></Grid></Grid>
      </Grid>
      <Divider sx={{ borderColor: "rgba(255,255,255,.1)" }} /><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ py: 2.5, justifyContent: "space-between", alignItems: { sm: "center" } }}><Typography variant="caption" sx={{ color: "rgba(255,255,255,.46)" }}>{footer?.copyright || "© 2026 தூறல் பதிப்பகம். All rights reserved."}</Typography><Typography variant="caption" sx={{ color: "rgba(255,255,255,.46)" }}>தமிழ் வாசிப்பை ஒவ்வொரு இல்லத்திற்கும் கொண்டு செல்கிறோம்.</Typography></Stack>
    </Container>
  </Box>;
};

const TrustCard = ({ icon, title, text }: { icon: ReactNode; title: string; text: string }) => <Grid size={{ xs: 12, md: 4 }}><Stack direction="row" spacing={2} sx={{ height: "100%", alignItems: "center", p: 2.5, bgcolor: "#fffdf9", color: "primary.dark", borderRadius: 3, border: "1px solid rgba(30,64,175,.09)", boxShadow: "0 14px 38px rgba(15,31,77,.14)" }}><Box sx={{ width: 46, height: 46, flexShrink: 0, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: "rgba(214,168,78,.17)", color: "secondary.dark" }}>{icon}</Box><Box><Typography sx={{ fontWeight: 850 }}>{title}</Typography><Typography variant="caption" color="text.secondary">{text}</Typography></Box></Stack></Grid>;
const FooterHeading = ({ children }: { children: ReactNode }) => <Typography sx={{ fontWeight: 850, mb: 2.2, position: "relative", pb: 1, "&::after": { content: '""', position: "absolute", left: 0, bottom: 0, width: 30, height: 2, borderRadius: 2, bgcolor: "secondary.main" } }}>{children}</Typography>;
const ContactItem = ({ icon, text }: { icon: ReactNode; text: string }) => <Grid size={{ xs: 12, sm: 6 }}><Stack direction="row" spacing={1.4} sx={{ alignItems: "flex-start", p: 1.5, height: "100%", borderRadius: 2, bgcolor: "rgba(255,255,255,.045)" }}><Box sx={{ color: "secondary.light", mt: .15, "& svg": { fontSize: 19 } }}>{icon}</Box><Typography variant="body2" sx={{ color: "rgba(255,255,255,.68)", lineHeight: 1.6, wordBreak: "break-word" }}>{text}</Typography></Stack></Grid>;
export default SiteFooter;
