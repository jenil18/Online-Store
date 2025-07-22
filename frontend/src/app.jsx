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
import { OrderProvider } from './context/OrderContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import UserNotFound from './pages/UserNotFound';
import CartPayment from './pages/CartPayment';
import OrderStatus from './pages/OrderStatus';
import AdminApproval from './pages/AdminApproval';
import ResetPassword from './pages/ResetPassword';
import LoadingBrush from './components/LoadingBrush';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import { ShopProvider } from './context/ShopContext';
import { Provider } from 'react-redux';
import store from './store';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000); // ⏱️ 2 seconds
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <LoadingBrush />;
  }

  return (
    <Provider store={store}>
      <AuthProvider>
        <CartProvider>
          <OrderProvider>
            <ShopProvider>
              <BrowserRouter>
                <ScrollTop />
                  <div className="flex flex-col min-h-screen">
                    <NavLayout />
                    <main className="flex-grow">
                      <Routes>
                        <Route path='/auth' element={<AuthPage />} />
                        <Route path="/shop" element={ <Shop /> } />
                        <Route path='/about' element={ <About /> } />
                        <Route path='/contact' element={ <Contact /> } />
                        <Route path='/cart' element={ <Cart /> } />
                          <Route path='/cart/payment' element={<CartPayment />} />
                          <Route path='/order-status' element={<ProtectedRoute> <OrderStatus /></ProtectedRoute>} />
                          <Route path='/admin-approval' element={<ProtectedRoute> <AdminApproval /></ProtectedRoute>} />
                        <Route path='/profile' element={<ProtectedRoute> <Profile /></ProtectedRoute>} />
                        <Route path='/product/:id' element={<ProtectedRoute> <ProductDetail /></ProtectedRoute>} />
                          <Route path='/user-not-found' element={<UserNotFound />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          <Route path="/payment-success" element={<PaymentSuccessPage />} />
                          <Route path="/" element={ <Home /> } />
                          <Route path="/*" element={ <Home /> } />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
              </BrowserRouter>
            </ShopProvider>
          </OrderProvider>
        </CartProvider>
      </AuthProvider>
    </Provider>
  );
}
