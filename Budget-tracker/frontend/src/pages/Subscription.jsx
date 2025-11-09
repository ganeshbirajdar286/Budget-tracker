// SubscriptionsPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [newSubscription, setNewSubscription] = useState({
    name: "",
    amount: "",
    currency: "INR",
    billing_cycle: "monthly",
    category: "entertainment",
    next_billing_date: "",
    status: "active",
    description: ""
  });

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

  // Update the categories array with better contrasting colors
  const categories = [
    { value: "entertainment", label: "🎬 Entertainment", color: "text-violet-300", bgColor: "bg-violet-900/30" },
    { value: "productivity", label: "💼 Productivity", color: "text-blue-300", bgColor: "bg-blue-900/30" },
    { value: "utilities", label: "🔧 Utilities", color: "text-green-300", bgColor: "bg-green-900/30" },
    { value: "software", label: "💻 Software", color: "text-orange-300", bgColor: "bg-orange-900/30" },
    { value: "fitness", label: "💪 Fitness", color: "text-red-300", bgColor: "bg-red-900/30" },
    { value: "music", label: "🎵 Music", color: "text-pink-300", bgColor: "bg-pink-900/30" },
    { value: "cloud", label: "☁️ Cloud Storage", color: "text-cyan-300", bgColor: "bg-cyan-900/30" },
    { value: "education", label: "📚 Education", color: "text-yellow-300", bgColor: "bg-yellow-900/30" },
    { value: "other", label: "📦 Other", color: "text-gray-300", bgColor: "bg-gray-900/30" }
  ];

  const billingCycles = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "lifetime", label: "Lifetime" }
  ];

  // Update the statusOptions array with better contrasting colors and backgrounds
  const statusOptions = [
    { 
      value: "active", 
      label: "Active", 
      color: "text-emerald-300",
      bgColor: "bg-emerald-900/50" 
    },
    { 
      value: "cancelled", 
      label: "Cancelled", 
      color: "text-red-300",
      bgColor: "bg-red-900/50" 
    },
    { 
      value: "paused", 
      label: "Paused", 
      color: "text-yellow-300",
      bgColor: "bg-yellow-900/50" 
    },
    { 
      value: "expired", 
      label: "Expired", 
      color: "text-gray-300",
      bgColor: "bg-gray-900/50" 
    }
  ];

  const token = localStorage.getItem("token");
  
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch user & subscriptions on mount
  useEffect(() => {
    fetchUser();
    fetchSubscriptions();
  }, []);

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

  const fetchSubscriptions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/subscriptions`, axiosConfig);
      setSubscriptions(res.data.subscriptions || res.data || []);
    } catch (err) {
      console.error("Fetch subscriptions error:", err);
      // Fallback to sample data if API fails
      setSubscriptions(getSampleSubscriptions());
    } finally {
      setLoading(false);
    }
  };

  // Sample data for demonstration
  const getSampleSubscriptions = () => [
    {
      id: 1,
      name: "Netflix",
      amount: 649,
      currency: "INR",
      billing_cycle: "monthly",
      category: "entertainment",
      next_billing_date: "2024-02-15",
      status: "active",
      description: "Premium Plan"
    },
    {
      id: 2,
      name: "Spotify",
      amount: 119,
      currency: "INR",
      billing_cycle: "monthly",
      category: "music",
      next_billing_date: "2024-02-20",
      status: "active",
      description: "Individual Plan"
    },
    {
      id: 3,
      name: "Adobe Creative Cloud",
      amount: 1799,
      currency: "INR",
      billing_cycle: "monthly",
      category: "software",
      next_billing_date: "2024-02-28",
      status: "active",
      description: "All Apps"
    }
  ];

  const handleAddSubscription = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${VITE_BASE_URL}/api/subscriptions`, newSubscription, axiosConfig);
      fetchSubscriptions();
      setShowAddModal(false);
      setNewSubscription({
        name: "",
        amount: "",
        currency: "INR",
        billing_cycle: "monthly",
        category: "entertainment",
        next_billing_date: "",
        status: "active",
        description: ""
      });
    } catch (err) {
      console.error("Add subscription error:", err);
      // For demo purposes, add to local state if API fails
      const newSub = {
        id: Date.now(),
        ...newSubscription,
        amount: parseFloat(newSubscription.amount)
      };
      setSubscriptions(prev => [...prev, newSub]);
      setShowAddModal(false);
      resetNewSubscription();
    }
  };

  const handleUpdateStatus = async (subscriptionId, newStatus) => {
    try {
      await axios.put(`${VITE_BASE_URL}/api/subscriptions/${subscriptionId}`, 
        { status: newStatus }, 
        axiosConfig
      );
      fetchSubscriptions();
    } catch (err) {
      console.error("Update subscription error:", err);
      // For demo purposes, update local state
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === subscriptionId ? { ...sub, status: newStatus } : sub
        )
      );
    }
  };

  const handleDeleteSubscription = async (subscriptionId) => {
    try {
      await axios.delete(`${VITE_BASE_URL}/api/subscriptions/${subscriptionId}`, axiosConfig);
      fetchSubscriptions();
    } catch (err) {
      console.error("Delete subscription error:", err);
      // For demo purposes, remove from local state
      setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
    }
  };

  const resetNewSubscription = () => {
    setNewSubscription({
      name: "",
      amount: "",
      currency: "INR",
      billing_cycle: "monthly",
      category: "entertainment",
      next_billing_date: "",
      status: "active",
      description: ""
    });
  };

  // Calculate subscription statistics
  const calculateStats = () => {
    const toNumber = (v) => {
      const n = typeof v === "number" ? v : parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };

    const totalMonthly = subscriptions
      .filter((sub) => sub.status === "active")
      .reduce((sum, sub) => {
        const amt = toNumber(sub.amount);

        let monthlyAmount = 0;
        switch ((sub.billing_cycle || "").toLowerCase()) {
          case "daily":
            monthlyAmount = amt * 30; // approximate
            break;
          case "weekly":
            monthlyAmount = amt * 4; // approximate
            break;
          case "monthly":
            monthlyAmount = amt;
            break;
          case "quarterly":
            monthlyAmount = amt / 3;
            break;
          case "yearly":
            monthlyAmount = amt / 12;
            break;
          case "lifetime":
            monthlyAmount = 0;
            break;
          default:
            monthlyAmount = amt;
        }

        return sum + monthlyAmount;
      }, 0);

    const totalYearly = totalMonthly * 12;
    const activeSubs = subscriptions.filter((sub) => sub.status === "active").length;

    const upcomingRenewals = subscriptions.filter((sub) => {
      if (sub.status !== "active") return false;
      const nextBilling = new Date(sub.next_billing_date);
      if (Number.isNaN(nextBilling.getTime())) return false;
      const today = new Date();
      const diffTime = nextBilling - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length;

    return {
      totalMonthly: Math.round(totalMonthly),
      totalYearly: Math.round(totalYearly),
      activeSubs,
      upcomingRenewals,
    };
  };

  const stats = calculateStats();

  // New stats card configuration
  const statsCards = [
    {
      title: "Monthly Cost",
      value: `₹${stats.totalMonthly.toLocaleString('en-IN')}`,
      subtitle: "Active subscriptions",
      icon: "💰",
      bgColor: "bg-green-500/20",
      textColor: "text-green-400"
    },
    {
      title: "Yearly Cost",
      value: `₹${stats.totalYearly.toLocaleString('en-IN')}`,
      subtitle: "Annual total",
      icon: "📊",
      bgColor: "bg-blue-500/20",
      textColor: "text-blue-400"
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubs,
      subtitle: "Currently active",
      icon: "📱",
      bgColor: "bg-purple-500/20",
      textColor: "text-purple-400"
    },
    {
      title: "Upcoming Renewals",
      value: stats.upcomingRenewals,
      subtitle: "Next 7 days",
      icon: "⏰",
      bgColor: "bg-yellow-500/20",
      textColor: "text-yellow-400"
    }
  ];

  // Filter subscriptions
  const filteredSubscriptions = subscriptions
    .filter(sub => filter === "all" || sub.status === filter)
    .filter(sub => 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label.split(' ')[0] : "📦";
  };

  const getStatusStyles = (status) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return {
      color: statusObj?.color || "text-gray-300",
      bgColor: statusObj?.bgColor || "bg-gray-900/50"
    };
  };

  const getDaysUntilBilling = (billingDate) => {
    const today = new Date();
    const billing = new Date(billingDate);
    const diffTime = billing - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
          <div className="text-purple-400 text-xl">Loading subscriptions...</div>
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

      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-3 sm:p-4 md:p-6 mt-16 flex flex-col gap-4 md:gap-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Subscriptions
              </h1>
              <p className="text-sm text-gray-400">
                Manage your recurring subscriptions and payments
              </p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span>
              <span>Add Subscription</span>
            </button>
          </div>

          {/* Stats Cards - Updated Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {statsCards.map((card, index) => (
              <div key={index} className={`bg-[#1b0128]/70 backdrop-blur-sm border border-purple-800/30 rounded-xl p-4 shadow-lg hover:shadow-purple-500/10 transition-all duration-300`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${card.bgColor} rounded-lg`}>
                    <span className={`${card.textColor} text-lg`}>{card.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{card.title}</p>
                    <h3 className="text-lg font-semibold {card.textColor}">
                      {card.value}
                    </h3>
                    <p className="text-xs text-gray-500">{card.subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters - Mobile Responsive */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 p-3 sm:p-4 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 sm:flex-none bg-purple-900/20 border border-purple-700/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="all">All Status</option>
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>

              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search subscriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-purple-900/20 border border-purple-700/50 rounded-lg pl-9 pr-3 py-2 text-sm placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
            </div>
          </div>

          {/* Subscriptions Table - Mobile Responsive */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
              <table className="min-w-full text-sm">
                <thead className="bg-purple-950/50 text-purple-300 uppercase text-xs">
                  <tr>
                    <th className="py-3 px-4 text-left">Service</th>
                    <th className="py-3 px-4 text-left">Amount</th>
                    <th className="py-3 px-4 text-left">Billing Cycle</th>
                    <th className="py-3 px-4 text-left">Category</th>
                    <th className="py-3 px-4 text-left">Next Billing</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((subscription) => {
                    const daysUntilBilling = getDaysUntilBilling(subscription.next_billing_date);
                    return (
                    <tr key={subscription.id} className="border-t border-purple-800/30 hover:bg-purple-900/20 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getCategoryIcon(subscription.category)}</span>
                          <div>
                            <div className="font-semibold text-white">{subscription.name}</div>
                            <div className="text-xs text-gray-400">{subscription.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        ₹{parseFloat(subscription.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 capitalize text-gray-300">
                        {subscription.billing_cycle}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          categories.find(c => c.value === subscription.category)?.color || 'text-gray-300'
                        } ${categories.find(c => c.value === subscription.category)?.bgColor || 'bg-gray-900/30'}`}>
                          {subscription.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-300">
                          {new Date(subscription.next_billing_date).toLocaleDateString()}
                        </div>
                        <div className={`text-xs ${
                          daysUntilBilling <= 3 ? 'text-red-400' : 
                          daysUntilBilling <= 7 ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          {daysUntilBilling > 0 ? `${daysUntilBilling} days` : 'Today'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                          getStatusStyles(subscription.status).color
                        } ${getStatusStyles(subscription.status).bgColor}`}>
                          {subscription.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {subscription.status === "active" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(subscription.id, "paused")}
                                className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded hover:bg-yellow-500/30 transition"
                              >
                                Pause
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(subscription.id, "cancelled")}
                                className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {subscription.status === "paused" && (
                            <button
                              onClick={() => handleUpdateStatus(subscription.id, "active")}
                              className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded hover:bg-green-500/30 transition"
                            >
                              Resume
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSubscription(subscription.id)}
                            className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded hover:bg-gray-500/30 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
              
              {filteredSubscriptions.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  {subscriptions.length === 0 ? 
                    "No subscriptions found. Add your first subscription to get started." : 
                    "No subscriptions match your filters."
                  }
                </div>
              )}
            </div>
          </div>

          {/* Mobile View for Subscriptions */}
          <div className="block sm:hidden">
            {filteredSubscriptions.map((subscription) => (
              <div key={subscription.id} 
                className="p-4 border-b border-purple-800/30 hover:bg-purple-900/20 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCategoryIcon(subscription.category)}</span>
                    <div>
                      <div className="font-semibold text-white">{subscription.name}</div>
                      <div className="text-xs text-gray-400">{subscription.description}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    getStatusStyles(subscription.status).color
                  } ${getStatusStyles(subscription.status).bgColor}`}>
                    {subscription.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  <div>
                    <span className="text-gray-400">Amount:</span>
                    <span className="ml-2 font-semibold">₹{parseFloat(subscription.amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Cycle:</span>
                    <span className="ml-2 capitalize">{subscription.billing_cycle}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Next Bill:</span>
                    <span className="ml-2">{new Date(subscription.next_billing_date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3">
                  {subscription.status === "active" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(subscription.id, "paused")}
                        className="flex-1 px-2 py-1.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-lg hover:bg-yellow-500/30 transition"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(subscription.id, "cancelled")}
                        className="flex-1 px-2 py-1.5 bg-red-500/20 text-red-400 text-xs rounded-lg hover:bg-red-500/30 transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {subscription.status === "paused" && (
                    <button
                      onClick={() => handleUpdateStatus(subscription.id, "active")}
                      className="flex-1 px-2 py-1.5 bg-green-500/20 text-green-400 text-xs rounded-lg hover:bg-green-500/30 transition"
                    >
                      Resume
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteSubscription(subscription.id)}
                    className="flex-1 px-2 py-1.5 bg-gray-500/20 text-gray-400 text-xs rounded-lg hover:bg-gray-500/30 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Category Breakdown - Responsive Grid */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 sm:p-5 shadow-lg">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4">
              📊 Subscription Categories
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {categories.map(category => {
                const categorySubs = subscriptions.filter(sub => 
                  sub.category === category.value && sub.status === "active"
                );
                const categoryTotal = categorySubs.reduce((sum, sub) => sum + parseFloat(sub.amount), 0);
                
                return (
                  <div 
                    key={category.value} 
                    className={`rounded-lg p-4 border border-gray-800 ${category.bgColor} backdrop-blur-sm`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{category.label.split(' ')[0]}</span>
                      <span className={`text-sm font-semibold ${category.color}`}>
                        {category.label.split(' ')[1]}
                      </span>
                    </div>
                    <div className={`text-2xl font-bold ${category.color}`}>
                      ₹{categoryTotal.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-gray-400">{categorySubs.length} subscriptions</div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Add Subscription Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[11000] p-4">
            <div className="bg-[#1b0128] border border-purple-700/50 rounded-xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-xl font-semibold text-purple-300 mb-4">Add New Subscription</h2>
              <form onSubmit={handleAddSubscription} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Service Name (e.g., Netflix, Spotify)"
                  value={newSubscription.name}
                  onChange={(e) => setNewSubscription({ ...newSubscription, name: e.target.value })}
                  required
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={newSubscription.amount}
                  onChange={(e) => setNewSubscription({ ...newSubscription, amount: e.target.value })}
                  required
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                />

                <select
                  value={newSubscription.billing_cycle}
                  onChange={(e) => setNewSubscription({ ...newSubscription, billing_cycle: e.target.value })}
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {billingCycles.map(cycle => (
                    <option key={cycle.value} value={cycle.value}>{cycle.label}</option>
                  ))}
                </select>

                <select
                  value={newSubscription.category}
                  onChange={(e) => setNewSubscription({ ...newSubscription, category: e.target.value })}
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={newSubscription.next_billing_date}
                  onChange={(e) => setNewSubscription({ ...newSubscription, next_billing_date: e.target.value })}
                  required
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                />

                <select
                  value={newSubscription.status}
                  onChange={(e) => setNewSubscription({ ...newSubscription, status: e.target.value })}
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>

                <textarea
                  placeholder="Description (optional)"
                  value={newSubscription.description}
                  onChange={(e) => setNewSubscription({ ...newSubscription, description: e.target.value })}
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={3}
                ></textarea>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white transition-all"
                  >
                    Add Subscription
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsPage;

/* Add to your index.css or tailwind.css */