import api from "../api/axios";
import type { Book } from "./bookService";

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export interface AdminOrder {
  _id: string;
  user?: { name: string; email: string; phone?: string };
  items: { title: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentStatus: "pending" | "processing" | "paid" | "failed" | "refunded";
  orderStatus: OrderStatus;
  createdAt: string;
}
export interface AdminOverview {
  bookCount: number; activeBookCount: number; categoryCount: number; customerCount: number;
  orderCount: number; lowStockCount: number; revenue: number;
  statusBreakdown: Partial<Record<OrderStatus, number>>;
}
export interface AdminUser {
  _id: string; name: string; email: string; phone: string; role: "user" | "staff" | "admin";
  staffApproval: "pending" | "approved" | "rejected";
  permissions: ("dashboard" | "products" | "orders" | "customers")[];
  subscription: { plan: "free" | "premium" }; isEmailVerified: boolean; createdAt: string;
}
export interface PerformanceAnalytics {
  daily: { _id: string; revenue: number; orders: number }[];
  topProducts: { _id: string; title: string; units: number; revenue: number }[];
  averageOrderValue: number; paidOrders: number; failedOrders: number;
}

export const getAdminOverview = async () => {
  const response = await api.get<{ overview: AdminOverview; recentOrders: AdminOrder[] }>("/admin/overview");
  return response.data;
};
export const getAdminOrders = async () => {
  const response = await api.get<{ orders: AdminOrder[] }>("/admin/orders", { params: { limit: 100 } });
  return response.data.orders;
};
export const updateAdminOrderStatus = async (id: string, status: OrderStatus) => {
  const response = await api.patch<{ order: AdminOrder }>(`/admin/orders/${id}/status`, { status });
  return response.data.order;
};
export const getAdminInventory = async () => {
  const response = await api.get<{ books: Book[] }>("/admin/inventory");
  return response.data.books;
};
export const getPerformanceAnalytics = async () => {
  const response = await api.get<{ analytics: PerformanceAnalytics }>("/admin/performance");
  return response.data.analytics;
};
export const getAdminUsers = async () => {
  const response = await api.get<{ users: AdminUser[] }>("/admin/users");
  return response.data.users;
};
export const updateUserAccess = async (id: string, data: Pick<AdminUser, "role" | "staffApproval" | "permissions">) => {
  await api.patch(`/admin/users/${id}/access`, data);
};
export interface ProductInput {
  title: string; slug: string; author: string; publisher: string; isbn: string; description: string; category: string;
  bookType: "physical" | "ebook" | "both"; price: string; salePrice: string; stock: string;
  language: string; pages: string; isFeatured: boolean; isNewLaunch: boolean; isActive: boolean;
}
const productFormData = (data: ProductInput, images: File[]) => {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => form.append(key, String(value)));
  images.forEach((image) => form.append("images", image));
  return form;
};
export const createAdminProduct = async (data: ProductInput, images: File[]) => {
  await api.post("/admin/products", productFormData(data, images));
};
export const updateAdminProduct = async (id: string, data: ProductInput, images: File[]) => {
  await api.put(`/admin/products/${id}`, productFormData(data, images));
};
export const removeAdminProduct = async (id: string, action: "hide" | "delete") => { await api.delete(`/admin/products/${id}`, { data: { action } }); };

export interface SiteContent {
  announcement: { enabled: boolean; messages: string[]; speed: number; fontSize: number; textColor: string; backgroundColor: string };
  hero: { badge: string; heading: string; description: string; primaryButton: string; secondaryButton: string; imageUrl: string; imagePublicId: string };
  about: { eyebrow: string; heading: string; title: string; description: string };
  footer: { description: string; email: string; phone: string; address: string; workingHours: string; copyright: string };
}
export interface ContactMessage { _id: string; name: string; email: string; subject: string; message: string; status: "new" | "read" | "resolved"; createdAt: string }
export const getSiteContent = async () => {
  const content = (await api.get<{ content: SiteContent }>("/content")).data.content;
  return { ...content, announcement: content.announcement ?? { enabled: true, messages: ["₹1,000-க்கு மேல் இலவச விநியோகம்", "தேர்ந்தெடுக்கப்பட்ட தமிழ் Books", "பாதுகாப்பான UPI Payment"], speed: 24, fontSize: 13, textColor: "#FFFFFF", backgroundColor: "#172554" }, hero: content.hero ?? { badge: "தேர்ந்தெடுக்கப்பட்ட தமிழ் Books", heading: "மனதில் தூறலாய் தங்கும் கதைகள்.", description: "தமிழ் Bookகளின் சிறந்த தொகுப்பைக் கண்டறியுங்கள்.", primaryButton: "Bookகளைப் பாருங்கள்", secondaryButton: "Categoryகளை ஆராயுங்கள்", imageUrl: "", imagePublicId: "" } };
};
export const updateSiteContent = async (content: SiteContent, heroImage?: File) => {
  const form = new FormData();
  form.append("hero", JSON.stringify(content.hero)); form.append("about", JSON.stringify(content.about)); form.append("footer", JSON.stringify(content.footer)); form.append("announcement", JSON.stringify(content.announcement));
  if (heroImage) form.append("heroImage", heroImage);
  return (await api.put<{ content: SiteContent }>("/admin/content", form)).data.content;
};
export const getAdminContacts = async () => (await api.get<{ messages: ContactMessage[] }>("/admin/contacts")).data.messages;
export const updateContactStatus = async (id: string, status: ContactMessage["status"]) => (await api.patch<{ message: ContactMessage }>(`/admin/contacts/${id}/status`, { status })).data.message;
export const deleteContactMessage = async (id: string) => { await api.delete(`/admin/contacts/${id}`); };
export interface AdminCoupon { _id: string; code: string; discountType: "percentage" | "fixed"; discountValue: number; minimumOrderAmount: number; maximumDiscountAmount?: number; usageLimit?: number; usedCount: number; perUserLimit: number; expiresAt: string; isActive: boolean }
export interface CouponInput { code: string; discountType: "percentage" | "fixed"; discountValue: string; minOrderAmount: string; maxDiscount: string; usageLimit: string; perUserLimit: string; expiresAt: string; isActive: boolean }
const couponPayload = (data: CouponInput) => ({ ...data, discountValue: Number(data.discountValue), minOrderAmount: Number(data.minOrderAmount || 0), maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined, usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined, perUserLimit: Number(data.perUserLimit || 1) });
export const getAdminCoupons = async () => (await api.get<{ coupons: AdminCoupon[] }>("/coupons")).data.coupons;
export const createAdminCoupon = async (data: CouponInput) => { await api.post("/coupons", couponPayload(data)); };
export const updateAdminCoupon = async (id: string, data: CouponInput) => { await api.put(`/coupons/${id}`, couponPayload(data)); };
export const deleteAdminCoupon = async (id: string) => { await api.delete(`/coupons/${id}`); };
