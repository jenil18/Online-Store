import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load user from localStorage on app start (persist login)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try{
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
        localStorage.removeItem("user");
      }
    }

    // Optional: Load registered users from localStorage if needed
    const storedUsers = localStorage.getItem("registeredUsers");
    if (storedUsers) {
      setRegisteredUsers(JSON.parse(storedUsers));
    }
    setLoading(false);
  }, []);

  const register = (userData) => {
    const isAlreadyRegistered = registeredUsers.some(u => u.username === userData.username);
    if (isAlreadyRegistered) throw new Error("User already registered");

    const updatedUsers = [...registeredUsers, userData];
    setRegisteredUsers(updatedUsers);
    localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const login = (username, password) => {
    const match = registeredUsers.find(u => u.username === username && u.password === password);
    if (!match) {
      throw new Error("Invalid credentials or not registered");
    }

    setUser(match);
    localStorage.setItem("user", JSON.stringify(match)); 
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user"); // ✅ Remove login from localStorage
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
