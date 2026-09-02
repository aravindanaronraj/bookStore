import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Container, Divider, FormControlLabel, Grid, IconButton, Paper, Radio, Stack, TextField, Tooltip, Typography } from "@mui/material";
import AddLocationAltOutlinedIcon from "@mui/icons-material/AddLocationAltOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import type { RootState } from "../../store/store";
import { createAddress, deleteAddress, getAddresses, updateAddress, type Address, type AddressInput } from "../../services/addressService";
import { getCart, type CartData } from "../../services/cartService";
import { createOrder, verifyPayment, type RazorpaySuccessResponse } from "../../services/orderService";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { applyCoupon } from "../../services/couponService";

interface RazorpayOptions {
  key: string; amount: number | string; currency: string; name: string; description: string; order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  prefill: { name?: string; email?: string; contact?: string };
  theme: { color: string }; modal: { ondismiss: () => void };
}
interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", callback: (response: { error?: { description?: string } }) => void) => void;
}
declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => RazorpayInstance; } }

const emptyAddress: AddressInput = { fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "India", isDefault: true };

const loadRazorpay = async () => {
  if (window.Razorpay) return true;
  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) { existing.addEventListener("load", () => resolve(true), { once: true }); existing.addEventListener("error", () => resolve(false), { once: true }); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [form, setForm] = useState<AddressInput>(emptyAddress);
  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCheckout = async () => {
      try {
        const [cartData, addressData] = await Promise.all([getCart(), getAddresses()]);
        setCart(cartData);
        setAddresses(addressData);
        const preferred = addressData.find((address) => address.isDefault) || addressData[0];
        setSelectedAddressId(preferred?._id || "");
        setShowForm(addressData.length === 0);
      } catch (loadError: unknown) {
        setError(getErrorMessage(loadError, "கட்டணப் பக்கத்தை ஏற்ற முடியவில்லை"));
      } finally { setLoading(false); }
    };
    void loadCheckout();
  }, []);

  const subtotal = useMemo(() => cart?.cartItems.reduce((sum, item) => sum + (item.book.salePrice ?? item.book.price) * item.quantity, 0) ?? 0, [cart]);
  const estimatedShipping = subtotal >= 1000 ? 0 : 50;
  const applyCouponCode = async () => { if (!couponCode.trim()) { setError("கூப்பன் குறியீட்டை உள்ளிடவும்"); return; } try { setCouponApplying(true); setError(""); setCouponMessage(""); const result = await applyCoupon(couponCode.trim(), subtotal); setCouponDiscount(result.discount); setCouponCode(result.coupon.code); setCouponMessage(`கூப்பன் பயன்படுத்தப்பட்டது. ₹${result.discount.toFixed(2)} off கிடைத்தது.`); } catch (couponError: unknown) { setCouponDiscount(0); setError(getErrorMessage(couponError, "கூப்பனைப் பயன்படுத்த முடியவில்லை")); } finally { setCouponApplying(false); } };
  const handleAddressChange = (field: keyof AddressInput, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleSaveAddress = async () => {
    try {
      setSavingAddress(true); setError("");
      const address = editingAddressId ? await updateAddress(editingAddressId, form) : await createAddress(form);
      setAddresses((current) => editingAddressId ? current.map((item) => item._id === address._id ? address : item) : [address, ...current]);
      setSelectedAddressId(address._id); setShowForm(false); setForm(emptyAddress);
      setEditingAddressId("");
    } catch (saveError: unknown) { setError(getErrorMessage(saveError, "முகவரியைச் சேமிக்க முடியவில்லை")); }
    finally { setSavingAddress(false); }
  };

  const editAddress = (address: Address) => { setEditingAddressId(address._id); setForm({ fullName: address.fullName, phone: address.phone, addressLine1: address.addressLine1, addressLine2: address.addressLine2 || "", city: address.city, state: address.state, postalCode: address.postalCode, country: address.country, isDefault: address.isDefault }); setShowForm(true); };
  const removeAddress = async (id: string) => { try { setError(""); await deleteAddress(id); const next = addresses.filter((address) => address._id !== id); setAddresses(next); if (selectedAddressId === id) setSelectedAddressId(next.find((address) => address.isDefault)?._id || next[0]?._id || ""); } catch (deleteError: unknown) { setError(getErrorMessage(deleteError, "முகவரியை நீக்க முடியவில்லை")); } };

  const handlePayment = async () => {
    if (!selectedAddressId) { setError("முதலில் விநியோக முகவரியைத் தேர்ந்தெடுக்கவும் அல்லது சேர்க்கவும்"); return; }
    try {
      setPaying(true); setError("");
      if (!(await loadRazorpay()) || !window.Razorpay) throw new Error("Razorpay கட்டணச் சேவையை ஏற்ற முடியவில்லை. இணைய இணைப்பைச் சரிபார்க்கவும்.");
      const checkout = await createOrder(selectedAddressId, couponDiscount > 0 ? couponCode.trim() : undefined);
      const selectedAddress = addresses.find((address) => address._id === selectedAddressId);
      const razorpay = new window.Razorpay({
        key: checkout.razorpay.key, amount: checkout.razorpay.amount, currency: checkout.razorpay.currency,
        name: "தூறல் பதிப்பகம்", description: `ஆர்டர் ${checkout.order.id}-க்கான கட்டணம்`, order_id: checkout.razorpay.orderId,
        handler: async (paymentResponse) => {
          try {
            await verifyPayment(paymentResponse); setSuccess(true);
            setCart((current) => current ? { ...current, cartItems: [] } : current);
          } catch (verificationError: unknown) {
            setError(getErrorMessage(verificationError, "கட்டணம் பெறப்பட்டது; ஆனால் உறுதிப்படுத்தல் தோல்வியடைந்தது. உங்கள் கட்டண எண்ணுடன் ஆதரவைத் தொடர்புகொள்ளவும்."));
          } finally { setPaying(false); }
        },
        prefill: { name: selectedAddress?.fullName || user?.name, email: user?.email, contact: selectedAddress?.phone || user?.phone },
        theme: { color: "#1E40AF" }, modal: { ondismiss: () => setPaying(false) },
      });
      razorpay.on("payment.failed", (response) => { setError(response.error?.description || "கட்டணம் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்."); setPaying(false); });
      razorpay.open();
    } catch (paymentError: unknown) { setError(getErrorMessage(paymentError, "கட்டணத்தைத் தொடங்க முடியவில்லை")); setPaying(false); }
  };

  if (loading) return <Box sx={{ minHeight: 500, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  if (success) return <Container maxWidth="sm" sx={{ py: 12 }}><Paper elevation={0} sx={{ p: { xs: 4, md: 7 }, textAlign: "center", borderRadius: 4, border: "1px solid rgba(30,64,175,.1)" }}><CheckCircleOutlinedIcon color="success" sx={{ fontSize: 72 }} /><Typography variant="h3" sx={{ mt: 2, fontWeight: 800 }}>கட்டணம் வெற்றிகரமாக முடிந்தது</Typography><Typography color="text.secondary" sx={{ mt: 2 }}>உங்கள் ஆர்டர் உறுதிசெய்யப்பட்டது. விரைவில் அனுப்பி வைக்கப்படும்.</Typography><Button variant="contained" size="large" sx={{ mt: 4 }} onClick={() => navigate("/")}>தொடர்ந்து வாங்குங்கள்</Button></Paper></Container>;
  if (!cart || cart.cartItems.length === 0) return <Container maxWidth="sm" sx={{ py: 12, textAlign: "center" }}><Typography variant="h3" sx={{ fontWeight: 800 }}>உங்கள் வாங்கும் கூடை காலியாக உள்ளது</Typography><Button variant="contained" sx={{ mt: 3 }} onClick={() => navigate("/books")}>நூல்களைப் பாருங்கள்</Button></Container>;

  const fields: [keyof AddressInput, string][] = [["fullName", "முழுப் பெயர்"], ["phone", "தொலைபேசி"], ["addressLine1", "முகவரி வரி 1"], ["addressLine2", "முகவரி வரி 2 (விருப்பம்)"], ["city", "நகரம்"], ["state", "மாநிலம்"], ["postalCode", "அஞ்சல் குறியீடு"], ["country", "நாடு"]];
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 7 } }}>
      <Typography variant="overline" color="secondary.dark" sx={{ fontWeight: 800 }}>பாதுகாப்பான கட்டணம்</Typography>
      <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: "-.03em", mb: 4 }}>உங்கள் ஆர்டரை நிறைவு செய்யுங்கள்</Typography>
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 3 }}>{error}</Alert>}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 8 }}><Stack spacing={3}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: "1px solid rgba(30,64,175,.1)" }}>
            <Stack direction="row" sx={{ mb: 3, justifyContent: "space-between", alignItems: "center" }}><Typography variant="h5" sx={{ fontWeight: 800 }}>விநியோக முகவரி</Typography><Button startIcon={<AddLocationAltOutlinedIcon />} onClick={() => { setEditingAddressId(""); setForm({ ...emptyAddress, isDefault: addresses.length === 0 }); setShowForm(true); }}>புதிய முகவரி</Button></Stack>
            {!showForm && <Grid container spacing={2}>{addresses.map((address) => <Grid key={address._id} size={{ xs: 12, md: 6 }}><Paper variant="outlined" onClick={() => setSelectedAddressId(address._id)} sx={{ p: 2.5, height: "100%", cursor: "pointer", borderWidth: 2, borderColor: selectedAddressId === address._id ? "primary.main" : "divider" }}><FormControlLabel value={address._id} control={<Radio checked={selectedAddressId === address._id} />} label={<Typography sx={{ fontWeight: 800 }}>{address.fullName}</Typography>} /><Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}<br />{address.city}, {address.state} {address.postalCode}<br />{address.phone}</Typography><Stack direction="row" sx={{ mt: 1.5, pl: 3.5 }}><Tooltip title="திருத்து"><IconButton size="small" onClick={(event) => { event.stopPropagation(); editAddress(address); }}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="நீக்கு"><IconButton size="small" color="error" onClick={(event) => { event.stopPropagation(); if (window.confirm("இந்த முகவரியை நீக்க வேண்டுமா?")) void removeAddress(address._id); }}><DeleteOutlinedIcon fontSize="small" /></IconButton></Tooltip></Stack></Paper></Grid>)}</Grid>}
            {showForm && <Grid container spacing={2}>{fields.map(([field, label]) => <Grid key={field} size={{ xs: 12, sm: field.startsWith("addressLine") ? 12 : 6 }}><TextField required={field !== "addressLine2"} label={label} value={String(form[field] ?? "")} onChange={(event) => handleAddressChange(field, event.target.value)} /></Grid>)}<Grid size={{ xs: 12 }}><Stack direction="row" spacing={2}><Button variant="contained" disabled={savingAddress} onClick={handleSaveAddress}>{savingAddress ? "சேமிக்கப்படுகிறது…" : editingAddressId ? "முகவரியைப் புதுப்பிக்க" : "முகவரியைச் சேமிக்க"}</Button>{addresses.length > 0 && <Button onClick={() => { setShowForm(false); setEditingAddressId(""); setForm(emptyAddress); }}>ரத்து செய்க</Button>}</Stack></Grid></Grid>}
          </Paper>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: "1px solid rgba(30,64,175,.1)" }}><Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>நூல்கள்</Typography><Stack divider={<Divider flexItem />} spacing={2}>{cart.cartItems.map((item) => <Stack key={item.book._id} direction="row" spacing={2}><Box component="img" src={item.book.images?.[0]?.url || "/placeholder-book.png"} alt={item.book.title} sx={{ width: 64, height: 82, objectFit: "contain", bgcolor: "#EFE9DD", borderRadius: 2 }} /><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 800 }}>{item.book.title}</Typography><Typography variant="body2" color="text.secondary">{item.book.author} · எண்ணிக்கை {item.quantity}</Typography></Box><Typography sx={{ fontWeight: 800 }}>₹{((item.book.salePrice ?? item.book.price) * item.quantity).toFixed(2)}</Typography></Stack>)}</Stack></Paper>
        </Stack></Grid>
        <Grid size={{ xs: 12, lg: 4 }}><Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: "1px solid rgba(30,64,175,.1)", position: { lg: "sticky" }, top: 110 }}><Typography variant="h5" sx={{ fontWeight: 800 }}>ஆர்டர் சுருக்கம்</Typography><TextField label="சலுகைக் குறியீடு" value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setCouponDiscount(0); setCouponMessage(""); }} sx={{ mt: 3 }} helperText="இறுதித் தள்ளுபடிக் கட்டணத்திற்கு முன் பாதுகாப்பாகச் சரிபார்க்கப்படும்." /><Button fullWidth variant="outlined" disabled={couponApplying || !couponCode.trim()} onClick={() => void applyCouponCode()} sx={{ mt: 1.25 }}>{couponApplying ? "சரிபார்க்கிறது…" : "கூப்பனைப் பயன்படுத்து"}</Button>{couponMessage && <Alert severity="success" sx={{ mt: 1.5 }}>{couponMessage}</Alert>}<Stack spacing={1.5} sx={{ my: 3 }}><Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography color="text.secondary">இடைத்தொகை</Typography><Typography>₹{subtotal.toFixed(2)}</Typography></Stack><Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography color="text.secondary">விநியோகம்</Typography><Typography>{estimatedShipping === 0 ? "இலவசம்" : `₹${estimatedShipping.toFixed(2)}`}</Typography></Stack>{couponDiscount > 0 && <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography color="success.main">கூப்பன் தள்ளுபடி</Typography><Typography color="success.main" sx={{ fontWeight: 800 }}>−₹{couponDiscount.toFixed(2)}</Typography></Stack>}<Divider /><Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="h6" sx={{ fontWeight: 800 }}>மதிப்பிடப்பட்ட மொத்தம்</Typography><Typography variant="h6" sx={{ fontWeight: 800 }}>₹{Math.max(0, subtotal + estimatedShipping - couponDiscount).toFixed(2)}</Typography></Stack></Stack><Button fullWidth variant="contained" size="large" disabled={paying || showForm || !selectedAddressId} onClick={handlePayment} startIcon={paying ? <CircularProgress size={18} color="inherit" /> : <LockOutlinedIcon />}>{paying ? "கட்டணச் சாளரம் திறக்கப்படுகிறது…" : "Razorpay மூலம் பாதுகாப்பாகச் செலுத்துக"}</Button><Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 2 }}>இறுதித் தொகை சேவையகத்தில் கணக்கிடப்படுகிறது. உங்கள் கட்டண விவரங்கள் எங்கள் சேவையகத்தை அடையாது.</Typography></Paper></Grid>
      </Grid>
    </Container>
  );
};

export default Checkout;
