import { useEffect, useState, type ElementType, type FormEvent, type MouseEvent } from "react";
import { AppBar, Avatar, Badge, Box, Button, Container, Divider, Drawer, IconButton, InputBase, List, ListItemButton, ListItemText as MuiListItemText, Menu, MenuItem, Stack, Toolbar, Tooltip, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/store";
import { logout } from "../store/slices/authSlice";
import { getCart, getGuestCart } from "../services/cartService";
import SiteFooter from "../components/SiteFooter";
import AnnouncementBar from "../components/AnnouncementBar";

const ListItemText: ElementType = MuiListItemText;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const navItems = [["முகப்பு", "/"], ["நூல்கள்", "/books"], ["வகைகள்", "/categories"], ["எங்களைப் பற்றி", "/about"], ["தொடர்பு", "/contact"]];
  const user = useSelector((state: RootState) => state.auth.user);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const initials = user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";

  useEffect(() => {
    const updateCount = () => {
      if (!user) { setCartCount(getGuestCart().cartItems.reduce((sum, item) => sum + item.quantity, 0)); return; }
      void getCart().then((cart) => setCartCount(cart.cartItems.reduce((sum, item) => sum + item.quantity, 0))).catch(() => setCartCount(0));
    };
    updateCount();
    window.addEventListener("guest-cart-updated", updateCount);
    return () => window.removeEventListener("guest-cart-updated", updateCount);
  }, [user, location.pathname]);

  const search = (event: FormEvent) => { event.preventDefault(); if (query.trim()) navigate(`/books?search=${encodeURIComponent(query.trim())}`); };
  const openMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const signOut = async () => { setAnchorEl(null); await dispatch(logout()); navigate("/"); };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AnnouncementBar />
      <Box sx={{ display: "none", bgcolor: "primary.dark", color: "rgba(255,255,255,.82)", py: .8 }}><Container maxWidth="xl"><Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}><Typography variant="caption">₹1,000-க்கு மேல் இலவச விநியோகம்</Typography><Typography variant="caption" sx={{ display: { xs: "none", sm: "block" } }}>தேர்ந்தெடுக்கப்பட்ட தமிழ் நூல்கள் · பாதுகாப்பான UPI கட்டணம்</Typography></Stack></Container></Box>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ bgcolor: "rgba(255,252,247,.94)", borderBottom: "1px solid rgba(30,64,175,.1)" }}>
        <Container maxWidth="xl" sx={{ "& > .MuiStack-root": { display: { xs: "none", md: "flex" } } }}>
          <Toolbar disableGutters sx={{ minHeight: 76, gap: { xs: 1, md: 3 }, flexWrap: { xs: "wrap", md: "nowrap" }, py: { xs: 1, md: 0 }, position: "relative" }}>
            <IconButton aria-label="வழிசெலுத்தல் பட்டியலைத் திறக்க" onClick={() => setMobileNavOpen(true)} sx={{ display: { xs: "inline-flex", md: "none" }, color: "primary.dark" }}><MenuIcon /></IconButton>
            <Stack direction="row" spacing={1.2} onClick={() => navigate("/")} sx={{ alignItems: "center", cursor: "pointer", flexShrink: 0 }}><Box component="img" src="/thooral-logo.jpeg" alt="தூறல் பதிப்பகம்" sx={{ width: { xs: 58, sm: 76 }, height: { xs: 44, sm: 57 }, objectFit: "contain", flexShrink: 0 }} /><Typography color="primary.dark" sx={{ display: { xs: "none", sm: "block" }, fontWeight: 900, fontSize: 18, whiteSpace: "nowrap" }}>தூறல் பதிப்பகம்</Typography></Stack>
            <Box component="form" onSubmit={search} sx={{ flex: { xs: 1, md: "none" }, flexBasis: { xs: "100%", md: "auto" }, order: { xs: 10, md: "initial" }, position: { md: "absolute" }, left: { md: "50%" }, transform: { md: "translateX(-50%)" }, width: { md: "min(42vw, 600px)" }, height: { xs: 38, md: 44 }, display: "flex", alignItems: "center", bgcolor: "rgba(30,64,175,.05)", border: "1px solid rgba(30,64,175,.1)", borderRadius: 99, px: { xs: 1.5, md: 2 } }}><SearchIcon sx={{ color: "text.secondary", mr: 1 }} /><InputBase fullWidth value={query} onChange={(event) => setQuery(event.target.value)} placeholder="நூல் அல்லது ஆசிரியரைத் தேடுங்கள்" inputProps={{ "aria-label": "நூல்களைத் தேடுக" }} /></Box>
            <Stack direction="row" spacing={.5} sx={{ alignItems: "center", ml: "auto" }}>
              {user ? <><Button color="inherit" onClick={openMenu} startIcon={<Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 13, fontWeight: 800 }}>{initials}</Avatar>} endIcon={<KeyboardArrowDownIcon />} sx={{ display: { xs: "none", sm: "flex" }, color: "primary.dark" }}>{user.name.split(" ")[0]}</Button><Tooltip title={user.name}><IconButton onClick={openMenu} sx={{ display: { xs: "flex", sm: "none" } }}><Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 13 }}>{initials}</Avatar></IconButton></Tooltip></> : <Button variant="outlined" onClick={() => navigate("/login")}>உள்நுழைக</Button>}
              <Tooltip title="வாங்கும் கூடை"><IconButton color="inherit" onClick={() => navigate("/cart")}><Badge badgeContent={cartCount} color="secondary"><ShoppingBagOutlinedIcon /></Badge></IconButton></Tooltip>
            </Stack>
          </Toolbar>
          <Stack direction="row" spacing={{ xs: .5, sm: 1.5, md: 3.5 }} sx={{ overflowX: "auto", pb: { xs: 1.5, md: 1.25 }, justifyContent: { xs: "flex-start", md: "center" }, borderTop: { md: "1px solid rgba(30,64,175,.06)" }, pt: { md: 1.15 }, "&::-webkit-scrollbar": { display: "none" } }}>{navItems.map(([label, path]) => <Button key={path} onClick={() => navigate(path)} color="inherit" sx={{ flexShrink: 0, minWidth: "auto", px: { xs: 1.5, md: 1.8 }, py: { md: .75 }, fontWeight: location.pathname === path ? 800 : 650, color: location.pathname === path ? "primary.main" : "text.secondary", position: "relative", borderRadius: 99, bgcolor: { md: location.pathname === path ? "rgba(30,64,175,.07)" : "transparent" }, "&:hover": { color: "primary.main", bgcolor: "rgba(30,64,175,.055)" }, "&::after": { content: '""', position: "absolute", left: "50%", bottom: { xs: -3, md: -7 }, width: location.pathname === path ? 5 : 0, height: 5, borderRadius: 99, bgcolor: "secondary.dark", transform: "translateX(-50%)", transition: "width .2s ease" } }}>{label}</Button>)}</Stack>
        </Container>
      </AppBar>

      <Drawer anchor="left" open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { md: "none" }, "& .MuiDrawer-paper": { width: "min(86vw, 320px)", bgcolor: "#fffdf9" } }}>
        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Box component="img" src="/thooral-logo.jpeg" alt="தூறல் பதிப்பகம்" onClick={() => { setMobileNavOpen(false); navigate("/"); }} sx={{ width: 88, height: 66, objectFit: "contain", cursor: "pointer" }} />
            <IconButton aria-label="வழிசெலுத்தல் பட்டியலை மூடுக" onClick={() => setMobileNavOpen(false)}><CloseIcon /></IconButton>
          </Stack>
        </Box>
        <Divider />
        <List sx={{ px: 1.5, py: 2 }}>
          {navItems.map(([label, path]) => <ListItemButton key={path} selected={location.pathname === path} onClick={() => { navigate(path); setMobileNavOpen(false); }} sx={{ borderRadius: 2.5, mb: .5, px: 2, "&.Mui-selected": { bgcolor: "rgba(30,64,175,.09)", color: "primary.main" } }}><ListItemText primary={label} slotProps={{ fontWeight: location.pathname === path ? 800 : 650 }} /></ListItemButton>)}
        </List>
        <Box sx={{ mt: "auto", p: 2.5 }}><Button fullWidth variant="outlined" onClick={() => { setMobileNavOpen(false); navigate("/cart"); }}>வாங்கும் கூடை</Button></Box>
      </Drawer>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} slotProps={{ paper: { sx: { mt: 1, minWidth: 220, borderRadius: 2.5, boxShadow: "0 16px 45px rgba(30,64,175,.16)" } } }}><Box sx={{ px: 2, py: 1.5 }}><Typography sx={{ fontWeight: 800 }}>{user?.name}</Typography><Typography variant="caption" color="text.secondary">{user?.email}</Typography></Box><Divider />{(user?.role === "admin" || (user?.role === "staff" && user.staffApproval === "approved")) && <MenuItem onClick={() => { setAnchorEl(null); navigate("/admin"); }}><DashboardOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />நிர்வாகப் பலகை</MenuItem>}<MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }}><PersonOutlineOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />சுயவிவரம்</MenuItem><MenuItem onClick={() => { setAnchorEl(null); navigate("/change-password"); }}><LockResetOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />கடவுச்சொல் மாற்றம்</MenuItem><MenuItem onClick={() => void signOut()}><LogoutOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />வெளியேறு</MenuItem></Menu>

      <Box component="main" sx={{ minHeight: "68vh" }}><Outlet /></Box>

      <Box component="footer" sx={{ display: "none", bgcolor: "primary.dark", color: "white", mt: 10 }}>
        <Container maxWidth="xl" sx={{ py: { xs: 6, md: 8 } }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={5} sx={{ justifyContent: "space-between" }}>
            <Box sx={{ maxWidth: 390 }}><Stack direction="row" spacing={1.2} sx={{ alignItems: "center" }}><Box sx={{ width: 42, height: 42, bgcolor: "secondary.main", color: "primary.dark", borderRadius: 2, display: "grid", placeItems: "center" }}><AutoStoriesOutlinedIcon /></Box><Typography variant="h5" sx={{ fontWeight: 900 }}>தூறல் பதிப்பகம்</Typography></Stack><Typography sx={{ mt: 2, color: "rgba(255,255,255,.65)", lineHeight: 1.8 }}>தமிழ் வாசகர்களுக்கான தரமான நூல்களை அன்புடன் தேர்ந்தெடுத்து வழங்குகிறோம். நினைவில் நிற்கும் கதைகளையும் சிந்தனைகளையும் கண்டறியுங்கள்.</Typography><Stack direction="row" spacing={3} sx={{ mt: 3 }}><Stack direction="row" spacing={1}><LocalShippingOutlinedIcon color="secondary" /><Typography variant="body2">நம்பகமான விநியோகம்</Typography></Stack><Stack direction="row" spacing={1}><VerifiedUserOutlinedIcon color="secondary" /><Typography variant="body2">பாதுகாப்பான கட்டணம்</Typography></Stack></Stack></Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 4, sm: 8 }}>
              <FooterLinks title="ஆராயுங்கள்" links={[["அனைத்து நூல்கள்", "/books"], ["நூல் வகைகள்", "/categories"], ["புதிய வரவுகள்", "/books"]]} navigate={navigate} />
              <FooterLinks title="நிறுவனம்" links={[["எங்கள் கதை", "/about"], ["தொடர்பு", "/contact"]]} navigate={navigate} />
              <Box><Typography sx={{ fontWeight: 800, mb: 2 }}>தொடர்பு</Typography><Typography variant="body2" sx={{ color: "rgba(255,255,255,.65)", lineHeight: 2 }}>support@thooralpathippagam.in<br />திங்கள்–சனி, காலை 9–மாலை 6<br />தமிழ்நாடு, இந்தியா</Typography></Box>
            </Stack>
          </Stack>
          <Divider sx={{ borderColor: "rgba(255,255,255,.12)", my: 5 }} /><Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between" }}><Typography variant="caption" sx={{ color: "rgba(255,255,255,.5)" }}>© 2026 தூறல் பதிப்பகம். All rights reserved.</Typography><Typography variant="caption" sx={{ color: "rgba(255,255,255,.5)" }}>தமிழ் வாசகர்களுக்காக, ஒவ்வொரு பக்கமாக.</Typography></Stack>
        </Container>
      </Box>
      <SiteFooter />
    </Box>
  );
};

const FooterLinks = ({ title, links, navigate }: { title: string; links: string[][]; navigate: (path: string) => void }) => <Box><Typography sx={{ fontWeight: 800, mb: 1.5 }}>{title}</Typography><Stack>{links.map(([label, path]) => <Button key={label} color="inherit" onClick={() => navigate(path)} sx={{ justifyContent: "flex-start", px: 0, py: .5, color: "rgba(255,255,255,.65)" }}>{label}</Button>)}</Stack></Box>;
export default MainLayout;
