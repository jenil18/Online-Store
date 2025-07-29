import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, Building, Edit3, Save, X, LogOut, Shield, Settings } from "lucide-react";

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editableUser, setEditableUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setEditableUser(user);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await updateProfile(editableUser);
      setIsEditing(false);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError("Failed to update profile");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!editableUser) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const profileFields = [
    { key: 'username', label: 'Username', icon: User, type: 'text' },
    { key: 'email', label: 'Email', icon: Mail, type: 'email' },
    { key: 'phone', label: 'Phone', icon: Phone, type: 'tel' },
    { key: 'altPhone', label: 'Alternative Phone', icon: Phone, type: 'tel' },
    { key: 'salon', label: 'Salon Name', icon: Building, type: 'text' },
    { key: 'address', label: 'Address', icon: MapPin, type: 'text' },
    { key: 'city', label: 'City', icon: MapPin, type: 'text' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-6">
            <User className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Profile</h1>
          <p className="text-gray-600 text-lg">Manage your account information</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{editableUser.username}</h2>
                  <p className="text-indigo-100">{editableUser.email}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-8">
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {profileFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <field.icon className="w-4 h-4" />
                        <span>{field.label}</span>
                      </label>
                      <input
                        type={field.type}
                        name={field.key}
                        value={editableUser[field.key] || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder={`Enter your ${field.label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
                
                {error && (
                  <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-700">{error}</span>
                  </div>
                )}
                
                {success && (
                  <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700">{success}</span>
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {profileFields.map((field) => (
                    <div key={field.key} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-2">
                        <field.icon className="w-5 h-5 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-600">{field.label}</span>
                      </div>
                      <p className="text-gray-800 font-medium">
                        {editableUser[field.key] || "Not provided"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-100 p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Account Security</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Privacy Settings</span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Need help? Contact our support team for assistance
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
