import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const API_BASE = process.env.REACT_APP_API_URL + "/auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user and token from localStorage on app start
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchProfile(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Register user via backend
  const register = async ({ username, email, password, phone, altPhone, address, city, salon }) => {
    const payload = { username, email, password, phone, altPhone, address, city, salon };
    console.log('Register payload:', payload); // Debug log
    const res = await fetch(`${API_BASE}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || JSON.stringify(err));
      }
    // Auto-login after registration
    await login(username, password);
  };

  // Login user via backend
  const login = async (username, password) => {
    console.log('Attempting login for:', username);
    const res = await fetch(`${API_BASE}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || JSON.stringify(err));
    }
    const data = await res.json();
    setToken(data.access);
    localStorage.setItem("token", data.access);
    await fetchProfile(data.access);
    
    // Return user info for redirection logic
    return { username, isAdmin: username === 'skadmin' };
  };

  // Fetch user profile
  const fetchProfile = async (jwtToken) => {
    const res = await fetch(`${API_BASE}/profile/`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    if (res.ok) {
      const profile = await res.json();
      setUser(profile);
      console.log('Profile loaded:', profile);
    } else {
      setUser(null);
      localStorage.removeItem("token");
    }
    setLoading(false);
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/profile/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    if (!res.ok) {
      throw new Error("Failed to update profile");
    }
    const updated = await res.json();
    setUser(updated);
    return updated;
  };

  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
