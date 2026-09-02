import { useEffect, useState } from "react";

import {
  Box,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from "@mui/material";

import { useNavigate, useSearchParams } from "react-router-dom";

import {
  getBooks,
  type Book,
} from "../../services/bookService";

import BookCard from "../../components/books/BookCard";

const Books = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [books, setBooks] =
    useState<Book[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const data = await getBooks({
          search: searchParams.get("search") || undefined,
          category: searchParams.get("category") || undefined,
        });

        setBooks(data.books);
      } catch (error) {
        console.error(
          "Failed to load books:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [searchParams]);

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 6 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
          }}
        >
          Books
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          {searchParams.get("search")
            ? `“${searchParams.get("search")}” என்பதற்கான தேடல் முடிவுகள்`
            : "எங்கள் தமிழ் Book தொகுப்பை ஆராயுங்கள்."}
        </Typography>
      </Box>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 8,
          }}
        >
          <CircularProgress />
        </Box>
      ) : books.length === 0 ? (
        <Typography color="text.secondary">
          நூல்கள் எதுவும் கிடைக்கவில்லை.
        </Typography>
      ) : (
        <Grid
          container
          spacing={3}
        >
          {books.map((book) => (
            <Grid
              key={book._id}
              size={{
                xs: 6,
                sm: 4,
                md: 3,
                lg: 2.4,
              }}
            >
              <Box
                onClick={() => navigate(`/books/${book._id}`)}
                sx={{ cursor: "pointer" }}
              >
                <BookCard book={book} />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Books;
