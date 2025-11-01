import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";
import { AuthProvider } from "./contexts/AuthContext";
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
import HelpAndSupport from "./pages/help-and-support/help.support";

// Global Lenis instance
let globalLenis: Lenis | null = null;

// Export function to access Lenis instance
export const getLenis = () => globalLenis;

function App() {
  useEffect(() => {
    // Initialize Lenis smooth scrolling
    globalLenis = new Lenis({
      duration: 0.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    // Animation frame loop for Lenis
    function raf(time: number) {
      globalLenis?.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      globalLenis?.destroy();
      globalLenis = null;
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/unit/:id" element={<UnitView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/manage-listings" element={<ManageUnits />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/manage-users" element={<ManageUsers />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/unit-calendar/:id" element={<UnitCalendar />} />
          <Route path="/booking-details/:id" element={<BookingDetails />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/help-and-support" element={<HelpAndSupport />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
