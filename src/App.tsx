import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
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

function App() {
  useEffect(() => {
    // Initialize Lenis smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    // Animation frame loop for Lenis
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
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
  );
}

export default App;
