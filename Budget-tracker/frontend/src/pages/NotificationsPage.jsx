// NotificationsPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
} from "../api/notificationsApi";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    billing_reminders: true,
    subscription_alerts: true,
    budget_alerts: true
  });

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

  const notificationTypes = {
    billing: { label: "💳 Billing", color: "text-purple-400", bgColor: "bg-purple-500/20" },
    budget: { label: "📊 Budget", color: "text-blue-400", bgColor: "bg-blue-500/20" },
    security: { label: "🔒 Security", color: "text-red-400", bgColor: "bg-red-500/20" },
    report: { label: "📈 Report", color: "text-green-400", bgColor: "bg-green-500/20" },
    system: { label: "⚙️ System", color: "text-gray-400", bgColor: "bg-gray-500/20" },
    subscription: { label: "🔄 Subscription", color: "text-orange-400", bgColor: "bg-orange-500/20" }
  };

  const priorityLevels = {
    high: { label: "High", color: "text-red-400", bgColor: "bg-red-500/20" },
    medium: { label: "Medium", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
    low: { label: "Low", color: "text-blue-400", bgColor: "bg-blue-500/20" }
  };

  const token = localStorage.getItem("token");
  
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch user & notifications on mount
  useEffect(() => {
    console.log('Token:', token); // Debug log
    if (token) {
      fetchUser();
      fetchNotifications();
      fetchNotificationSettings();
    }
  }, [token]); // Add token as dependency

  // Lock body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "auto";
  }, [mobileSidebarOpen]);

  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/users/me`, axiosConfig);
      setUser(res.data.user);
    } catch (err) {
      console.error("Fetch user error:", err);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      console.log('Fetching notifications...'); // Debug log
      const res = await axios.get(`${VITE_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });
      console.log('Notifications response:', res.data); // Debug log
      
      // Fallback to sample notifications if backend returns nothing
      const backendNotifications = res.data.notifications || res.data || [];
      setNotifications(backendNotifications.length > 0 ? backendNotifications : generateSampleNotifications());
    } catch (err) {
      console.error("Fetch notifications error:", err.response?.data || err.message);
      // fallback locally so UI remains usable during backend work
      setNotifications(generateSampleNotifications());
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    if (!token) return;
    try {
      // Fix: Change endpoint from notification-settings to notifications/settings
      const res = await axios.get(`${VITE_BASE_URL}/api/notifications/settings`, axiosConfig);
      setNotificationSettings(res.data.settings || notificationSettings);
    } catch (err) {
      console.error("Fetch notification settings error:", err);
    }
  };

  const updateNotificationSettings = async (newSettings) => {
    try {
      // Fix: Change endpoint from notification-settings to notifications/settings
      await axios.put(`${VITE_BASE_URL}/api/notifications/settings`, newSettings, axiosConfig);
      setNotificationSettings(newSettings);
      setShowSettings(false);
    } catch (err) {
      console.error("Update notification settings error:", err);
      setNotificationSettings(newSettings);
      setShowSettings(false);
    }
  };

  // Generate sample notifications for demonstration
  const generateSampleNotifications = () => [
    {
      id: 1,
      title: "Subscription Renewal",
      message: "Your Netflix subscription will renew in 3 days for ₹649",
      type: "subscription",
      priority: "medium",
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      action_url: "/subscriptions"
    },
    {
      id: 2,
      title: "Budget Alert",
      message: "You've exceeded your Food & Dining budget by ₹1,200",
      type: "budget",
      priority: "high",
      is_read: false,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      action_url: "/budgets"
    },
    {
      id: 3,
      title: "Large Transaction",
      message: "Unusual spending of ₹8,500 detected at Electronics Store",
      type: "security",
      priority: "high",
      is_read: true,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      action_url: "/transactions"
    },
    {
      id: 4,
      title: "Weekly Report Ready",
      message: "Your weekly spending report is now available",
      type: "report",
      priority: "low",
      is_read: true,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      action_url: "/reports"
    },
    {
      id: 5,
      title: "Bill Payment Due",
      message: "Electricity bill of ₹2,300 due tomorrow",
      type: "billing",
      priority: "medium",
      is_read: true,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      action_url: "/transactions"
    },
    {
      id: 6,
      title: "System Maintenance",
      message: "Scheduled maintenance this weekend. Service may be temporarily unavailable.",
      type: "system",
      priority: "low",
      is_read: true,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      action_url: null
    },
    {
      id: 7,
      title: "Low Balance Alert",
      message: "Your account balance is below ₹5,000",
      type: "budget",
      priority: "medium",
      is_read: false,
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      action_url: "/dashboard"
    },
    {
      id: 8,
      title: "New Feature Available",
      message: "Check out the new budget forecasting feature in Analytics",
      type: "system",
      priority: "low",
      is_read: true,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      action_url: "/analytics"
    }
  ];

  useEffect(() => {
    async function load() {
      try {
        const { notifications } = await getNotifications();
        setNotifications(notifications || []);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    }
    load();
  }, []);

  const markAsReadHandler = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error("Mark as read error:", err);
      // Update local state if API fails
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    }
  };

  const markAllAsReadHandler = async () => {
    try {
      await markAllRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (err) {
      console.error("Mark all as read error:", err);
      // Update local state if API fails
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    }
  };

  const deleteNotificationHandler = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (err) {
      console.error("Delete notification error:", err);
      // Update local state if API fails
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.delete(`${VITE_BASE_URL}/api/notifications`, axiosConfig);
      setNotifications([]);
    } catch (err) {
      console.error("Clear all notifications error:", err);
      // Update local state if API fails
      setNotifications([]);
    }
  };

  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter(notification => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.is_read;
    return notification.type === filter;
  });

  // Calculate notification statistics
  const notificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    highPriority: notifications.filter(n => n.priority === "high" && !n.is_read).length,
    today: notifications.filter(n => {
      const today = new Date();
      const notificationDate = new Date(n.created_at);
      return notificationDate.toDateString() === today.toDateString();
    }).length
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-b from-black via-[#0a0014] to-[#1a002a] text-gray-100">
        <AdvancedSidebar
          user={user}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-purple-400 text-xl">
            Loading notifications... {/* Show this text while loading */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black via-[#0a0014] to-[#1a002a] text-gray-100">
      {/* Sidebar */}
      <AdvancedSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-4 md:p-6 mt-16 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-purple-400">Notifications</h1>
              <p className="text-gray-400 text-sm md:text-base">Stay updated with your financial activities</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all duration-200"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={markAllAsReadHandler}
                disabled={notificationStats.unread === 0}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-700 text-white rounded-lg hover:from-blue-700 hover:to-cyan-800 transition-all duration-200 disabled:opacity-50"
              >
                📭 Mark All Read
              </button>
            </div>
          </div>

          {/* Notification Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <span className="text-purple-400 text-lg">📢</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total</p>
                  <h3 className="text-lg font-semibold text-purple-400">
                    {notificationStats.total}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <span className="text-red-400 text-lg">🔔</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Unread</p>
                  <h3 className="text-lg font-semibold text-red-400">
                    {notificationStats.unread}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <span className="text-yellow-400 text-lg">⚠️</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">High Priority</p>
                  <h3 className="text-lg font-semibold text-yellow-400">
                    {notificationStats.highPriority}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <span className="text-green-400 text-lg">📅</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Today</p>
                  <h3 className="text-lg font-semibold text-green-400">
                    {notificationStats.today}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 p-4 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    filter === "all" 
                      ? "bg-purple-600 text-white" 
                      : "bg-transparent border border-purple-700 text-purple-400 hover:bg-purple-600/20"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    filter === "unread" 
                      ? "bg-red-600 text-white" 
                      : "bg-transparent border border-red-700 text-red-400 hover:bg-red-600/20"
                  }`}
                >
                  Unread
                </button>
                {Object.entries(notificationTypes).map(([key, type]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      filter === key 
                        ? `${type.bgColor} ${type.color} border ${type.color.replace('text', 'border')}` 
                        : "bg-transparent border border-gray-700 text-gray-400 hover:bg-gray-600/20"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="px-3 py-2 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition border border-red-700/50"
                >
                  🗑️ Clear All
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl shadow-md">
            <div className="p-4 border-b border-purple-800/30">
              <h3 className="text-lg font-semibold text-purple-300">
                {filter === "all" ? "All Notifications" : 
                 filter === "unread" ? "Unread Notifications" : 
                 `${notificationTypes[filter]?.label} Notifications`}
                <span className="text-gray-400 text-sm ml-2">({filteredNotifications.length})</span>
              </h3>
            </div>
            
            <div className="divide-y divide-purple-800/30">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-all ${
                      !notification.is_read ? 'bg-purple-900/10 border-l-4 border-l-purple-500' : 'bg-transparent'
                    } hover:bg-purple-900/20`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${notificationTypes[notification.type]?.bgColor || 'bg-gray-500/20'}`}>
                          <span className={notificationTypes[notification.type]?.color || 'text-gray-400'}>
                            {notificationTypes[notification.type]?.label.split(' ')[0]}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                              {notification.title}
                            </h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${priorityLevels[notification.priority]?.bgColor} ${priorityLevels[notification.priority]?.color}`}>
                              {priorityLevels[notification.priority]?.label}
                            </span>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                            )}
                          </div>
                          
                          <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{getTimeAgo(notification.created_at)}</span>
                            {notification.action_url && (
                              <a 
                                href={notification.action_url}
                                className="text-purple-400 hover:text-purple-300 transition"
                              >
                                View Details →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsReadHandler(notification.id)}
                            className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition"
                            title="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotificationHandler(notification.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                          title="Delete notification"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔔</div>
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No notifications</h3>
                  <p className="text-gray-500">You're all caught up! New alerts will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Notification Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[11000] p-4">
            <div className="bg-[#1b0128] border border-purple-700/50 rounded-xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-purple-300 mb-4">Notification Settings</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-700">
                      <div>
                        <div className="font-semibold text-white capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </div>
                        <div className="text-xs text-gray-400">
                          {getSettingDescription(key)}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateNotificationSettings(notificationSettings)}
                    className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white transition-all"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function for setting descriptions
function getSettingDescription(key) {
  const descriptions = {
    email_notifications: "Receive notifications via email",
    push_notifications: "Receive push notifications in browser",
    billing_reminders: "Get reminders for upcoming bill payments",
    subscription_alerts: "Get alerts about subscription renewals",
    budget_alerts: "Receive alerts when you exceed budget limits"
  };
  return descriptions[key] || "Notification setting";
}

export default NotificationsPage;