import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";

import {
  type CartData,
  getCart,
  getGuestCart,
  removeFromCart,
  removeFromGuestCart,
  updateCartItem,
  updateGuestCartItem,
} from "../../services/cartService";
import { getErrorMessage } from "../../utils/getErrorMessage";
import type { RootState } from "../../store/store";

const Cart = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const [cart, setCart] =
    useState<CartData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [updatingBookId, setUpdatingBookId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadCart = async () => {
      try {
        const data = user ? await getCart() : getGuestCart();

        setCart(data);
      } catch (error: unknown) {
        setError(getErrorMessage(error, "வாங்கும் கூடையை ஏற்ற முடியவில்லை"));
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user]);

  const subtotal = useMemo(() => {
    if (!cart) {
      return 0;
    }

    return cart.cartItems.reduce(
      (total, item) => {
        const price =
          item.book.salePrice ??
          item.book.price;

        return (
          total +
          price * item.quantity
        );
      },
      0
    );
  }, [cart]);

  const handleQuantityChange = async (
    bookId: string,
    quantity: number
  ) => {
    if (quantity < 1) {
      return;
    }

    const previousCart = cart;
    setCart((current) => current ? {
      ...current,
      cartItems: current.cartItems.map((item) => item.book._id === bookId ? { ...item, quantity } : item),
    } : current);

    try {
      setUpdatingBookId(bookId);
      setError("");

      const updatedCart = user ? await updateCartItem(bookId, quantity) : updateGuestCartItem(bookId, quantity);

      setCart(updatedCart);
    } catch (error: unknown) {
      setCart(previousCart);
      setError(getErrorMessage(error, "எண்ணிக்கையை மாற்ற முடியவில்லை"));
    } finally {
      setUpdatingBookId(null);
    }
  };

  const handleRemove = async (
    bookId: string
  ) => {
    const previousCart = cart;
    setCart((current) => current ? { ...current, cartItems: current.cartItems.filter((item) => item.book._id !== bookId) } : current);

    try {
      setUpdatingBookId(bookId);
      setError("");

      const updatedCart = user ? await removeFromCart(bookId) : removeFromGuestCart(bookId);

      setCart(updatedCart);
    } catch (error: unknown) {
      setCart(previousCart);
      setError(getErrorMessage(error, "நூலை அகற்ற முடியவில்லை"));
    } finally {
      setUpdatingBookId(null);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 400,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!cart || cart.cartItems.length === 0) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          py: 8,
          textAlign: "center",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
          }}
        >
          உங்கள் வாங்கும் கூடை காலியாக உள்ளது
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            mt: 1,
            mb: 3,
          }}
        >
          தொடர்ந்து வாங்க சில நூல்களைச் சேருங்கள்.
        </Typography>

        <Button
          variant="contained"
          onClick={() =>
            navigate("/books")
          }
        >
          நூல்களைப் பாருங்கள்
        </Button>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 5 }}
    >
      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          mb: 4,
        }}
      >
        வாங்கும் கூடை
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      <Stack
        direction={{
          xs: "column",
          lg: "row",
        }}
        spacing={4}
        sx={{alignItems:"flex-start"}}
      >
        {/* Cart Items */}
        <Stack
          spacing={2}
          sx={{
            flex: 1,
            width: "100%",
          }}
        >
          {cart.cartItems.map((item) => {
            const price =
              item.book.salePrice ??
              item.book.price;

            const isUpdating =
              updatingBookId ===
              item.book._id;

            return (
              <Box
                key={item.book._id}
                sx={{
                  display: "flex",
                  gap: 2,
                  p: 2,
                  bgcolor:
                    "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                }}
              >
                <Box
                  component="img"
                  src={
                    item.book.images?.[0]?.url ||
                    "/placeholder-book.png"
                  }
                  alt={item.book.title}
                  sx={{
                    width: {
                      xs: 90,
                      sm: 120,
                    },
                    height: {
                      xs: 120,
                      sm: 150,
                    },
                    objectFit: "contain",
                    bgcolor: "grey.50",
                    borderRadius: 2,
                  }}
                />

                <Stack
                  spacing={1}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    {item.book.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {item.book.author}
                  </Typography>

                  <Typography
                    color="primary.main"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    ₹{price}
                  </Typography>

                  <Stack
                    direction="row"
                    
                    spacing={1}
                    sx={{ mt: 1,alignItems:"center" }}
                  >
                    <IconButton
                      size="small"
                      disabled={
                        isUpdating ||
                        item.quantity <= 1
                      }
                      onClick={() =>
                        handleQuantityChange(
                          item.book._id,
                          item.quantity - 1
                        )
                      }
                    >
                      <RemoveIcon />
                    </IconButton>

                    <Typography
                      sx={{
                        minWidth: 30,
                        textAlign: "center",
                        fontWeight: 600,
                      }}
                    >
                      {item.quantity}
                    </Typography>

                    <IconButton
                      size="small"
                      disabled={
                        isUpdating ||
                        (
                          item.book.bookType !==
                            "ebook" &&
                          item.quantity >=
                            item.book.stock
                        )
                      }
                      onClick={() =>
                        handleQuantityChange(
                          item.book._id,
                          item.quantity + 1
                        )
                      }
                    >
                      <AddIcon />
                    </IconButton>

                    <IconButton
                      color="error"
                      sx={{
                        ml: "auto",
                      }}
                      disabled={isUpdating}
                      onClick={() =>
                        handleRemove(
                          item.book._id
                        )
                      }
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Stack>

        {/* Summary */}
        <Box
          sx={{
            width: {
              xs: "100%",
              lg: 360,
            },
            p: 3,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            position: {
              lg: "sticky",
            },
            top: {
              lg: 110,
            },
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 3,
            }}
          >
            ஆர்டர் சுருக்கம்
          </Typography>

          <Stack spacing={2}>
            <Stack
              direction="row"
              sx={{justifyContent:"space-between"}}
            >
              <Typography color="text.secondary">
                இடைத்தொகை
              </Typography>

              <Typography sx={{fontWeight:600}}>
                ₹{subtotal}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              sx={{justifyContent:"space-between"}}
            >
              <Typography color="text.secondary">
                விநியோகக் கட்டணம்
              </Typography>

              <Typography>
                வாங்கும் போது கணக்கிடப்படும்
              </Typography>
            </Stack>

            <Box
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
                pt: 2,
              }}
            >
              <Stack
                direction="row"
                sx={{justifyContent:"space-between"}}
              >
                <Typography
                  variant="h6"
                  sx={{fontWeight:700}}
                >
                  Total
                </Typography>

                <Typography
                  variant="h6"
                  color="primary.main"
                  sx={{fontWeight:700}}
                >
                  ₹{subtotal}
                </Typography>
              </Stack>
            </Box>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() =>
                navigate("/checkout")
              }
            >
              வாங்குவதைத் தொடர்க
            </Button>

            <Button
              variant="text"
              onClick={() =>
                navigate("/books")
              }
            >
              தொடர்ந்து நூல்கள் வாங்குக
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default Cart;
