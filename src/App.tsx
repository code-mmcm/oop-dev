import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { initLenis, destroyLenis } from "./lib/lenis";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/home";
import Login from "./pages/login";
import ManageUnits from "./pages/manage-units";
import Profile from "./pages/profile";
import Booking from "./pages/booking";
import SignUp from "./pages/signup";
import AdminPanel from "./pages/admin";
import ManageUsers from "./pages/manage-users";
import UnitView from "./pages/unit-view";
import Updates from "./pages/updates";
import Calendar from "./pages/calendar";
import UnitCalendar from "./pages/unit-calendar";
import BookingDetails from "./pages/booking-details";
import Listings from "./pages/listings";
import BookingRequests from "./pages/booking-requests";
import HelpAndSupport from "./pages/help-and-support/help.support";
import BookingPayment from "./pages/booking-payment";
import NotificationsPage from "./pages/notifications";
import NotFound from "./components/NotFound";

function App() {
  useEffect(() => {
    initLenis();

    return () => {
      destroyLenis();
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/unit/:id" element={<UnitView />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/booking/:id/payment" 
            element={
              <ProtectedRoute allowedRoles={['agent', 'admin']}>
                <BookingPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-listings"
            element={
              <ProtectedRoute allowedRoles={['admin', 'agent']}>
                <ManageUnits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking"
            element={
              <ProtectedRoute allowedRoles={['agent', 'admin']}>
                <Booking />
              </ProtectedRoute>
            }
          />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route path="/updates" element={<Updates />} />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute allowedRoles={['admin', 'agent']}>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/unit-calendar/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'agent']}>
                <UnitCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking-details/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'agent']}>
                <BookingDetails />
              </ProtectedRoute>
            }
          />
          <Route path="/listings" element={<Listings />} />
          <Route
            path="/booking-requests"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <BookingRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['admin', 'agent']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/help-and-support" element={<HelpAndSupport />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
