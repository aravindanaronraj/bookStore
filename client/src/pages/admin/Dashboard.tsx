import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, FormControl, Grid, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { getAdminInventory, getAdminOrders, getAdminOverview, updateAdminOrderStatus, type AdminOrder, type AdminOverview, type OrderStatus } from "../../services/adminService";
import type { Book } from "../../services/bookService";
import { getErrorMessage } from "../../utils/getErrorMessage";
import Performance from "./Performance";
import Products from "./Products";
import Users from "./Users";
import SiteContent from "./SiteContent";
import Coupons from "./Coupons";
import Categories from "./Categories";
import Contacts from "./Contacts";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { useSearchParams } from "react-router-dom";

type View = "overview" | "performance" | "products" | "orders" | "inventory" | "users" | "content" | "contacts" | "coupons" | "categories";
const statuses: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const statusColor = (status: string): "default" | "success" | "warning" | "error" | "info" => status === "delivered" || status === "paid" ? "success" : status === "cancelled" || status === "failed" ? "error" : status === "shipped" || status === "processing" ? "info" : "warning";
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const statusLabel: Record<string, string> = { pending: "Pending", processing: "Processing", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", paid: "Paid", failed: "Failed", refunded: "Refunded" };

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [inventory, setInventory] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState("");
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const canManageOrders = currentUser?.role === "admin" || Boolean(currentUser?.permissions.includes("orders"));
  const canManageProducts = currentUser?.role === "admin" || Boolean(currentUser?.permissions.includes("products"));
  const requestedView = (searchParams.get("view") || "overview") as View;
  const permittedViews: View[] = currentUser?.role === "admin"
    ? ["overview", "performance", "products", "orders", "inventory", "users", "content", "contacts", "coupons", "categories"]
    : ["overview", ...(currentUser?.permissions.includes("dashboard") ? ["performance" as View] : []), ...(canManageProducts ? ["products" as View, "inventory" as View] : []), ...(canManageOrders ? ["orders" as View] : [])];
  const view: View = permittedViews.includes(requestedView) ? requestedView : "overview";

  const load = async () => {
    try {
      setLoading(true); setError("");
      const [summary, orderData, inventoryData] = await Promise.all([getAdminOverview(), canManageOrders ? getAdminOrders() : Promise.resolve([]), canManageProducts ? getAdminInventory() : Promise.resolve([])]);
      setOverview(summary.overview); setOrders(orderData); setInventory(inventoryData);
    } catch (loadError: unknown) { setError(getErrorMessage(loadError, "Unable to load admin dashboard")); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    Promise.all([getAdminOverview(), canManageOrders ? getAdminOrders() : Promise.resolve([]), canManageProducts ? getAdminInventory() : Promise.resolve([])])
      .then(([summary, orderData, inventoryData]) => {
        setOverview(summary.overview); setOrders(orderData); setInventory(inventoryData);
      })
      .catch((loadError: unknown) => setError(getErrorMessage(loadError, "Unable to load admin dashboard")))
      .finally(() => setLoading(false));
  }, [canManageOrders, canManageProducts]);

  const changeStatus = async (id: string, status: OrderStatus) => {
    try {
      setUpdating(id); setError("");
      const updated = await updateAdminOrderStatus(id, status);
      setOrders((current) => current.map((order) => order._id === id ? { ...order, orderStatus: updated.orderStatus } : order));
    } catch (updateError: unknown) { setError(getErrorMessage(updateError, "Unable to update order")); }
    finally { setUpdating(""); }
  };

  if (loading) return <Box sx={{ minHeight: 500, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const cards = [
    ["Revenue", money(overview?.revenue || 0), <CurrencyRupeeOutlinedIcon />, "Paid orders"],
    ["Orders", String(overview?.orderCount || 0), <ReceiptLongOutlinedIcon />, `${overview?.statusBreakdown.pending || 0} awaiting action`],
    ["Customers", String(overview?.customerCount || 0), <PeopleAltOutlinedIcon />, "Registered readers"],
    ["Low stock", String(overview?.lowStockCount || 0), <WarningAmberOutlinedIcon />, `${overview?.activeBookCount || 0} books currently on sale`],
  ];

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { sm: "flex-end" }, gap: 2, mb: { xs: 3, md: 4 } }}><Box><Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: "-.04em", fontSize: { xs: "2rem", sm: "2.6rem", lg: "3rem" } }}>Thooral Publishing Administration</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Real-time activity for your book business.</Typography></Box><Button variant="outlined" onClick={() => void load()} sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}>Refresh data</Button></Stack>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {view === "overview" && <>
        <Grid container spacing={2.5}>{cards.map(([label, value, icon, note]) => <Grid key={String(label)} size={{ xs: 12, sm: 6, xl: 3 }}><Paper elevation={0} sx={{ p: 3, border: "1px solid #E3E8E5", borderRadius: 3 }}><Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}><Box><Typography color="text.secondary" variant="body2">{label}</Typography><Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>{value}</Typography></Box><Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "rgba(30,64,175,.08)", color: "primary.main", display: "grid", placeItems: "center" }}>{icon}</Box></Stack><Typography variant="caption" color="text.secondary">{note}</Typography></Paper></Grid>)}</Grid>
        <Paper elevation={0} sx={{ mt: 3, border: "1px solid #E3E8E5", borderRadius: 3, overflow: "hidden" }}><Box sx={{ p: 3 }}><Typography variant="h5" sx={{ fontWeight: 800 }}>Recent orders</Typography></Box><OrderTable orders={orders.slice(0, 6)} updating={updating} onStatusChange={changeStatus} /></Paper>
      </>}
      {view === "orders" && <Paper elevation={0} sx={{ border: "1px solid #E3E8E5", borderRadius: 3, overflow: "hidden" }}><Box sx={{ p: 3 }}><Typography variant="h5" sx={{ fontWeight: 800 }}>All orders</Typography><Typography variant="body2" color="text.secondary">Manage payment and delivery status.</Typography></Box><OrderTable orders={orders} updating={updating} onStatusChange={changeStatus} /></Paper>}
      {view === "inventory" && <Paper elevation={0} sx={{ border: "1px solid #E3E8E5", borderRadius: 3, overflow: "hidden" }}><Box sx={{ p: 3 }}><Typography variant="h5" sx={{ fontWeight: 800 }}>Inventory</Typography><Typography variant="body2" color="text.secondary">Inventory details for all books.</Typography></Box><InventoryTable books={inventory} /></Paper>}
      {view === "performance" && <Performance />}
      {view === "products" && <Products />}
      {view === "users" && currentUser?.role === "admin" && <Users />}
      {view === "content" && currentUser?.role === "admin" && <SiteContent />}
      {view === "contacts" && currentUser?.role === "admin" && <Contacts />}
      {view === "coupons" && currentUser?.role === "admin" && <Coupons />}
      {view === "categories" && currentUser?.role === "admin" && <Categories />}
    </Box>
  );
};

const OrderTable = ({ orders, updating, onStatusChange }: { orders: AdminOrder[]; updating: string; onStatusChange: (id: string, status: OrderStatus) => Promise<void> }) => <TableContainer><Table sx={{ minWidth: 850 }}><TableHead><TableRow><TableCell>Order</TableCell><TableCell>Customer</TableCell><TableCell>Books</TableCell><TableCell>Total</TableCell><TableCell>Payment</TableCell><TableCell>Status</TableCell><TableCell>Date</TableCell></TableRow></TableHead><TableBody>{orders.map((order) => <TableRow key={order._id} hover><TableCell><Typography variant="body2" sx={{ fontWeight: 800 }}>#{order._id.slice(-8).toUpperCase()}</Typography></TableCell><TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{order.user?.name || "Customer"}</Typography><Typography variant="caption" color="text.secondary">{order.user?.email}</Typography></TableCell><TableCell>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell><TableCell sx={{ fontWeight: 800 }}>{money(order.totalAmount)}</TableCell><TableCell><Chip size="small" label={statusLabel[order.paymentStatus]} color={statusColor(order.paymentStatus)} /></TableCell><TableCell><FormControl size="small"><Select value={order.orderStatus} disabled={updating === order._id || order.orderStatus === "delivered" || order.orderStatus === "cancelled"} onChange={(event) => void onStatusChange(order._id, event.target.value as OrderStatus)} sx={{ minWidth: 150 }}>{statuses.map((status) => <MenuItem key={status} value={status}>{statusLabel[status]}</MenuItem>)}</Select></FormControl></TableCell><TableCell>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</TableCell></TableRow>)}</TableBody></Table></TableContainer>;

const InventoryTable = ({ books }: { books: Book[] }) => <TableContainer><Table sx={{ minWidth: 750 }}><TableHead><TableRow><TableCell>Title</TableCell><TableCell>Category</TableCell><TableCell>Type</TableCell><TableCell>Price</TableCell><TableCell>Stock</TableCell><TableCell>State</TableCell></TableRow></TableHead><TableBody>{books.map((book) => <TableRow key={book._id} hover><TableCell><Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}><Box component="img" src={book.images?.[0]?.url || "/placeholder-book.png"} sx={{ width: 36, height: 48, objectFit: "contain", bgcolor: "#EEE", borderRadius: 1 }} /><Box><Typography variant="body2" sx={{ fontWeight: 800 }}>{book.title}</Typography><Typography variant="caption" color="text.secondary">{book.author}</Typography></Box></Stack></TableCell><TableCell>{book.category?.name || "—"}</TableCell><TableCell sx={{ textTransform: "capitalize" }}>{book.bookType}</TableCell><TableCell>{money(book.salePrice ?? book.price)}</TableCell><TableCell><Chip size="small" icon={book.stock <= 5 && book.bookType !== "ebook" ? <Inventory2OutlinedIcon /> : undefined} label={book.bookType === "ebook" ? "Digital" : book.stock} color={book.stock <= 5 && book.bookType !== "ebook" ? "warning" : "default"} /></TableCell><TableCell><Chip size="small" label={book.isFeatured ? "Featured" : "Active"} color={book.isFeatured ? "success" : "default"} /></TableCell></TableRow>)}</TableBody></Table></TableContainer>;

export default Dashboard;
