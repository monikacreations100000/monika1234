import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderDetails from './pages/OrderDetails';
import Login from './pages/Login';
import Admin from './pages/Admin';
import './App.css';

export default function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('.reveal-element');
      elements.forEach(el => observer.observe(el));
    }, 300);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [location]);
  return (
    <div className="app-root-layout">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Pages Container */}
      <main className="main-content-area" style={{ minHeight: 'calc(100vh - 350px)' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      {/* Footer Details */}
      <Footer />
    </div>
  );
}
