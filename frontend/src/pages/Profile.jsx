import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editableUser, setEditableUser] = useState(null);

  useEffect(() => {
    if (user) {
      setEditableUser(user);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    // Update localStorage (optional: add this if you want updates to persist)
    localStorage.setItem("user", JSON.stringify(editableUser));
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!editableUser) return <div>Loading profile...</div>;

  return (
    <section className="min-h-screen bg-gray-400 py-16 px-4 md:px-20">
      <div className="mt-[50px] max-w-5xl mx-auto bg-white p-8 rounded-3xl shadow-lg">
        <h1 className="text-4xl font-bold mb-8 text-center">My Profile</h1>

        {/* Profile Information */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Profile Details</h2>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                {["username", "email", "phone", "altPhone", "salon", "address", "city"].map((field) => (
                  <div key={field}>
                    <label className="block text-gray-600 capitalize">{field}</label>
                    <input
                      type="text"
                      name={field}
                      value={editableUser[field] || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-gray-400"
                    />
                  </div>
                ))}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-black text-white hover:bg-gray-600 transition"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 rounded-full bg-gray-300 text-gray-700 hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-gray-700 text-lg">
                {["username", "email", "phone", "altPhone", "salon", "address", "city"].map((field) => (
                  <p key={field}>
                    <span className="font-semibold capitalize">{field}:</span>{" "}
                    {editableUser[field] || "—"}
                  </p>
                ))}
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 px-6 py-2 rounded-full bg-black text-white hover:bg-black/40 transition"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          {/* Order History */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Order History</h2>
            <div className="space-y-4">
              <div className="text-gray-600 italic">No orders found.</div>
              {/* Replace with real orders if needed */}
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="px-8 py-2 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </section>
  );
};

export default Profile;
