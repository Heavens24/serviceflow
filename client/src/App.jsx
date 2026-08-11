import { Route, Routes } from "react-router-dom";

import AdminRoute from "./auth/AdminRoute";
import ProtectedRoute from "./auth/ProtectedRoute";

import About from "./pages/About";
import ArtisanProfile from "./pages/ArtisanProfile";
import Booking from "./pages/Booking";
import Contact from "./pages/Contact";
import Conversation from "./pages/Conversation";
import CustomerProfile from "./pages/CustomerProfile";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Marketplace from "./pages/Marketplace";
import MyArtisanProfile from "./pages/MyArtisanProfile";
import MyCustomerProfile from "./pages/MyCustomerProfile";
import MyJobs from "./pages/MyJobs";
import MyRequests from "./pages/MyRequests";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import PaymentSuccess from "./pages/PaymentSuccess";
import Register from "./pages/Register";
import Services from "./pages/Services";
import Wallet from "./pages/Wallet";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";

function App() {
  return (
    <Routes>
      {/* ==========================
          Public Routes
      ========================== */}
      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/about"
        element={<About />}
      />

      <Route
        path="/services"
        element={<Services />}
      />

      <Route
        path="/contact"
        element={<Contact />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* ==========================
          General Protected Routes
      ========================== */}
      <Route
        path="/booking"
        element={
          <ProtectedRoute>
            <Booking />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-requests"
        element={
          <ProtectedRoute>
            <MyRequests />
          </ProtectedRoute>
        }
      />

      <Route
        path="/marketplace"
        element={
          <ProtectedRoute>
            <Marketplace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-jobs"
        element={
          <ProtectedRoute>
            <MyJobs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages/:serviceRequestId"
        element={
          <ProtectedRoute>
            <Conversation />
          </ProtectedRoute>
        }
      />

      {/* ==========================
          Artisan Wallet Route
      ========================== */}
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <Wallet />
          </ProtectedRoute>
        }
      />

      {/* ==========================
          Payment Routes
      ========================== */}
      <Route
        path="/payment/success"
        element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />

      {/* ==========================
          Artisan Profile Routes
      ========================== */}
      <Route
        path="/artisan-profile"
        element={
          <ProtectedRoute>
            <MyArtisanProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/artisans/:userId"
        element={
          <ProtectedRoute>
            <ArtisanProfile />
          </ProtectedRoute>
        }
      />

      {/* ==========================
          Customer Profile Routes
      ========================== */}
      <Route
        path="/customer-profile"
        element={
          <ProtectedRoute>
            <MyCustomerProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer-profiles/:userId"
        element={
          <ProtectedRoute>
            <CustomerProfile />
          </ProtectedRoute>
        }
      />

      {/* ==========================
          Admin Routes
      ========================== */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/jobs"
        element={
          <AdminRoute>
            <AdminJobs />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/reviews"
        element={
          <AdminRoute>
            <AdminReviews />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/withdrawals"
        element={
          <AdminRoute>
            <AdminWithdrawals />
          </AdminRoute>
        }
      />

      {/* ==========================
          Fallback Route
      ========================== */}
      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}

export default App;