import api from "../api/axios";

export interface CheckoutOrder {
  id: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
}

export interface CreateOrderResponse {
  order: CheckoutOrder;
  razorpay: {
    key: string;
    orderId: string;
    amount: number | string;
    currency: string;
  };
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const createOrder = async (
  addressId: string,
  couponCode?: string
): Promise<CreateOrderResponse> => {
  const response = await api.post<CreateOrderResponse>("/orders/create", {
    addressId,
    couponCode: couponCode || undefined,
  });
  return response.data;
};

export const verifyPayment = async (payment: RazorpaySuccessResponse) => {
  const response = await api.post("/orders/verify-payment", payment);
  return response.data;
};
