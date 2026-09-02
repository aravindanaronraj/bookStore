import { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, Grid, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { getPerformanceAnalytics, type PerformanceAnalytics } from "../../services/adminService";
import { getErrorMessage } from "../../utils/getErrorMessage";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const Performance = () => {
  const [data, setData] = useState<PerformanceAnalytics | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getPerformanceAnalytics().then(setData).catch((e: unknown) => setError(getErrorMessage(e, "Unable to load analytics"))); }, []);
  const maxRevenue = useMemo(() => Math.max(...(data?.daily.map((day) => day.revenue) || [1]), 1), [data]);
  if (!data && !error) return <Box sx={{ py: 10, textAlign: "center" }}><CircularProgress /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;
  return <Stack spacing={3}>
    <Grid container spacing={2}><Grid size={{ xs: 12, md: 4 }}><Metric label="Average order value" value={money(data!.averageOrderValue)} /></Grid><Grid size={{ xs: 6, md: 4 }}><Metric label="Paid orders" value={String(data!.paidOrders)} /></Grid><Grid size={{ xs: 6, md: 4 }}><Metric label="Failed payments" value={String(data!.failedOrders)} /></Grid></Grid>
    <Paper elevation={0} sx={{ p: 3, border: "1px solid #E3E8E5", borderRadius: 3 }}><Typography variant="h5" sx={{ fontWeight: 800 }}>Revenue for the last 30 days</Typography><Box sx={{ height: 260, display: "flex", alignItems: "flex-end", gap: .6, mt: 4, borderBottom: "1px solid #DDE4E0" }}>{data!.daily.length === 0 ? <Typography color="text.secondary" sx={{ m: "auto" }}>There are no paid orders in this period.</Typography> : data!.daily.map((day) => <Box key={day._id} title={`${day._id}: ${money(day.revenue)}`} sx={{ flex: 1, minWidth: 5, maxWidth: 28, height: `${Math.max((day.revenue / maxRevenue) * 100, 4)}%`, bgcolor: "primary.main", borderRadius: "4px 4px 0 0", transition: ".2s", "&:hover": { bgcolor: "secondary.dark" } }} />)}</Box></Paper>
    <Paper elevation={0} sx={{ border: "1px solid #E3E8E5", borderRadius: 3, overflow: "hidden" }}><Box sx={{ p: 3 }}><Typography variant="h5" sx={{ fontWeight: 800 }}>Best-selling books</Typography></Box><Table><TableHead><TableRow><TableCell>Book</TableCell><TableCell>Units sold</TableCell><TableCell>Revenue</TableCell></TableRow></TableHead><TableBody>{data!.topProducts.map((item) => <TableRow key={item._id}><TableCell sx={{ fontWeight: 700 }}>{item.title}</TableCell><TableCell>{item.units}</TableCell><TableCell>{money(item.revenue)}</TableCell></TableRow>)}</TableBody></Table></Paper>
  </Stack>;
};
const Metric = ({ label, value }: { label: string; value: string }) => <Paper elevation={0} sx={{ p: 3, border: "1px solid #E3E8E5", borderRadius: 3 }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>{value}</Typography></Paper>;
export default Performance;
