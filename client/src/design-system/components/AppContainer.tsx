import Container from "@mui/material/Container";
import type { ContainerProps } from "@mui/material/Container";

const AppContainer = ({
  children,
  ...props
}: ContainerProps) => {
  return (
    <Container
      maxWidth="lg"
      {...props}
    >
      {children}
    </Container>
  );
};

export default AppContainer;