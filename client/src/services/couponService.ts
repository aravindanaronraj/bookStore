import api from "../api/axios";

export interface AppliedCoupon {
  coupon: { id: string; code: string };
  orderAmount: number;
  discount: number;
  finalAmount: number;
}

export const applyCoupon = async (code: string, orderAmount: number) =>
  (await api.post<AppliedCoupon>("/coupons/apply", { code, orderAmount })).data;
