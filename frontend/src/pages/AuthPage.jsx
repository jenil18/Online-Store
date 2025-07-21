import { useState } from "react";
import { useAuth } from "../context/AuthContext"; 
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [email, setEmail] = useState("");
  const [salon, setSalon] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [name, setName] = useState("");

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      if (isLogin) {
        const loginResult = await login(username, password);
        console.log("Login successful:", loginResult);
        
        // Redirect based on user type
        if (username === 'skadmin') {
          console.log("Redirecting admin to admin approval page");
          navigate("/admin-approval");
        } else {
          console.log("Redirecting regular user to home");
          navigate("/");
        }
      } else {
        // Validation for registration
        if (!name || !username || !email || !password) {
          setError("Please fill in all required fields.");
          setLoading(false);
          return;
        }
        const usernameRegex = /^[A-Za-z][A-Za-z0-9]*$/;
        if (!usernameRegex.test(username)) {
          setError("Username must start with a letter and contain only letters and numbers.");
          setLoading(false);
          return;
        }
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
          setError("Phone must be exactly 10 digits.");
          setLoading(false);
          return;
        }
        if (altPhone && !phoneRegex.test(altPhone)) {
          setError("Alternate phone must be exactly 10 digits.");
          setLoading(false);
          return;
        }
        await register({ name, username, password, phone, altPhone, email, salon, address, city });
        navigate("/");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!username) {
      setForgotMessage("username field is required");
      setShowForgot(true);
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/auth/password-reset/`, { username });
      setForgotMessage(res.data.message || "Check your email for password info.");
    } catch (err) {
      setForgotMessage(
        err.response?.data?.error || "Error sending forgot password email."
      );
    }
    setShowForgot(true);
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-400 to-purple-500 px-4 relative">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-pink-400 to-purple-500 text-black rounded-full shadow-lg text-base font-semibold z-30 transition-all duration-200 hover:from-purple-500 hover:to-pink-400 hover:scale-105 focus:outline-none border-0"
        aria-label="Go Back"
      >
        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' className='w-5 h-5 mr-1'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' /></svg>
        Back
      </button>
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-md text-center">
        <div className="flex justify-center">
          <img
            src="/Logo2c65.svg"
            alt="Shree Krishna Beauty Products Logo"
            className="h-[90px] w-auto"
          />
        </div>
        <h2 className="text-3xl mt-6 font-bold mb-6 text-gray-800">
          {isLogin ? "Welcome !" : "Create Your Account"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block mb-1 text-gray-600 flex items-center">
              Username 
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex : User123"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block mb-1 text-gray-600">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-600">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-600">Alternate Number</label>
                <input
                  type="tel"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-600">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-600">Salon Name</label>
                <input
                  type="text"
                  value={salon}
                  onChange={(e) => setSalon(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-600">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-600">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
            </>
          )}

          <label className="block mb-1 text-gray-600">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border rounded focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {isLogin && (
            <div className="text-right mt-1">
              <button
                type="button"
                className="text-sm text-pink-600 hover:underline focus:outline-none"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-pink-500 text-white rounded font-semibold hover:bg-pink-600 transition disabled:opacity-50"
          >
            {loading ? "Processing..." : (isLogin ? "Login" : "Register")}
          </button>
        </form>

        <p className="mt-4 text-gray-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-pink-500 font-medium hover:underline"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
      {showForgot && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-xs w-full text-center">
            <div className="mb-4">{forgotMessage}</div>
            <button
              className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
              onClick={() => setShowForgot(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
