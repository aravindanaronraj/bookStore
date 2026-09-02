import {
  Box,
  Button,
  Chip,
  Rating,
  Stack,
  Typography,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

import type { Book } from "../../services/bookService";

interface BookCardProps {
  book: Book;
}

const BookCard = ({ book }: BookCardProps) => {
  const navigate = useNavigate();

  const currentPrice =
    book.salePrice ?? book.price;

  const hasDiscount =
    book.salePrice !== undefined &&
    book.salePrice < book.price;

  return (
    <Box
      sx={{
        height: "100%",

        display: "flex",
        flexDirection: "column",

        bgcolor: "background.paper",

        border: "1px solid rgba(30,64,175,.1)",

        borderRadius: 3,

        overflow: "hidden",

        transition:
          "transform 0.2s ease, box-shadow 0.2s ease",

        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 20px 45px rgba(30,64,175,.14)",
        },
      }}
    >
      {/* Book Image */}
      <Box sx={{ position: "relative", bgcolor: "#EFE9DD", overflow: "hidden" }}>
        {hasDiscount && (
          <Chip
            label={`${Math.round((1 - currentPrice / book.price) * 100)}% off`}
            size="small"
            color="secondary"
            sx={{ position: "absolute", zIndex: 1, top: 12, left: 12, fontWeight: 800 }}
          />
        )}
      <Box
        component="img"
        src={
          book.images?.[0]?.url||
          "/placeholder-book.png"
        }
        alt={book.title}
        loading="lazy"
        sx={{
          width: "100%",

          height: {
            xs: 180,
            sm: 240,
          },

          objectFit: "contain",

          p: 2,
          transition: "transform .35s ease",
        }}
      />
      </Box>

      {/* Book Information */}
      <Box
        sx={{
          p: 2,

          display: "flex",
          flexDirection: "column",

          flexGrow: 1,
        }}
      >
        {/* Title */}
        <Typography
          sx={{
            fontWeight: 700,
          }}
          noWrap
        >
          {book.title}
        </Typography>

        {/* Author */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
          }}
          noWrap
        >
          {book.author}
        </Typography>

        {Boolean(book.reviewCount) && <Stack direction="row" spacing={.75} sx={{ mt: 1, alignItems: "center" }}>
          <Rating readOnly size="small" precision={0.1} value={book.averageRating || 0} />
          <Typography variant="caption" color="text.secondary">
            {(book.averageRating || 0).toFixed(1)} ({book.reviewCount})
          </Typography>
        </Stack>}

        {/* Price */}
        <Stack
          direction="row"
          spacing={1}
          
          sx={{
            mt: 1.5,alignItems:"center"
          }}
        >
          <Typography
            color="primary.main"
            sx={{
              fontWeight: 700,
            }}
          >
            ₹{currentPrice}
          </Typography>

          {hasDiscount && (
            <Typography
              variant="body2"
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

        {book.bookType !== "ebook" && book.stock <= 0 && <Typography variant="body2" color="error.main" sx={{ mt: 1, fontWeight: 700 }}>கையிருப்பில் இல்லை</Typography>}

        {/* Push button to bottom */}
        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="contained"
          fullWidth
          sx={{
            mt: 2,
          }}
          onClick={() =>
            navigate(
              `/books/${book._id}`
            )
          }
        >
          நூலைப் பார்க்க
        </Button>
      </Box>
    </Box>
  );
};

export default BookCard;
