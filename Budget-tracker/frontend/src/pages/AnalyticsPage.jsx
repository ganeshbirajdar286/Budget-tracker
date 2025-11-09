// AnalyticsPage.jsx
import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import axios from "axios";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, BarChart, Bar, AreaChart, Area
} from "recharts";
import { motion } from "framer-motion";
import { 
  FiTrendingUp, FiPieChart, FiCalendar, FiBarChart2, 
  FiActivity, FiDollarSign, FiTarget, FiAward, 
  FiArrowUp, FiArrowDown, FiRefreshCw, FiZap
} from "react-icons/fi";

const AnalyticsPage = () => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all"); // "week", "month", "year", "all"

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = localStorage.getItem("token");

  console.log("Analytics token:", token);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const categories = [
    { id: 1, name: "Food & Dining", color: "#f43f5e", icon: "🍕" },
    { id: 2, name: "Shopping", color: "#8b5cf6", icon: "🛍️" },
    { id: 3, name: "Transportation", color: "#06b6d4", icon: "🚗" },
    { id: 4, name: "Entertainment", color: "#eab308", icon: "🎬" },
    { id: 5, name: "Bills & Utilities", color: "#84cc16", icon: "💡" },
    { id: 6, name: "Healthcare", color: "#ef4444", icon: "🏥" },
    { id: 7, name: "Salary", color: "#22c55e", icon: "💰" },
    { id: 8, name: "Investment", color: "#3b82f6", icon: "📈" },
  ];

  const getCategoryName = (id) =>
    categories.find((c) => parseInt(c.id) === parseInt(id))?.name || "Unknown";

  const getCategoryColor = (id) =>
    categories.find((c) => parseInt(c.id) === parseInt(id))?.color || "#6b7280";

  const getCategoryIcon = (id) =>
    categories.find((c) => parseInt(c.id) === parseInt(id))?.icon || "📊";

  // safe parse of amount (handles strings, null, undefined)
  const safeAmount = (t) => {
    if (!t) return 0;
    const val = typeof t === "object" ? t.amount : t;
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  };

  // fetch helpers (same pattern as TransactionPage)
  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/users/me`, axiosConfig);
      setUser(res.data.user || res.data);
    } catch (err) {
      console.error("Fetch user error (analytics):", err);
    }
  };

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/transactions`, axiosConfig);
      // support both shapes: { transactions: [...] } or [...]
      setTransactions(res.data.transactions || res.data || []);
    } catch (err) {
      console.error("Fetch transactions error (analytics):", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // if no token, skip and set loading false so UI can show guest state
    if (!token) {
      setLoading(false);
      return;
    }
    fetchUser();
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount

  // Filter transactions based on time range
  const getFilteredTransactions = () => {
    const now = new Date();
    const filterDate = new Date();

    switch (timeRange) {
      case "week":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "month":
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return transactions;
    }

    return transactions.filter(t => {
      if (!t.transaction_date) return false;
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= filterDate;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Income & Expense Totals
  const totalIncome = filteredTransactions
    .filter((t) => String(t.type).toLowerCase() === "income")
    .reduce((a, b) => a + safeAmount(b), 0);

  const totalExpense = filteredTransactions
    .filter((t) => String(t.type).toLowerCase() === "expense")
    .reduce((a, b) => a + safeAmount(b), 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Monthly aggregation (keyed by YYYY-M)
  const monthlyData = {};
  filteredTransactions.forEach((t) => {
    if (!t.transaction_date) return;
    const d = new Date(t.transaction_date);
    if (isNaN(d)) return;
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!monthlyData[key]) {
      monthlyData[key] = {
        month: `${d.toLocaleDateString("en-US", { month: "short" })} ${d.getFullYear()}`,
        income: 0,
        expense: 0,
        savings: 0,
      };
    }
    if (String(t.type).toLowerCase() === "income") {
      monthlyData[key].income += safeAmount(t);
    } else {
      monthlyData[key].expense += safeAmount(t);
    }
    monthlyData[key].savings = monthlyData[key].income - monthlyData[key].expense;
  });

  const monthlyChart = Object.values(monthlyData).slice(-6);

  // Category-wise spending
  const categoryData = categories
    .map((c) => {
      const value = filteredTransactions
        .filter((t) => String(t.type).toLowerCase() === "expense" && parseInt(t.category_id) === c.id)
        .reduce((sum, t) => sum + safeAmount(t), 0);
      return { 
        name: c.name, 
        value, 
        color: c.color, 
        icon: c.icon,
        percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0 
      };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  // Top spending categories
  const topSpendingCategories = categoryData.slice(0, 3);

  // Average values
  const expenseCount = filteredTransactions.filter((t) => String(t.type).toLowerCase() === "expense").length || 1;
  const incomeCount = filteredTransactions.filter((t) => String(t.type).toLowerCase() === "income").length || 1;

  const avgExpense = totalExpense / expenseCount;
  const avgIncome = totalIncome / incomeCount;

  // Recent transactions for quick view
  const recentTransactions = filteredTransactions
    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-purple-300">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-3"
        >
          <FiRefreshCw className="w-6 h-6" />
          <span>Loading analytics...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black via-[#0a0014] to-[#1a002a] text-gray-100">
      {/* Sidebar */}
      <AdvancedSidebar
        user={user || { username: "Guest" }}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-4 md:p-6 mt-16 flex flex-col gap-8">
          {/* Header with Time Filter */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-purple-400">Financial Analytics</h1>
              <p className="text-gray-400 text-sm">Deep insights into your spending & saving patterns 📊</p>
            </div>
            
            {/* Time Range Filter */}
            <motion.div className="flex gap-2 mt-4 md:mt-0">
              {[
                { key: "week", label: "This Week" },
                { key: "month", label: "This Month" },
                { key: "year", label: "This Year" },
                { key: "all", label: "All Time" }
              ].map((range) => (
                <motion.button
                  key={range.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTimeRange(range.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range.key
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                      : "bg-[#1b0128]/50 text-gray-300 hover:bg-purple-900/30"
                  } border border-purple-800/30`}
                >
                  {range.label}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          {/* Financial Health Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-800/30 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <FiAward className="w-8 h-8 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Financial Health</h3>
                  <p className="text-gray-300 text-sm">Based on your spending patterns</p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="text-4xl font-bold text-green-400"
                >
                  {Math.max(0, Math.min(100, Math.round(savingsRate * 2 + 50)))}/100
                </motion.div>
                <div className="w-32 h-2 bg-gray-700 rounded-full mt-2 mx-auto">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(0, Math.min(100, Math.round(savingsRate * 2 + 50)))}%` }}
                    transition={{ delay: 0.7, duration: 1 }}
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: "Total Income", 
                value: totalIncome, 
                color: "text-green-400", 
                icon: FiTrendingUp,
                trend: "positive" 
              },
              { 
                title: "Total Expenses", 
                value: totalExpense, 
                color: "text-red-400", 
                icon: FiPieChart,
                trend: "negative" 
              },
              { 
                title: "Net Savings", 
                value: netSavings, 
                color: netSavings >= 0 ? "text-emerald-400" : "text-red-400", 
                icon: FiTarget,
                trend: netSavings >= 0 ? "positive" : "negative" 
              },
              { 
                title: "Savings Rate", 
                value: savingsRate, 
                color: savingsRate >= 20 ? "text-green-400" : savingsRate >= 10 ? "text-yellow-400" : "text-red-400", 
                icon: FiZap,
                isPercentage: true 
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-6 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.title}</p>
                    <h2 className={`text-2xl font-bold ${stat.color} mt-2`}>
                      {stat.isPercentage ? 
                        `${stat.value.toFixed(1)}%` : 
                        `₹${stat.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                      }
                    </h2>
                    {stat.trend && (
                      <div className={`flex items-center gap-1 mt-2 text-xs ${
                        stat.trend === "positive" ? "text-green-400" : "text-red-400"
                      }`}>
                        {stat.trend === "positive" ? <FiArrowUp /> : <FiArrowDown />}
                        <span>{stat.trend === "positive" ? "Healthy" : "Needs attention"}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-purple-900/30">
                    <stat.icon className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Monthly Overview */}
            <motion.div
              className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-6 backdrop-blur-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <FiCalendar className="text-purple-400 w-5 h-5" />
                <h3 className="text-xl font-semibold text-purple-300">Monthly Overview</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyChart}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3b0764" />
                  <XAxis dataKey="month" stroke="#a855f7" />
                  <YAxis stroke="#a855f7" />
                  <Tooltip 
                    contentStyle={{ 
                      background: "#1b0128", 
                      border: "1px solid #6b21a8",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend />
                  <Area type="monotone" dataKey="income" stroke="#22c55e" fillOpacity={1} fill="url(#incomeGradient)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#expenseGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Expense Breakdown */}
            <motion.div
              className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-6 backdrop-blur-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <FiPieChart className="text-purple-400 w-5 h-5" />
                <h3 className="text-xl font-semibold text-purple-300">Expense Breakdown</h3>
              </div>
              {categoryData.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3 mt-4 lg:mt-0 lg:ml-4">
                    {categoryData.slice(0, 4).map((category, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-purple-900/20"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{category.icon}</span>
                          <span className="text-sm text-gray-300">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">₹{category.value.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">{category.percentage.toFixed(1)}%</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-6">No expense data available.</p>
              )}
            </motion.div>
          </div>

          {/* Bottom Row */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Income vs Expense Bar */}
  <motion.div
    className="lg:col-span-2 bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-6 backdrop-blur-sm"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
  >
    <div className="flex items-center gap-2 mb-6">
      <FiBarChart2 className="text-purple-400 w-5 h-5" />
      <h3 className="text-xl font-semibold text-purple-300">
        Income vs Expenses
      </h3>
    </div>

   <ResponsiveContainer width="100%" height={280}>
  <BarChart
    data={[{ name: "You", income: totalIncome, expense: totalExpense }]}
    barCategoryGap="30%"
    barGap={6}
    margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
  >
    <CartesianGrid strokeDasharray="3 3" stroke="#3b0764" />
    <XAxis
      dataKey="name"
      stroke="#a855f7"
      tick={{ fontSize: 12 }}
    />
    <YAxis
      stroke="#a855f7"
      tick={{ fontSize: 12 }}
      tickFormatter={(value) => 
        value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value
      } // ✅ Formats large numbers
      domain={[0, "dataMax + 10000"]}
    />

    <Tooltip
      contentStyle={{
        backgroundColor: "#1b0128",
        border: "1px solid #6b21a8",
        borderRadius: "8px",
        color: "#fff",
      }}
      formatter={(value, name) => [
        `₹${value.toLocaleString("en-IN")}`,
        name.charAt(0).toUpperCase() + name.slice(1),
      ]}
    />

    <Legend
      wrapperStyle={{
        fontSize: "12px",
        color: "#a855f7",
      }}
    />

    <Bar
      dataKey="income"
      fill="#22c55e"
      radius={[6, 6, 0, 0]}
      barSize={40}
    />
    <Bar
      dataKey="expense"
      fill="#ef4444"
      radius={[6, 6, 0, 0]}
      barSize={40}
    />
  </BarChart>
</ResponsiveContainer>

  </motion.div>
            {/* Top Categories & Recent Activity */}
            <motion.div
              className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-6 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <FiActivity className="text-purple-400 w-5 h-5" />
                <h3 className="text-xl font-semibold text-purple-300">Top Categories</h3>
              </div>
              <div className="space-y-4">
                {topSpendingCategories.map((category, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-purple-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-gray-300">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">₹{category.value.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">{category.percentage.toFixed(1)}%</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Savings Tip */}
              {savingsRate < 20 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-6 p-4 rounded-lg bg-yellow-900/20 border border-yellow-800/30"
                >
                  <div className="flex items-center gap-2 text-yellow-400 mb-2">
                    <FiTarget className="w-4 h-4" />
                    <span className="text-sm font-medium">Savings Tip</span>
                  </div>
                  <p className="text-xs text-yellow-300">
                    {savingsRate < 0 
                      ? "You're spending more than you earn. Consider reviewing your expenses."
                      : "Aim for 20% savings rate for better financial health."
                    }
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnalyticsPage;