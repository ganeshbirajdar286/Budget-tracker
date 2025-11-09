import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaBell, FaUserCircle, FaCog, FaUser } from "react-icons/fa";
import { FiMenu, FiChevronDown } from "react-icons/fi";
import axios from "axios";
import logo from "../assets/logo.svg";

const Header = ({ onMobileToggle, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsSignedIn(false);
      return;
    }

    setIsSignedIn(true);

    // fetch user profile for display
    (async () => {
      try {
        const res = await axios.get(`${VITE_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = res.data.user || {};
        
        // Use username from database instead of first_name
        setUsername(user.username || user.email?.split('@')[0] || "User");
        
        console.log('Fetched user data:', user); // Debug log
      } catch (err) {
        console.error("Header: fetch user error:", err);
        setUsername("User"); // Fallback
      }
    })();
  }, []);

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      try { onLogout(); } catch {}
      return;
    }

    localStorage.removeItem("token");
    setIsSignedIn(false);
    navigate("/sign-in");
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
      case "/app":
      case "/app/dashboard":
        return "Dashboard";
      case "/app/transactions":
        return "Transactions";
      case "/app/subscriptions":
        return "Subscriptions";
      case "/app/reports":
        return "Reports";
      case "/app/account":
        return "Account";
      default:
        return "";
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-purple-700/20 text-white shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileToggle}
          className="md:hidden text-xl text-gray-300 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-all duration-200"
        >
          <FiMenu />
        </button>

        <Link to="/app/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gray-900 border-2 border-purple-500 flex items-center justify-center shadow-lg">
            <img src={logo} alt="Logo" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-lg font-semibold hidden sm:block">BudgetTracker</span>
        </Link>

        <div className="hidden md:block ml-4 pl-4 border-l border-gray-800">
          <h1 className="text-base font-medium text-purple-300">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-all duration-200">
          <FaBell className="text-lg" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {isSignedIn ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-800 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <FaUserCircle className="text-xl" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">{username}</div>
                <div className="text-xs text-gray-400">View profile</div>
              </div>
              <FiChevronDown className={`hidden md:block transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-900 ring-1 ring-black ring-opacity-5">
                <div className="py-1" role="menu">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                    onClick={() => setShowProfileMenu(false)}
                    role="menuitem"
                  >
                    <FaUser className="text-purple-400" />
                    My Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                    role="menuitem"
                  >
                    <FaCog className="text-purple-400" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-800"
                    role="menuitem"
                  >
                    <FaSignOutAlt className="text-red-400" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/sign-in"
              className="px-3 py-1.5 rounded-md bg-gray-800 text-white text-sm hover:bg-gray-700 transition-all duration-200"
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 transition-all duration-200"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
