import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";

import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

import App from "./App";
import { theme } from "./design-system/theme/theme";
import AuthInitializer from "./components/common/AuthInitializer";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthInitializer>
        <App />
        </AuthInitializer>
      </ThemeProvider>
    </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
