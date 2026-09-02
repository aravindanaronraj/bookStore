import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { getSiteContent, type SiteContent } from "../services/adminService";

const fallback: SiteContent["announcement"] = { enabled: true, messages: ["₹1,000-க்கு மேல் இலவச விநியோகம்", "தேர்ந்தெடுக்கப்பட்ட தமிழ் நூல்கள்", "பாதுகாப்பான UPI கட்டணம்"], speed: 24, fontSize: 13, textColor: "#FFFFFF", backgroundColor: "#172554" };
const AnnouncementBar = () => {
  const [settings, setSettings] = useState(fallback);
  useEffect(() => { void getSiteContent().then((content) => setSettings(content.announcement)).catch(() => undefined); }, []);
  if (!settings.enabled || settings.messages.length === 0) return null;
  return <Box sx={{ overflow: "hidden", bgcolor: settings.backgroundColor, color: settings.textColor, whiteSpace: "nowrap", py: .85, "&:hover .ticker-track": { animationPlayState: "paused" }, "@keyframes announcement-scroll": { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } } }}><Box className="ticker-track" sx={{ display: "inline-flex", minWidth: "max-content", animation: `announcement-scroll ${settings.speed}s linear infinite`, willChange: "transform" }}>{[...settings.messages, ...settings.messages].map((message, index) => <Box component="span" key={`${index}-${message}`} sx={{ fontSize: `${settings.fontSize}px`, fontWeight: 650, px: { xs: 3, md: 6 } }}>{message}<Box component="span" sx={{ ml: { xs: 3, md: 6 }, opacity: .55 }}>◆</Box></Box>)}</Box></Box>;
};
export default AnnouncementBar;
