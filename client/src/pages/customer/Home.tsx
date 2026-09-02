import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import {
  getFeaturedBooks,
  getNewLaunchBooks,
  type Book,
} from "../../services/bookService";

import {
  getCategories,
  type Category,
} from "../../services/categoryService";

import BookCard from "../../components/books/BookCard";
import RainEffect from "../../components/RainEffect";
import { getSiteContent, type SiteContent } from "../../services/adminService";

const Home = () => {
  const navigate = useNavigate();

  const [books, setBooks] = useState<Book[]>([]);
  const [newLaunchBooks, setNewLaunchBooks] = useState<Book[]>([]);
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [showRain, setShowRain] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowRain(false), 10000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [featuredBooks, newBooks, categoryData] =
          await Promise.all([
            getFeaturedBooks(),
            getNewLaunchBooks(),
            getCategories(),
          ]);

        setBooks(featuredBooks);
        setNewLaunchBooks(newBooks);
        setCategories(categoryData);
      } catch (error) {
        console.error(
          "Failed to load home data:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);
  
  return (
    <Box>
      {showRain && <RainEffect />}
      {/* Hero */}
      <DynamicHero navigate={navigate} />
      <Box
        sx={{
          display: "none",
          py: {
            xs: 6,
            md: 10,
          },
          minHeight: { md: 570 },
          alignItems: "center",
          backgroundImage:
            "linear-gradient(90deg, rgba(254, 255, 255, 0.98) 0%, rgba(240, 243, 242, 0.92) 48%, rgb(255, 255, 255) 100%), url('/src/assets/hero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "primary.contrastText",
        }}
      >
        <Container maxWidth="xl">
          <Stack
            spacing={3}
            sx={{
              maxWidth: 650,
            }}
          >
            
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "2.7rem", md: "4.5rem" },
                lineHeight: 1.04,
                letterSpacing: "-.04em",
              }}
            >
              மனதில் தூறலாய் தங்கும் கதைகள்.
            </Typography>

            <Typography
              variant="h6"
              sx={{
                opacity: 1,
                fontWeight: 400,
              }}
            >
              தமிழ் இலக்கியம், நவீனப் புதினங்கள், சிறார் நூல்கள் மற்றும்
              வாழ்வியல் சிந்தனைகளின் சிறந்த தொகுப்பைக் கண்டறியுங்கள்.
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() =>
                  navigate("/books")
                }
              >
                நூல்களைப் பாருங்கள்
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/categories")}
                sx={{ color: "white", borderColor: "rgba(255,255,255,.45)" }}
              >
                வகைகளை ஆராயுங்கள்
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Categories */}
      <Container
        maxWidth="xl"
        sx={{ py: 6 }}
      >
        <Stack
          direction="row"
          
          sx={{ mb: 3,justifyContent:"space-between",
          alignItems:"center" }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            வகை வாரியாக வாங்குங்கள்
          </Typography>

          <Button
            onClick={() =>
              navigate("/categories")
            }
          >
            அனைத்தையும் காண்க
          </Button>
        </Stack>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 4,
            }}
          >
            <CircularProgress />
          </Box>
        ) : categories.length === 0 ? (
          <Typography color="text.secondary">
            நூல் வகைகள் எதுவும் இல்லை.
          </Typography>
        ) : (
          <Grid
            container
            spacing={2}
          >
            {categories
              .slice(0, 6)
              .map((category) => (
                <Grid
                  key={category._id}
                  size={{
                    xs: 6,
                    sm: 4,
                    md: 2,
                  }}
                >
                  <Box
                    onClick={() =>
                      navigate(
                        `/books?category=${category._id}`
                      )
                    }
                    sx={{
                      p: 3,
                      height: "100%",
                      textAlign: "center",
                      bgcolor:
                        "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 3,
                      cursor: "pointer",
                      transition: "0.2s",

                      "&:hover": {
                        transform:
                          "translateY(-3px)",
                        boxShadow: 2,
                      },
                    }}
                  >
                    {category.image && (
                      <Box
                        component="img"
                        src={category.image}
                        alt={category.name}
                        sx={{
                          width: 70,
                          height: 70,
                          objectFit: "cover",
                          borderRadius: 2,
                          mb: 1.5,
                        }}
                      />
                    )}

                    <Typography
                      sx={{
                        fontWeight: 600,
                      }}
                    >
                      {category.name}
                    </Typography>
                  </Box>
                </Grid>
              ))}
          </Grid>
        )}
      </Container>

      {/* Featured Books */}
      <Container
        maxWidth="xl"
        sx={{ py: 4 }}
      >
        <Stack
          direction="row"
          
          sx={{ mb: 3,justifyContent:"space-between",
          alignItems:"center" }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            சிறப்பு நூல்கள்
          </Typography>

          <Button
            onClick={() =>
              navigate("/books")
            }
          >
            அனைத்தையும் காண்க
          </Button>
        </Stack>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 6,
            }}
          >
            <CircularProgress />
          </Box>
        ) : books.length === 0 ? (
          <Typography color="text.secondary">
            சிறப்பு நூல்கள் எதுவும் இல்லை.
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
    }}
  >
    <BookCard book={book} />
  </Grid>
))}
            
          </Grid>
        )}
      </Container>

      {newLaunchBooks.length > 0 && (
        <Box sx={{ py: { xs: 5, md: 8 }, bgcolor: "rgba(205, 151, 53, .08)" }}>
          <Container maxWidth="xl">
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "flex-end" } }}>
              <Box>
                <Chip label="இப்போது வெளியானவை" color="secondary" size="small" sx={{ mb: 1.5, fontWeight: 800 }} />
                <Typography variant="h4" sx={{ fontWeight: 800 }}>புதிய வெளியீடுகள்</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>தூறல் பதிப்பகத்தின் சமீபத்திய தேர்ந்தெடுக்கப்பட்ட நூல்கள்</Typography>
              </Box>
              <Button onClick={() => navigate("/books")} sx={{ fontWeight: 700 }}>அனைத்து நூல்களையும் காண்க</Button>
            </Stack>
            <Grid container spacing={3}>
              {newLaunchBooks.map((book) => (
                <Grid key={book._id} size={{ xs: 6, sm: 4, md: 3 }}><BookCard book={book} /></Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* New Arrivals */}
      <Container
        maxWidth="xl"
        sx={{ display: "none", py: 5 }}
      >
        <Stack
          direction="row"
          
          sx={{ mb: 3 ,justifyContent:"space-between",
          alignItems:"center"}}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            புதிய வரவுகள்
          </Typography>

          <Button
            onClick={() =>
              navigate("/books")
            }
          >
            அனைத்தையும் காண்க
          </Button>
        </Stack>

        <Typography color="text.secondary">
          அண்மையில் வெளியான புதிய தமிழ் நூல்கள் விரைவில் இங்கே இடம்பெறும்.
        </Typography>
      </Container>

      {/* Why Choose Us */}
      <Box
        sx={{
          bgcolor: "background.paper",
          py: 6,
          mt: 4,
        }}
      >
        <Container maxWidth="xl">
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 4,
              textAlign: "center",
            }}
          >
            ஏன் தூறல் பதிப்பகம்?
          </Typography>

          <Grid
            container
            spacing={3}
          >
            {[
              {
                title: "பரந்த Book தொகுப்பு",
                description:
                  "பல வகைகளில் தேர்ந்தெடுக்கப்பட்ட தரமான தமிழ் நூல்கள்.",
              },
              {
                title: "பாதுகாப்பான கட்டணம்",
                description:
                  "Razorpay வழியாக பாதுகாப்பான UPI கட்டண வசதி.",
              },
              {
                title: "விரைவான விநியோகம்",
                description:
                  "எளிய வாங்கும் முறை மற்றும் நம்பகமான விநியோகம்.",
              },
            ].map((item) => (
              <Grid
                key={item.title}
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <Box
                  sx={{
                    textAlign: "center",
                    p: 3,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {item.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

const heroDefaults: SiteContent["hero"] = { badge: "தேர்ந்தெடுக்கப்பட்ட தமிழ் நூல்கள்", heading: "மனதில் தூறலாய் தங்கும் கதைகள்.", description: "தமிழ் இலக்கியம், நவீனப் புதினங்கள், சிறார் நூல்கள் மற்றும் வாழ்வியல் சிந்தனைகளின் சிறந்த தொகுப்பைக் கண்டறியுங்கள்.", primaryButton: "நூல்களைப் பாருங்கள்", secondaryButton: "வகைகளை ஆராயுங்கள்", imageUrl: "", imagePublicId: "" };
const DynamicHero = ({ navigate }: { navigate: (path: string) => void }) => {
  const [hero, setHero] = useState(heroDefaults);
  useEffect(() => { void getSiteContent().then((content) => setHero(content.hero)).catch(() => undefined); }, []);
  const image = hero.imageUrl || "/src/assets/hero.png";
  return (
    <Box sx={{ position: "relative", width: "100%", minHeight: { xs: 440, sm: 500, md: 540 }, overflow: "hidden", bgcolor: "#172554", display: "flex", alignItems: "center" }}>
      <Box component="img" src={image} alt={hero.heading || "சிறப்பு நூல்கள்"} loading="eager" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", objectFit: "cover", objectPosition: { xs: "64% center", md: "center" } }} />
      <Box sx={{ position: "absolute", inset: 0, background: { xs: "linear-gradient(90deg, rgba(9,18,48,.88) 0%, rgba(9,18,48,.72) 62%, rgba(9,18,48,.38) 100%)", md: "linear-gradient(90deg, rgba(9,18,48,.82) 0%, rgba(9,18,48,.55) 48%, rgba(9,18,48,.08) 76%)" } }} />
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, py: { xs: 4, sm: 5, md: 7 } }}>
        <Stack spacing={{ xs: 1.75, sm: 2, md: 2.5 }} sx={{ width: "100%", maxWidth: { xs: 520, md: 680 }, color: "white" }}>
          <Chip label={hero.badge} sx={{ alignSelf: "flex-start", maxWidth: "100%", fontWeight: 800, color: "#172554", bgcolor: "#DBEAFE", "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }} />
          <Typography variant="h1" sx={{ color: "white", fontWeight: 900, fontSize: { xs: "2rem", sm: "2.8rem", md: "4rem" }, lineHeight: { xs: 1.16, md: 1.08 }, letterSpacing: 0, textWrap: "balance", textShadow: "0 2px 18px rgba(0,0,0,.28)" }}>{hero.heading}</Typography>
          <Typography sx={{ display: { xs: "none", sm: "block" }, color: "rgba(255,255,255,.9)", fontSize: { sm: ".95rem", md: "1.12rem" }, lineHeight: 1.7, maxWidth: 600 }}>{hero.description}</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ pt: { xs: .5, sm: 1 }, width: { xs: "100%", sm: "auto" }, alignItems: { sm: "center" } }}>
            <Button fullWidth variant="contained" size="large" onClick={() => navigate("/books")} sx={{ width: { sm: "auto" }, minHeight: 46, px: 3.5, fontWeight: 800, color: "#172554", bgcolor: "white", "&:hover": { bgcolor: "#EFF6FF" } }}>{hero.primaryButton}</Button>
            <Button fullWidth variant="outlined" size="large" onClick={() => navigate("/categories")} sx={{ width: { sm: "auto" }, minHeight: 46, px: 3.5, color: "white", borderColor: "rgba(255,255,255,.72)", bgcolor: "rgba(9,18,48,.2)", "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,.13)" } }}>{hero.secondaryButton}</Button>
          </Stack>
          <Typography variant="caption" sx={{ display: { xs: "none", md: "block" }, color: "rgba(255,255,255,.72)", letterSpacing: 0 }}>பாதுகாப்பான கட்டணம் · தேர்ந்தெடுக்கப்பட்ட நூல்கள் · நம்பகமான விநியோகம்</Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Home;
