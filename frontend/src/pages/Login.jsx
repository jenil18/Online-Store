import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [forgotMessage, setForgotMessage] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const API_BASE = process.env.REACT_APP_API_URL;

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    
    try {
      console.log("Attempting login for username:", username);
      const loginResult = await login(username, password);
      console.log("Login successful, result:", loginResult);
      
      // Redirect based on user type
      if (username === 'skadmin') {
        console.log("Redirecting skadmin to admin approval page");
        navigate("/admin-approval");
      } else {
        console.log("Redirecting regular user to home");
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleForgotPassword = async () => {
    if (!username) {
      setForgotMessage("username fie  ld is required");
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
    <section className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-pink-400 to-purple-500 text-white p-4 relative">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 bg-white text-pink-600 rounded-full w-10 h-10 flex items-center justify-center shadow-md text-2xl font-bold z-30 hover:bg-pink-100 focus:outline-none"
        aria-label="Go Back"
      >
        &lt;
      </button>
      <div className="bg-white text-black p-8 rounded-xl shadow-lg space-y-4 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-pink-600">Login</h1>
          <p className="text-gray-600 text-sm mt-2">Welcome back!</p>
        </div>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <div className="text-right">
            <button
              type="button"
              className="text-sm text-pink-600 hover:underline focus:outline-none"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>
          </div>
          
          {error && (
            <div className="text-red-600 text-center font-semibold border border-red-300 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
          
          <button
            onClick={handleLogin}
            disabled={loading || !username || !password}
            className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
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
};

export default Login;
