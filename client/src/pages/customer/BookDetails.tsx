import { useEffect, useState } from "react";
import { addToCart, addToGuestCart } from "../../services/cartService";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import {
  getBookById,
  type Book,
} from "../../services/bookService";
import { getErrorMessage } from "../../utils/getErrorMessage";
import BookReviews from "../../components/books/BookReviews";

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

const user = useSelector(
  (state: RootState) => state.auth.user
);

const [addingToCart, setAddingToCart] =
  useState(false);

const [cartMessage, setCartMessage] =
  useState("");

const [cartError, setCartError] =
  useState("");

  const handleBuyNow = async () => {
    if (!book) return;
    try {
      setAddingToCart(true); setCartError("");
      if (user) await addToCart({ bookId: book._id, quantity: 1 });
      else addToGuestCart({ _id: book._id, title: book.title, author: book.author, images: book.images, price: book.price, salePrice: book.salePrice, stock: book.stock, bookType: book.bookType }, 1);
      navigate("/checkout");
    } catch (error: unknown) { setCartError(getErrorMessage(error, "இப்போது வாங்க முடியவில்லை")); }
    finally { setAddingToCart(false); }
  };

  const [book, setBook] =
    useState<Book | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadBook = async () => {
      if (!id) {
        setError("Invalid book ID");
        setLoading(false);
        return;
      }

      try {
        const data =
          await getBookById(id);

        setBook(data);
      } catch (error: unknown) {
        setError(getErrorMessage(error, "Book விவரங்களை ஏற்ற முடியவில்லை"));
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [id]);
  const handleAddToCart = async () => {
  if (!user) {
    if (!book) return;
    addToGuestCart({ _id: book._id, title: book.title, author: book.author, images: book.images, price: book.price, salePrice: book.salePrice, stock: book.stock, bookType: book.bookType }, 1);
    setCartMessage("நூல் வாங்கும் கூடையில் சேர்க்கப்பட்டது");
    return;
  }

  if (!book) {
    return;
  }

  try {
    setAddingToCart(true);
    setCartMessage("");
    setCartError("");

    await addToCart({ bookId: book._id, quantity: 1 });

    setCartMessage(
      "நூல் வாங்கும் கூடையில் சேர்க்கப்பட்டது"
    );
  } catch (error: unknown) {
    setCartError(getErrorMessage(error, "நூலை வாங்கும் கூடையில் சேர்க்க முடியவில்லை"));
  } finally {
    setAddingToCart(false);
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

  if (error || !book) {
    return (
      <Container
        maxWidth="lg"
        sx={{ py: 5 }}
      >
        <Alert severity="error">
          {error || "Book not found"}
        </Alert>
      </Container>
    );
  }

  const currentPrice =
    book.salePrice ?? book.price;

  const hasDiscount =
    book.salePrice !== undefined &&
    book.salePrice < book.price;

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 5 }}
    >
      <Grid
        container
        spacing={{
          xs: 3,
          md: 6,
        }}
      >
        {/* Book image */}
        <Grid
          size={{
            xs: 12,
            md: 5,
          }}
        >
          <Box
            sx={{
              maxWidth: 450,
              mx: "auto",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <Box
              component="img"
              src={
                book.images?.[0]?.url ||
                "/placeholder-book.png"
              }
              alt={book.title}
              sx={{
                width: "100%",
                height: {
                  xs: 380,
                  sm: 500,
                },
                objectFit: "contain",
                display: "block",
              }}
            />
          </Box>
        </Grid>

        {/* Book information */}
        <Grid
          size={{
            xs: 12,
            md: 7,
          }}
        >
          <Stack spacing={2}>
            {book.category && (
              <Typography
                variant="body2"
                color="primary.main"
                sx={{
                  fontWeight: 600,
                }}
              >
                {book.category.name}
              </Typography>
            )}

            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
              }}
            >
              {book.title}
            </Typography>

            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                fontWeight: 400,
              }}
            >
              by {book.author}
            </Typography>

            <Stack
              direction="row"
              spacing={1.5}
              sx={{alignItems:"center"}}
            >
              <Typography
                variant="h4"
                color="primary.main"
                sx={{
                  fontWeight: 700,
                }}
              >
                ₹{currentPrice}
              </Typography>

              {hasDiscount && (
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    textDecoration:
                      "line-through",
                  }}
                >
                  ₹{book.price}
                </Typography>
              )}
            </Stack>

            {book.bookType !== "ebook" && book.stock <= 0 && <Typography color="error.main" sx={{ fontWeight: 700 }}>கையிருப்பில் இல்லை</Typography>}

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                lineHeight: 1.8,
              }}
            >
              {book.description}
            </Typography>

            <Stack
              spacing={1}
              sx={{
                pt: 2,
              }}
            >
              {book.publisher && (
                <Typography>
                  <strong>
                  பதிப்பகம்:
                  </strong>{" "}
                  {book.publisher}
                </Typography>
              )}

              <Typography>
                <strong>
                  Language:
                </strong>{" "}
                {book.language}
              </Typography>

              <Typography>
                <strong>
                  Book Type:
                </strong>{" "}
                {book.bookType}
              </Typography>

              {book.pages && (
                <Typography>
                  <strong>
                  Pages:
                  </strong>{" "}
                  {book.pages}
                </Typography>
              )}

              {book.isbn && (
                <Typography>
                  <strong>
                    ISBN:
                  </strong>{" "}
                  {book.isbn}
                </Typography>
              )}
            </Stack>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
              sx={{
                pt: 2,
              }}
            >
                {cartMessage && (
  <Alert severity="success">
    {cartMessage}
  </Alert>
)}

{cartError && (
  <Alert severity="error">
    {cartError}
  </Alert>
)}
             <Button
  variant="contained"
  size="large"
  onClick={handleAddToCart}
  disabled={
    addingToCart ||
    (book.bookType !== "ebook" &&
      book.stock <= 0)
  }
>
  {addingToCart
    ? "சேர்க்கப்படுகிறது..."
    : "வாங்கும் கூடையில் சேர்"}
</Button>

              <Button
                variant="outlined"
                size="large"
                onClick={() => void handleBuyNow()}
                disabled={
                  addingToCart ||
                  book.bookType !== "ebook" &&
                  book.stock <= 0
                }
              >
                இப்போது வாங்குக
              </Button>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
      <BookReviews bookId={book._id} />
    </Container>
  );
};

export default BookDetails;
