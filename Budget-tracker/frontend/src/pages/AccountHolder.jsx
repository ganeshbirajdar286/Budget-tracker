import React, { useState, useEffect } from 'react';
import { FaUser, FaBell, FaShieldAlt, FaPalette, FaDownload, FaArrowLeft } from 'react-icons/fa';
import { MdCurrencyExchange } from 'react-icons/md';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import AdvancedSidebar from '../components/Sidebar';

const AccountHolderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    currency: "INR",
    language: "en",
    timezone: "Asia/Kolkata"
  });

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = localStorage.getItem("token");
  
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${VITE_BASE_URL}/api/users/me`, axiosConfig);
      const userData = res.data.user;
      setUser(userData);
      setFormData({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        currency: userData.currency || "INR",
        language: userData.language || "en",
        timezone: userData.timezone || "Asia/Kolkata"
      });
    } catch (err) {
      console.error("Fetch user error:", err.response?.data || err.message);
      showMessage("error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Go back to previous page instead of fixed route
    navigate(-1);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.put(`${VITE_BASE_URL}/api/users/profile`, formData, axiosConfig);
      showMessage("success", "Profile updated successfully");
      setIsEditing(false);
      fetchUser(); // Refresh user data
    } catch (error) {
      console.error("Update profile error:", error);
      showMessage("error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      currency: user?.currency || "INR",
      language: user?.language || "en",
      timezone: user?.timezone || "Asia/Kolkata"
    });
    setIsEditing(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FaUser /> },
    { id: 'preferences', label: 'App Preferences', icon: <FaPalette /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    { id: 'security', label: 'Security', icon: <FaShieldAlt /> },
    { id: 'export', label: 'Data Export', icon: <FaDownload /> }
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-b from-black via-[#0a0014] to-[#1a002a] text-gray-100">
        <AdvancedSidebar
          user={user}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-purple-400 text-xl">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black via-[#0a0014] to-[#1a002a] text-gray-100">
      <AdvancedSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header
          onMobileToggle={() => setMobileSidebarOpen(true)}
        />

        <main className="p-4 md:p-6 mt-16 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-purple-600/20 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-purple-400" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-purple-400">My Profile</h1>
              <p className="text-gray-400">Manage your account information and preferences</p>
            </div>
          </div>

          {/* Message Alert */}
          {message.text && (
            <div className={`p-4 rounded-lg border ${
              message.type === "success" 
                ? "bg-green-500/20 border-green-500 text-green-400" 
                : "bg-red-500/20 border-red-500 text-red-400"
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar */}
            {/* Sidebar / Dropdown Navigation */}
<div className="lg:w-64 flex-shrink-0">
  {/* Mobile Dropdown */}
{/* Mobile Dropdown */}
<div className="block lg:hidden mb-4">
  <select
    value={activeTab}
    onChange={(e) => setActiveTab(e.target.value)}
    className="w-full bg-[#1b0128]/70 border border-purple-800/30 text-purple-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-purple-500"
  >
    <option value="profile">👤 Profile</option>
    <option value="preferences">🎨 App Preferences</option>
    <option value="notifications">🔔 Notifications</option>
    <option value="security">🛡️ Security</option>
    <option value="export">📤 Data Export</option>
  </select>
</div>


  {/* Desktop Sidebar */}
  <div className="hidden lg:block bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md">
    <nav className="space-y-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
            activeTab === tab.id
              ? "bg-purple-600/40 text-white"
              : "text-gray-400 hover:bg-purple-600/20 hover:text-purple-300"
          }`}
        >
          {tab.icon}
          <span className="font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  </div>
</div>


            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-6">
                {/* Profile Information */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-purple-300">Profile Information</h2>
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-colors"
                        >
                          Edit Profile
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-300 mb-2">First Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        ) : (
                          <div className="bg-gray-700 rounded-lg px-4 py-3 text-white">{user.first_name}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-300 mb-2">Last Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        ) : (
                          <div className="bg-gray-700 rounded-lg px-4 py-3 text-white">{user.last_name}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-300 mb-2">Email Address</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        ) : (
                          <div className="bg-gray-700 rounded-lg px-4 py-3 text-white">{user.email}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-300 mb-2">Phone Number</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        ) : (
                          <div className="bg-gray-700 rounded-lg px-4 py-3 text-white">{user.phone}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-300 mb-2">Preferred Currency</label>
                        {isEditing ? (
                          <select
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="INR">INR - Indian Rupee</option>
                          </select>
                        ) : (
                          <div className="bg-gray-700 rounded-lg px-4 py-3 text-white flex items-center gap-2">
                            <MdCurrencyExchange />
                            {user.currency}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-300 mb-2">Language</label>
                        {isEditing ? (
                          <select
                            value={formData.language}
                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                          </select>
                        ) : (
                          <div className="bg-gray-700 rounded-lg px-4 py-3 text-white">{user.language}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-300 mb-2">Timezone</label>
                        {isEditing ? (
                          <select
                            value={formData.timezone}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            <option value="Asia/Kolkata">Asia/Kolkata</option>
                            <option value="America/New_York">America/New_York</option>
                            <option value="Europe/London">Europe/London</option>
                            <option value="Australia/Sydney">Australia/Sydney</option>
                          </select>
                        ) : (
                          <div className="bg-gray-700 rounded-lg px-4 py-3 text-white">{user.timezone}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Add other tabs content here */}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AccountHolderPage;

// Update the avatar fallback in your Sidebar component
