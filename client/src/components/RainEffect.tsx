import { Box, keyframes } from "@mui/material";

const rainfall = keyframes`
  0% {
    transform: translateY(-30px);
    opacity: 0;
  }

  20% {
    opacity: 0.8;
  }

  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
`;
const RainEffect = () => {
  const drops = Array.from({ length: 100});

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {drops.map((_, index) => (
        <Box
          key={index}
          sx={{
            position: "absolute",
            top: "-30px",
            left: `${(index * 17) % 100}%`,

            animation: `${rainfall} ${
              1.5 + (index % 6) * 0.2
            }s linear infinite`,

            animationDelay: `${
              (index % 10) * 0.2
            }s`,
          }}
        >
          <Box
            sx={{
              width: {
                xs: "2px",
                md: "3px",
              },

              height: {
                xs: "13px",
                md: "18px",
              },

              background:
                "linear-gradient(180deg, rgba(144,202,249,.25), #42a5f5)",

              borderRadius: 99,

              boxShadow:
                "0 2px 4px rgba(25, 118, 210, 0.25)",

              opacity: 0.75,
            }}
          />
        </Box>
      ))}

      {/* This closing Box was missing */}
    </Box>
  );
};

export default RainEffect;
