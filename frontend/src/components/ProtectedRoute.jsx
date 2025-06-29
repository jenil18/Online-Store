import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center text-lg">Loading...</div>;
  }

  return user ? children : <Navigate to="/auth" />;
}
