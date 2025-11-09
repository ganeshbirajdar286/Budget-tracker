// TrendsPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const TrendsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [timeRange, setTimeRange] = useState("month");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

  const categories = [
    { id: 1, name: "Food & Dining" },
    { id: 2, name: "Shopping" },
    { id: 3, name: "Transportation" },
    { id: 4, name: "Entertainment" },
    { id: 5, name: "Bills & Utilities" },
    { id: 6, name: "Healthcare" },
    { id: 7, name: "Salary" },
    { id: 8, name: "Investment" },
  ];

  const getCategoryName = (id) => {
    const cat = categories.find((c) => parseInt(c.id) === parseInt(id));
    return cat ? cat.name : "Unknown";
  };

  const token = localStorage.getItem("token");
  
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch user & transactions on mount
  useEffect(() => {
    fetchUser();
    fetchTransactions();
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

  const fetchTransactions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/transactions`, axiosConfig);
      setTransactions(res.data.transactions || res.data);
    } catch (err) {
      console.error("Fetch transactions error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const processChartData = () => {
    if (!transactions.length) return [];

    const now = new Date();
    let months = [];
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        timestamp: date.getTime()
      });
    }

    return months.map(({ month, timestamp }) => {
      const monthStart = new Date(timestamp);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      
      const monthTransactions = transactions.filter(t => {
        if (!t.transaction_date) return false;
        const transactionDate = new Date(t.transaction_date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const expenses = monthTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const savings = income - expenses;

      // Category-wise expenses
      const categoryExpenses = {};
      categories.forEach(cat => {
        categoryExpenses[cat.name] = monthTransactions
          .filter(t => parseInt(t.category_id) === cat.id && t.type === "expense")
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      });

      return {
        month,
        income: Math.round(income),
        expenses: Math.round(expenses),
        savings: Math.round(savings),
        ...categoryExpenses
      };
    });
  };

  const chartData = processChartData();

  // Calculate insights with safe defaults
  const calculateInsights = () => {
    const defaultInsights = {
      topGrowingCategory: { name: "No data", growth: 0 },
      mostSpentCategory: { name: "No data", amount: 0, percentage: 0 },
      savingsGrowth: 0,
      currentSavings: 0
    };

    if (chartData.length < 2) {
      // If we have current month data only
      if (chartData.length === 1) {
        const current = chartData[0];
        let mostSpentCategory = { name: "No data", amount: 0, percentage: 0 };
        
        categories.forEach(cat => {
          const amount = current[cat.name] || 0;
          if (amount > mostSpentCategory.amount) {
            mostSpentCategory = { 
              name: cat.name, 
              amount: Math.round(amount), 
              percentage: current.expenses > 0 ? Math.round((amount / current.expenses) * 100) : 0 
            };
          }
        });

        return {
          ...defaultInsights,
          mostSpentCategory,
          currentSavings: current.savings
        };
      }
      return defaultInsights;
    }

    const current = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];

    // Top growing category
    let topGrowingCategory = { name: "No significant growth", growth: 0 };
    categories.forEach(cat => {
      const currentAmount = current[cat.name] || 0;
      const previousAmount = previous[cat.name] || 0;
      const growth = previousAmount > 0 ? ((currentAmount - previousAmount) / previousAmount) * 100 : 0;
      
      if (growth > topGrowingCategory.growth && Math.abs(growth) > 5) {
        topGrowingCategory = { name: cat.name, growth: Math.round(growth) };
      }
    });

    // Most spent category
    let mostSpentCategory = { name: "No expenses", amount: 0, percentage: 0 };
    const totalExpenses = current.expenses;
    
    if (totalExpenses > 0) {
      categories.forEach(cat => {
        const amount = current[cat.name] || 0;
        const percentage = (amount / totalExpenses) * 100;
        
        if (amount > mostSpentCategory.amount) {
          mostSpentCategory = { 
            name: cat.name, 
            amount: Math.round(amount), 
            percentage: Math.round(percentage) 
          };
        }
      });
    }

    // Savings trend
    let savingsGrowth = 0;
    if (previous.savings !== 0) {
      savingsGrowth = ((current.savings - previous.savings) / Math.abs(previous.savings)) * 100;
    } else if (current.savings > 0) {
      savingsGrowth = 100;
    }

    return {
      topGrowingCategory,
      mostSpentCategory,
      savingsGrowth: Math.round(savingsGrowth),
      currentSavings: current.savings
    };
  };

  const insights = calculateInsights();

  // AI Suggestions with safe data access
  const generateAISuggestions = () => {
    const suggestions = [];
    
    // Safe access to insights properties
    if (insights.mostSpentCategory && insights.mostSpentCategory.percentage > 40) {
      suggestions.push(`Your spending on ${insights.mostSpentCategory.name} is ${insights.mostSpentCategory.percentage}% of total expenses. Consider diversifying your spending.`);
    }
    
    if (insights.savingsGrowth < 0) {
      suggestions.push("Your savings decreased this month. Review your recent expenses to identify areas for improvement.");
    }
    
    if (insights.topGrowingCategory && insights.topGrowingCategory.growth > 50) {
      suggestions.push(`Your ${insights.topGrowingCategory.name} spending grew by ${insights.topGrowingCategory.growth}%. Make sure this aligns with your budget goals.`);
    }

    // Check subscription expenses safely
    if (chartData.length > 0) {
      const currentData = chartData[chartData.length - 1];
      const subscriptionExpense = currentData["Bills & Utilities"] || 0;
      if (subscriptionExpense > 1000) {
        suggestions.push(`You're spending ₹${subscriptionExpense} on subscriptions. Review recurring payments to optimize costs.`);
      }
    }

    // Add general suggestions if no specific ones
    if (suggestions.length === 0) {
      if (chartData.length === 0) {
        suggestions.push("Start adding transactions to see personalized insights and trends.");
      } else if (insights.currentSavings > 0) {
        suggestions.push("Your financial trends look healthy! Keep monitoring your spending patterns.");
      } else {
        suggestions.push("Track your income and expenses regularly to build better financial habits.");
      }
    }

    return suggestions;
  };

  const aiSuggestions = generateAISuggestions();

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1b0128] border border-purple-700 p-3 rounded-lg shadow-lg">
          <p className="text-purple-300 font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ₹{entry.value?.toLocaleString('en-IN') || 0}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const downloadBlob = (data, mimeType, filename) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportExcel = async () => {
    if (!token) { alert("Sign in required"); return; }
    try {
      setLoading(true);
      const res = await axios.get(`${VITE_BASE_URL}/api/reports/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "arraybuffer",
      });
      const filename = `budget-report-${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;
      downloadBlob(res.data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
    } catch (err) {
      console.error("Export Excel error:", err);
      alert("Failed to export Excel");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!token) { alert("Sign in required"); return; }
    try {
      setLoading(true);
      const res = await axios.get(`${VITE_BASE_URL}/api/reports/export/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "arraybuffer",
      });
      const filename = `budget-report-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
      downloadBlob(res.data, "application/pdf", filename);
    } catch (err) {
      console.error("Export PDF error:", err);
      alert("Failed to export PDF");
    } finally {
      setLoading(false);
    }
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
          <div className="text-purple-400 text-xl">Loading trends...</div>
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
              <h1 className="text-2xl md:text-3xl font-bold text-purple-400">Financial Trends</h1>
              <p className="text-gray-400 text-sm md:text-base">Visualize your spending, income, and savings patterns</p>
            </div>
            
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent border border-purple-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last 6 Months</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* 📊 Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Growing Category */}
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-5 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <span className="text-green-400 text-lg">📈</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Top Growing Category</p>
                  <h3 className="text-lg font-semibold text-green-400">
                    {insights.topGrowingCategory.name} {insights.topGrowingCategory.growth > 0 ? '+' : ''}{insights.topGrowingCategory.growth}%
                  </h3>
                  <p className="text-xs text-gray-500">from last month</p>
                </div>
              </div>
            </div>

            {/* Most Spent Category */}
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-5 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <span className="text-red-400 text-lg">💸</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Most Spent Category</p>
                  <h3 className="text-lg font-semibold text-red-400">
                    {insights.mostSpentCategory.name} ₹{insights.mostSpentCategory.amount.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {insights.mostSpentCategory.percentage > 0 ? `(${insights.mostSpentCategory.percentage}% of expenses)` : '(No expenses)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Saving Trend */}
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-5 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <span className="text-blue-400 text-lg">💰</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Saving Trend</p>
                  <h3 className="text-lg font-semibold text-blue-400">
                    {insights.savingsGrowth > 0 ? '+' : ''}{insights.savingsGrowth}%
                  </h3>
                  <p className="text-xs text-gray-500">this month</p>
                </div>
              </div>
            </div>
          </div>

          {/* 📈 Income vs Expense Chart */}
          <div className="h-[22rem] sm:h-[20rem] md:h-[24rem]">
  {chartData.length > 0 ? (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#3b0764" />
        <XAxis
          dataKey="month"
          stroke="#a855f7"
          tick={{ fontSize: 12 }}
          tickLine={false}
        />
        <YAxis
          stroke="#a855f7"
          tick={{ fontSize: 12 }}
          tickLine={false}
          tickFormatter={(value) =>
            value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value
          }
          domain={[0, "auto"]}
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
            paddingTop: "5px",
          }}
        />

        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        <Area
          type="monotone"
          dataKey="income"
          stroke="#10B981"
          fill="url(#colorIncome)"
          strokeWidth={2}
          name="Income"
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="#EF4444"
          fill="url(#colorExpenses)"
          strokeWidth={2}
          name="Expenses"
        />
      </AreaChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex items-center justify-center h-full text-gray-400">
      No data available for the selected period
    </div>
  )}
</div>


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 💰 Savings Growth Chart */}
            <div className="h-[22rem] sm:h-[20rem] md:h-[24rem]">
  {chartData.length > 0 ? (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#3b0764" />
        <XAxis
          dataKey="month"
          stroke="#a855f7"
          tick={{ fontSize: 12 }}
          tickLine={false}
        />
        <YAxis
          stroke="#a855f7"
          tick={{ fontSize: 12 }}
          tickLine={false}
          tickFormatter={(value) =>
            value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value
          }
          domain={[0, "auto"]}
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
            paddingTop: "5px",
          }}
        />

        <defs>
          <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        <Line
          type="monotone"
          dataKey="savings"
          stroke="#3B82F6"
          strokeWidth={3}
          dot={{ r: 4, fill: "#3B82F6", strokeWidth: 2, stroke: "#1b0128" }}
          activeDot={{ r: 6, fill: "#60A5FA" }}
          name="Savings"
        />
      </LineChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex items-center justify-center h-full text-gray-400">
      No savings data available
    </div>
  )}
</div>


            {/* 🏷️ Category Trend Comparison */}
            <div className="h-[25rem] sm:h-[22rem] md:h-[24rem]">
  {chartData.length > 0 ? (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#3b0764" />
        <XAxis
          dataKey="month"
          stroke="#a855f7"
          tick={{ fontSize: 12 }}
          tickLine={false}
        />
        <YAxis
          stroke="#a855f7"
          tick={{ fontSize: 12 }}
          tickLine={false}
          tickFormatter={(value) =>
            value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value
          }
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
            name,
          ]}
        />

        <Legend
          wrapperStyle={{
            fontSize: "12px",
            color: "#a855f7",
            paddingTop: "5px",
          }}
        />

       <Bar
  dataKey="Food & Dining"
  stackId="a"
  fill="#F59E0B"
  name="Food & Dining"
  radius={[6, 6, 0, 0]}
/>
<Bar
  dataKey="Shopping"
  stackId="a"
  fill="#8B5CF6"
  name="Shopping"
  radius={[6, 6, 0, 0]}
/>
<Bar
  dataKey="Transportation"
  stackId="a"
  fill="#06B6D4"
  name="Transportation"
  radius={[6, 6, 0, 0]}
/>
<Bar
  dataKey="Bills & Utilities"
  stackId="a"
  fill="#10B981"
  name="Bills & Utilities"
  radius={[6, 6, 0, 0]}
/>
<Bar
  dataKey="Investment"
  stackId="a"
  fill="#3B82F6"
  name="Investment"
  radius={[6, 6, 0, 0]}
/>

      </BarChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex items-center justify-center h-full text-gray-400">
      No category data available
    </div>
  )}
</div>
</div>

          {/* 🤖 AI Insights & Suggestions */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-5 shadow-md">
            <h3 className="text-lg font-semibold text-purple-300 mb-4">💡 Insights & Suggestions</h3>
            <div className="space-y-3">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-purple-900/20 rounded-lg border border-purple-700/30">
                  <span className="text-purple-400 mt-1">💭</span>
                  <p className="text-gray-300 text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optional: Export Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={exportExcel}
              className="bg-white/5 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition"
            >
              Export Excel
            </button>
            <button
              onClick={exportPDF}
              className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 transition"
            >
              Export PDF
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TrendsPage;