// FinanceDashboard.jsx
import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import axios from "axios";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, LineChart, Line, AreaChart, 
  Area, Legend 
} from "recharts";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Wallet, 
  Target, Calendar, ArrowUpRight, 
  ArrowDownRight, PieChart as PieChartIcon,
  BarChart3, Download, PlusCircle, Import, Search
} from "lucide-react";

const FinanceDashboard = () => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("month");
  const [pieChartRadius, setPieChartRadius] = useState(80);

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = localStorage.getItem("token");

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // 🧩 Categories
  const categories = [
    { id: 1, name: "Food & Dining", color: "#f43f5e" },
    { id: 2, name: "Shopping", color: "#8b5cf6" },
    { id: 3, name: "Transportation", color: "#06b6d4" },
    { id: 4, name: "Entertainment", color: "#eab308" },
    { id: 5, name: "Bills & Utilities", color: "#84cc16" },
    { id: 6, name: "Healthcare", color: "#ef4444" },
    { id: 7, name: "Salary", color: "#22c55e" },
    { id: 8, name: "Investment", color: "#3b82f6" },
  ];

  const getCategoryName = (id) => {
    const cat = categories.find((c) => parseInt(c.id) === parseInt(id));
    return cat ? cat.name : "Unknown";
  };

  const getCategoryColor = (id) => {
    const cat = categories.find((c) => parseInt(c.id) === parseInt(id));
    return cat ? cat.color : "#6b7280";
  };

  // 🔹 Fetch User
  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/users/me`, axiosConfig);
      setUser(res.data.user);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  // 🔹 Fetch Transactions
  const fetchTransactions = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/transactions`, axiosConfig);
      setTransactions(res.data.transactions || res.data || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Hide labels below 5% (optional)
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="10"
        style={{ pointerEvents: "none" }}
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // 🔹 Export CSV Function
  const exportCSV = () => {
    const headers = ["Date", "Merchant", "Category", "Type", "Amount"];
    const csvData = transactions.map(t => [
      new Date(t.transaction_date).toLocaleDateString(),
      t.merchant || "N/A",
      getCategoryName(t.category_id),
      t.type || "unknown",
      t.amount || 0
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // 🔹 Import Function (placeholder)
  const handleImport = () => {
    alert("Import functionality would be implemented here!");
  };

  // 🔹 Filter transactions based on search
  const filteredTransactions = transactions.filter(transaction =>
    (transaction.merchant?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    getCategoryName(transaction.category_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.type?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // 🔹 useEffect — on load
  useEffect(() => {
    fetchUser();
    fetchTransactions();
  }, []);

  // 🔹 Safe amount calculation
  const getSafeAmount = (transaction) => {
    if (!transaction || transaction.amount === undefined || transaction.amount === null) {
      return 0;
    }
    return parseFloat(transaction.amount) || 0;
  };

  // 🔹 Summary Calculations with safe handling
  const totalIncome = transactions
    .filter((t) => t?.type === "income")
    .reduce((sum, t) => sum + getSafeAmount(t), 0);

  const totalExpenses = transactions
    .filter((t) => t?.type === "expense")
    .reduce((sum, t) => sum + getSafeAmount(t), 0);

  const totalBalance = totalIncome - totalExpenses;

  const savingsGoal = 5000;
  const goalProgress = Math.min((totalBalance / savingsGoal) * 100, 100);

  // 🔹 Monthly Trends Data with safe handling
  const getMonthlyData = () => {
    const monthlyData = {};
    
    transactions.forEach(transaction => {
      if (!transaction || !transaction.transaction_date) return;
      
      try {
        const date = new Date(transaction.transaction_date);
        if (isNaN(date.getTime())) return;
        
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { 
            income: 0, 
            expenses: 0, 
            month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
          };
        }
        
        const amount = getSafeAmount(transaction);
        if (transaction.type === 'income') {
          monthlyData[monthYear].income += amount;
        } else if (transaction.type === 'expense') {
          monthlyData[monthYear].expenses += amount;
        }
      } catch (error) {
        console.warn('Error processing transaction date:', error);
      }
    });
    
    return Object.values(monthlyData).slice(-6);
  };

  // 🔹 Weekly Spending with safe handling - FIXED VERSION
  const getWeeklySpending = () => {
  // Initialize last 7 days (oldest → newest)
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      amount: 0
    };
  }).reverse();

  // Fill data
  transactions.forEach(transaction => {
    if (!transaction || transaction.type !== "expense") return;

    try {
      const amount = getSafeAmount(transaction);
      if (!amount) return;

      const transactionDate = new Date(transaction.transaction_date);
      if (isNaN(transactionDate.getTime())) return;

      const today = new Date();
      const diffTime = today - transactionDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays < 7) {
        weeklyData[6 - diffDays].amount += amount; // ✅ correct index alignment
      }
    } catch (error) {
      console.warn('Error processing transaction for weekly spending:', error);
    }
  });

  return weeklyData;
};
  // 🔹 Data for Pie Chart (Expenses by Category) with safe handling
  const expenseByCategory = categories
    .map((cat) => ({
      name: cat.name,
      value: transactions
        .filter((t) => t?.type === "expense" && parseInt(t.category_id) === cat.id)
        .reduce((sum, t) => sum + getSafeAmount(t), 0),
      color: cat.color,
    }))
    .filter((c) => c.value > 0);

  // 🔹 Data for Bar Chart (Income vs Expense)
  const barData = [
    { name: "Income", amount: totalIncome, fill: "#22c55e" },
    { name: "Expense", amount: totalExpenses, fill: "#ef4444" },
    { name: "Balance", amount: totalBalance, fill: "#8b5cf6" },
  ];

  // 🔹 Recent Transactions with icons
  const recentTransactions = filteredTransactions
    .slice()
    .reverse()
    .slice(0, 8);

  // 🔹 Lock body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "auto";
  }, [mobileSidebarOpen]);

  // 🔹 Adjust pie chart radius on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 480) setPieChartRadius(100);
      else if (window.innerWidth < 768) setPieChartRadius(90);
      else setPieChartRadius(80);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-purple-400">Dashboard</h1>
              <p className="text-gray-400 text-sm">
                Welcome back, {user ? user.username : "User"} 👋
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <button onClick={exportCSV} className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:from-purple-700 hover:to-indigo-800 transition-all">
                <Download size={16} /> Export CSV
              </button>
              <button className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:from-green-700 hover:to-emerald-600 transition-all">
                <PlusCircle size={16} /> Add
              </button>
              <button onClick={handleImport} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:from-blue-700 hover:to-cyan-600 transition-all">
                <Import size={16} /> Import
              </button>
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions by merchant, category, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1b0128]/70 border border-purple-800/30 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {[
              {
                title: "Total Balance",
                value: totalBalance,
                color: "text-purple-300",
                icon: Wallet,
                trend: totalBalance >= 0 ? "up" : "down",
              },
              {
                title: "Total Income",
                value: totalIncome,
                color: "text-green-400",
                icon: TrendingUp,
                trend: "up",
              },
              {
                title: "Total Expenses",
                value: totalExpenses,
                color: "text-red-400",
                icon: TrendingDown,
                trend: "down",
              },
              {
                title: "Savings Goal",
                value: goalProgress,
                color: "text-purple-400",
                icon: Target,
                isProgress: true,
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-6 shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{card.title}</p>
                    <h2 className={`text-2xl font-bold ${card.color} mt-2`}>
                      {card.isProgress ? `${card.value.toFixed(1)}%` : `₹${card.value.toLocaleString("en-IN")}`}
                    </h2>
                  </div>
                  <div className={`p-3 rounded-lg ${card.trend === 'up' ? 'bg-green-500/20' : card.trend === 'down' ? 'bg-red-500/20' : 'bg-purple-500/20'}`}>
                    <card.icon className={`w-6 h-6 ${
                      card.trend === 'up' ? 'text-green-400' : 
                      card.trend === 'down' ? 'text-red-400' : 'text-purple-400'
                    }`} />
                  </div>
                </div>
                {card.isProgress && (
                  <div className="w-full bg-gray-800 rounded-full h-2 mt-4">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${card.value}%` }}
                    ></div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Monthly Trends Chart */}
            <motion.div 
              className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-6 shadow-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-semibold text-purple-300">
                  Monthly Trends
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getMonthlyData()}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3b0764" />
                  <XAxis dataKey="month" stroke="#a855f7" />
                  <YAxis stroke="#a855f7" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1b0128', 
                      border: '1px solid #6b21a8',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area type="monotone" dataKey="income" stroke="#22c55e" fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Weekly Spending - FIXED */}
            <motion.div 
              className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-6 shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-semibold text-purple-300">
                  Weekly Spending
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getWeeklySpending()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3b0764" />
                  <XAxis dataKey="day" stroke="#a855f7" />
                  <YAxis stroke="#a855f7" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1b0128', 
                      border: '1px solid #6b21a8',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar 
                    dataKey="amount" 
                    radius={[6, 6, 0, 0]}
                  >
                    {getWeeklySpending().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categories[index % categories.length].color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expense Distribution */}
           <motion.div 
  className="lg:col-span-1 bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-6 shadow-lg"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.5 }}
>
  <div className="flex items-center gap-2 mb-6">
    <PieChartIcon className="w-5 h-5 text-purple-400" />
    <h3 className="text-xl font-semibold text-purple-300">
      Expense Distribution
    </h3>
  </div>

  {expenseByCategory.length > 0 ? (
    <>
      <div className="w-full h-56 sm:h-64 md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expenseByCategory}
              dataKey="value"
              nameKey="name"
              outerRadius={pieChartRadius}
              labelLine={false}
              label={CustomLabel}
            >
              {expenseByCategory.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1b0128",
                border: "1px solid #6b21a8",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        {expenseByCategory.map((category, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-gray-300">{category.name}</span>
            </div>
            <span className="text-purple-300 font-medium">
              ₹{category.value.toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
    </>
  ) : (
    <p className="text-gray-400 text-sm text-center py-8">
      No expense data available.
    </p>
  )}
</motion.div>


            {/* Recent Transactions */}
            <motion.div 
              className="lg:col-span-2 bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-6 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <h3 className="text-xl font-semibold text-purple-300">
                    Recent Transactions
                  </h3>
                </div>
                <span className="text-sm text-purple-400">
                  {filteredTransactions.length} transactions found
                </span>
              </div>

              {loading ? (
                <p className="text-gray-400 text-center py-6">Loading transactions...</p>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((t) => (
                      <motion.div
                        key={t.transaction_id}
                        className="flex items-center justify-between p-4 bg-purple-900/20 rounded-lg border border-purple-800/30 hover:border-purple-600/50 transition-all"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${getCategoryColor(t.category_id)}20` }}
                          >
                            {t.type === "income" ? (
                              <ArrowUpRight className="w-4 h-4" style={{ color: getCategoryColor(t.category_id) }} />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" style={{ color: getCategoryColor(t.category_id) }} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-100">{t.merchant || "Unknown Merchant"}</p>
                            <p className="text-sm text-gray-400">{getCategoryName(t.category_id)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            t.type === "income" ? "text-green-400" : "text-red-400"
                          }`}>
                            {t.type === "income" ? "+" : "-"}₹
                            {getSafeAmount(t).toLocaleString("en-IN")}
                          </p>
                          <p className="text-sm text-gray-400">
                            {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : "Unknown date"}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-6">
                      {searchTerm ? "No transactions match your search." : "No transactions found."}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinanceDashboard;