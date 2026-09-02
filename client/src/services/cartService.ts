import api from "../api/axios";

export interface AddToCartData {
  bookId: string;
  quantity?: number;
}

export interface CartBook {
  _id: string;
  title: string;
  author: string;
  images: { url: string }[];
  price: number;
  salePrice?: number;
  stock: number;
  bookType: "physical" | "ebook" | "both";
}

export interface CartData {
  _id: string;
  cartItems: { book: CartBook; quantity: number }[];
}

const GUEST_CART_KEY = "thooral_guest_cart";

const normalizeCart = (cart: CartData): CartData => ({
  ...cart,
  cartItems: Array.isArray(cart?.cartItems)
    ? cart.cartItems.filter((item) => Boolean(item?.book?._id && item.quantity > 0))
    : [],
});

export const getGuestCart = (): CartData => {
  try {
    const items = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
    const cart = normalizeCart({ _id: "guest", cartItems: Array.isArray(items) ? items : [] });
    if (cart.cartItems.length !== (Array.isArray(items) ? items.length : 0)) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart.cartItems));
    return cart;
  } catch {
    return { _id: "guest", cartItems: [] };
  }
};

const saveGuestCart = (cart: CartData) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart.cartItems));
  window.dispatchEvent(new Event("guest-cart-updated"));
  return cart;
};

export const addToGuestCart = (book: CartBook, quantity = 1): CartData => {
  const cart = getGuestCart();
  const existing = cart.cartItems.find((item) => item.book._id === book._id);
  if (existing) existing.quantity = Math.min(existing.quantity + quantity, book.bookType === "ebook" ? 99 : book.stock);
  else cart.cartItems.push({ book, quantity: Math.min(quantity, book.bookType === "ebook" ? 99 : book.stock) });
  return saveGuestCart(cart);
};

export const updateGuestCartItem = (bookId: string, quantity: number): CartData => {
  const cart = getGuestCart();
  const item = cart.cartItems.find((entry) => entry.book._id === bookId);
  if (item) item.quantity = quantity;
  return saveGuestCart(cart);
};

export const removeFromGuestCart = (bookId: string): CartData => {
  const cart = getGuestCart();
  cart.cartItems = cart.cartItems.filter((item) => item.book._id !== bookId);
  return saveGuestCart(cart);
};

export const mergeGuestCart = async () => {
  const guestCart = getGuestCart();
  const remaining: CartData["cartItems"] = [];
  for (const item of guestCart.cartItems) {
    try { await addToCart({ bookId: item.book._id, quantity: item.quantity }); }
    catch { remaining.push(item); }
  }
  if (guestCart.cartItems.length) saveGuestCart({ _id: "guest", cartItems: remaining });
};

export const addToCart = async (
  data: AddToCartData
) => {
  const response = await api.post(
    "/cart/add",
    data
  );

  return response.data;
};

export const getCart = async (): Promise<CartData> => {
  const response = await api.get("/cart");

  return normalizeCart(response.data.cart);
};

export const updateCartItem = async (
  bookId: string,
  quantity: number
): Promise<CartData> => {
  const response = await api.put(
    `/cart/${bookId}`,
    {
      quantity,
    }
  );

  return normalizeCart(response.data.cart);
};

export const removeFromCart = async (
  bookId: string
): Promise<CartData> => {
  const response = await api.delete(
    `/cart/${bookId}`
  );

  return normalizeCart(response.data.cart);
};

export const clearCart = async () => {
  const response = await api.delete(
    "/cart"
  );

  return response.data.cart;
};
