import Button from "@mui/material/Button";
import type {
  ButtonProps,
} from "@mui/material/Button";

const AppButton = ({
  children,
  ...props
}: ButtonProps) => {
  return (
    <Button
      {...props}
      disableElevation
    >
      {children}
    </Button>
  );
};

export default AppButton;