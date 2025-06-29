import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ScrollTop from './components/ScrollTop';
import Home from './pages/Home';
import Footer from './components/Footer';
import Shop from './pages/Shop';
import About from './pages/About';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import NavLayout from './components/NavLayout';
import ProductDetail from './pages/ProductDetail';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000); // ⏱️ 2 seconds
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-pink-500 to-purple-600 text-white text-5xl font-extrabold tracking-wide animate-fade-in">
        Shree Krishna Beauty Products
      </div>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollTop />
            <div className="flex flex-col min-h-screen">
              <NavLayout />
              <main className="flex-grow">
                <Routes>
                  <Route path='/auth' element={<AuthPage />} />
                  <Route path="/*" element={ <Home /> } />
                  <Route path="/shop" element={ <Shop /> } />
                  <Route path='/about' element={ <About /> } />
                  <Route path='/contact' element={ <Contact /> } />
                  <Route path='/cart' element={ <Cart /> } />
                  <Route path='/profile' element={<ProtectedRoute> <Profile /></ProtectedRoute>} />
                  <Route path='/product/:id' element={<ProtectedRoute> <ProductDetail /></ProtectedRoute>} />
                  {/* Add more routes for Products, Contact, etc. */}
                </Routes>
              </main>
              <Footer />
            </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
