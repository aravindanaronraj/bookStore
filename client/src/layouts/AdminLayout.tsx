import { useState } from "react";
import { Avatar, Box, Divider, Drawer, IconButton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import WebOutlinedIcon from "@mui/icons-material/WebOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/store";
import { logout } from "../store/slices/authSlice";

const desktopWidth = 264;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const initials = user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "A";
  const currentView = new URLSearchParams(location.search).get("view") || "overview";

  const allItems = [
    { label: "Overview", view: "overview", icon: <DashboardOutlinedIcon />, allowed: true },
    { label: "Performance", view: "performance", icon: <TrendingUpOutlinedIcon />, allowed: user?.role === "admin" || user?.permissions.includes("dashboard") },
    { label: "Books", view: "products", icon: <CategoryOutlinedIcon />, allowed: user?.role === "admin" || user?.permissions.includes("products") },
    { label: "Book categories", view: "categories", icon: <AccountTreeOutlinedIcon />, allowed: user?.role === "admin" },
    { label: "Inventory", view: "inventory", icon: <Inventory2OutlinedIcon />, allowed: user?.role === "admin" || user?.permissions.includes("products") },
    { label: "Orders", view: "orders", icon: <ReceiptLongOutlinedIcon />, allowed: user?.role === "admin" || user?.permissions.includes("orders") },
    { label: "Users & staff", view: "users", icon: <PeopleAltOutlinedIcon />, allowed: user?.role === "admin" },
    { label: "Site content", view: "content", icon: <WebOutlinedIcon />, allowed: user?.role === "admin" },
    { label: "Contact messages", view: "contacts", icon: <MailOutlineOutlinedIcon />, allowed: user?.role === "admin" },
    { label: "Coupons", view: "coupons", icon: <LocalOfferOutlinedIcon />, allowed: user?.role === "admin" },
  ].filter((item) => item.allowed);

  const goToView = (view: string) => { navigate(view === "overview" ? "/admin" : `/admin?view=${view}`); setMobileOpen(false); };
  const signOut = async () => { await dispatch(logout()); navigate("/"); };

  const sidebar = (
    <Box sx={{ height: "100%", minHeight: 0, bgcolor: "primary.dark", color: "white", p: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Stack direction="row" spacing={1.4} sx={{ alignItems: "center", px: 1, py: 1.25, flexShrink: 0 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2.2, bgcolor: "secondary.main", color: "primary.dark", display: "grid", placeItems: "center", flexShrink: 0 }}><MenuBookOutlinedIcon /></Box>
        <Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ fontWeight: 900, lineHeight: 1.1 }}>Thooral Publishing</Typography><Typography variant="caption" sx={{ opacity: .58 }}>Admin center</Typography></Box>
        {!desktop && <IconButton onClick={() => setMobileOpen(false)} sx={{ color: "white", ml: "auto" }}><CloseOutlinedIcon /></IconButton>}
      </Stack>
      <Divider sx={{ borderColor: "rgba(255,255,255,.12)", my: 2 }} />
      <Typography variant="caption" sx={{ px: 1.5, mb: 1, opacity: .45, letterSpacing: ".08em" }}>Workspace</Typography>
      <Stack component="nav" aria-label="Admin navigation" spacing={.6} sx={{ minHeight: 0, overflowY: "auto", pr: .5, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,.2)", borderRadius: 4 } }}>{allItems.map((item) => <Box key={item.view} component="button" type="button" aria-current={currentView === item.view ? "page" : undefined} onClick={() => goToView(item.view)} sx={{ width: "100%", flexShrink: 0, border: 0, display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1.2, borderRadius: 2, cursor: "pointer", font: "inherit", textAlign: "left", color: currentView === item.view ? "white" : "rgba(255,255,255,.7)", bgcolor: currentView === item.view ? "rgba(59,130,246,.28)" : "transparent", boxShadow: currentView === item.view ? "inset 3px 0 0 #60A5FA" : "none", transition: "background-color .18s ease, color .18s ease", "&:hover": { bgcolor: currentView === item.view ? "rgba(59,130,246,.34)" : "rgba(255,255,255,.08)", color: "white" }, "&:focus-visible": { outline: "2px solid #93C5FD", outlineOffset: -2 }, "& svg": { fontSize: 21 } }}>{item.icon}<Typography noWrap variant="body2" sx={{ fontWeight: currentView === item.view ? 800 : 600 }}>{item.label}</Typography></Box>)}</Stack>
      <Divider sx={{ borderColor: "rgba(255,255,255,.12)", my: 2 }} />
      <Box component="button" onClick={() => { navigate("/"); setMobileOpen(false); }} sx={{ border: 0, bgcolor: "transparent", color: "rgba(255,255,255,.65)", display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1.2, borderRadius: 2, cursor: "pointer", font: "inherit", "&:hover": { bgcolor: "rgba(255,255,255,.08)", color: "white" } }}><StorefrontOutlinedIcon fontSize="small" /><Typography variant="body2" sx={{ fontWeight: 600 }}>View online store</Typography></Box>
      <Box sx={{ flex: 1, minHeight: 12 }} />
      <Stack direction="row" spacing={1.3} sx={{ alignItems: "center", p: 1, borderRadius: 2, bgcolor: "rgba(255,255,255,.07)", flexShrink: 0 }}><Avatar sx={{ width: 38, height: 38, bgcolor: "secondary.main", color: "primary.dark", fontWeight: 900, fontSize: 14 }}>{initials}</Avatar><Box sx={{ minWidth: 0, flex: 1 }}><Typography noWrap variant="body2" sx={{ fontWeight: 800 }}>{user?.name}</Typography><Typography variant="caption" sx={{ opacity: .62 }}>{user?.role === "admin" ? "Administrator" : "Staff member"}</Typography></Box><Tooltip title="Sign out"><IconButton aria-label="Sign out" onClick={() => void signOut()} size="small" sx={{ color: "rgba(255,255,255,.75)" }}><LogoutOutlinedIcon fontSize="small" /></IconButton></Tooltip></Stack>
    </Box>
  );

  const currentLabel = allItems.find((item) => item.view === currentView)?.label || "Overview";
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F5F7FB", display: "flex" }}>
      {desktop ? <Drawer variant="permanent" open sx={{ width: desktopWidth, flexShrink: 0, "& .MuiDrawer-paper": { width: desktopWidth, border: 0 } }}>{sidebar}</Drawer> : <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ "& .MuiDrawer-paper": { width: "min(86vw, 290px)", border: 0 } }}>{sidebar}</Drawer>}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box component="header" sx={{ minHeight: { xs: 64, md: 72 }, bgcolor: "rgba(255,255,255,.94)", backdropFilter: "blur(16px)", borderBottom: "1px solid #E3E8E5", px: { xs: 1.5, sm: 2.5, lg: 4 }, display: "flex", alignItems: "center", gap: 1.5, position: "sticky", top: 0, zIndex: 10 }}>
          {!desktop && <IconButton onClick={() => setMobileOpen(true)} aria-label="Open admin navigation"><MenuOutlinedIcon /></IconButton>}
          <Box sx={{ minWidth: 0 }}><Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>Administration</Typography><Typography noWrap sx={{ fontWeight: 850 }}>{currentLabel}</Typography></Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", ml: "auto" }}><Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: 13 }}>{initials}</Avatar><Box sx={{ display: { xs: "none", sm: "block" } }}><Typography variant="body2" sx={{ fontWeight: 750 }}>{user?.name}</Typography><Typography variant="caption" color="text.secondary">{user?.role}</Typography></Box></Stack>
        </Box>
        <Box component="main" sx={{ p: { xs: 1.5, sm: 2.5, lg: 4 }, width: "100%", maxWidth: 1680, mx: "auto", overflowX: "hidden" }}><Outlet /></Box>
      </Box>
    </Box>
  );
};
export default AdminLayout;
