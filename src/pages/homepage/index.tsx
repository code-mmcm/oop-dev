import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Hero from './components/Hero';
import ExploreByCategory from './components/ExploreByCategory';
import DiscoverConnectStay from './components/DiscoverConnectStay';
import FeaturedStays from './components/FeaturedStays';

const Homepage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <ExploreByCategory />
        <DiscoverConnectStay />
        <FeaturedStays />
      </main>
      <Footer />
    </div>
  );
};

export default Homepage;
