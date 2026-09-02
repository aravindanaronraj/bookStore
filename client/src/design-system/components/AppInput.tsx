import TextField from "@mui/material/TextField";
import type {TextFieldProps} from "@mui/material/TextField";

const AppInput = ({
  ...props
}: TextFieldProps) => {
  return (
    <TextField
      {...props}
      fullWidth
      variant="outlined"
    />
  );
};

export default AppInput;