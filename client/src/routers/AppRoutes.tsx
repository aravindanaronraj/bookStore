import {
 
  Routes,
  Route,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";

import Login from "../pages/auth/login";
import Home from "../pages/customer/Home";
import Books from "../pages/customer/Books";
import BookDetails from "../pages/customer/BookDetails";
import Cart from "../pages/customer/Cart";
import CheckoutAuthGate from "../pages/customer/CheckoutAuthGate";
import AdminRoute from "./AdminRoute";
import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Register from "../pages/auth/Register";
import Categories from "../pages/customer/Categories";
import About from "../pages/customer/About";
import Contact from "../pages/customer/Contact";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyEmail from "../pages/auth/VerifyEmail";
import ChangePassword from "../pages/customer/ChangePassword";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "../pages/customer/Profile";



const AppRoutes = () => {
  return (
    <Routes>
      {/* Customer Website */}
      <Route element={<MainLayout />}>
        <Route
  path="/"
  element={<Home />}
/>

        <Route
  path="/books"
  element={<Books />}
/>

        <Route
          path="/categories"
          element={<Categories />}
        />

        <Route path="/cart" element={<Cart />} />

        <Route path="/checkout" element={<CheckoutAuthGate />} />
        <Route element={<ProtectedRoute />}><Route path="/profile" element={<Profile />} /><Route path="/change-password" element={<ChangePassword />} /></Route>

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />
        <Route
  path="/books/:id"
  element={<BookDetails />}
/>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
        </Route>
      </Route>

      {/* Authentication */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={<Login />}
        />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
