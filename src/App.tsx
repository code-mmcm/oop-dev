import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import Lenis from '@studio-freight/lenis';
import { AuthProvider } from './contexts/AuthContext';
import Home from './components/Home';
import Login from './components/Login';
import ManageUnits from './components/ManageUnits';
import Profile from './components/ProfileCard';
import Booking from './components/Booking';
import SignUp from './components/SignUp';
import AdminPanel from './components/AdminPanel';
import ManageUsers from './components/ManageUsers';
import UnitView from './components/UnitView';

// Global Lenis instance
let globalLenis: Lenis | null = null;

// Export function to access Lenis instance
export const getLenis = () => globalLenis;

function App() {
  useEffect(() => {
    // Initialize Lenis smooth scrolling
    globalLenis = new Lenis({
      duration: 1.2,
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
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/unit/:id" element={<UnitView />} />
            <Route path="/login" element={<Login />} />
            <Route path="/manage" element={<ManageUnits />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/manageusers" element={<ManageUsers />} />
          </Routes>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
