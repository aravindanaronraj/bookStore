import Card  from "@mui/material/Card";
import type { CardProps } from "@mui/material/Card";

const AppCard = ({
  children,
  ...props
}: CardProps) => {
  return (
    <Card {...props}>
      {children}
    </Card>
  );
};

export default AppCard;